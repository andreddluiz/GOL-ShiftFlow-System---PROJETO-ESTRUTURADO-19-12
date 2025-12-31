
import { 
  Base, User, Category, Task, Control, 
  DefaultLocationItem, DefaultTransitItem, DefaultCriticalItem,
  ShelfLifeItem, CustomControlType, CustomControlItem,
  ShiftHandover, Indicator, Report, OutraAtividade, MonthlyCollection, MeasureType
} from './types';
import { BASES, CATEGORIES, TASKS, CONTROLS, USERS, DEFAULT_LOCATIONS, DEFAULT_TRANSITS, DEFAULT_CRITICALS } from './constants';

const STORAGE_KEYS = {
  BASES: 'gol_shiftflow_bases_v2',
  USERS: 'gol_shiftflow_users_v2',
  CATEGORIES: 'gol_shiftflow_categories_v2',
  TASKS: 'gol_shiftflow_tasks_v2',
  CONTROLS: 'gol_shiftflow_controls_v2',
  DEF_LOCS: 'gol_shiftflow_def_locations_v2',
  DEF_TRANS: 'gol_shiftflow_def_transits_v2',
  DEF_CRIT: 'gol_shiftflow_def_criticals_v2',
  DEF_SHELF: 'gol_shiftflow_def_shelf_v2',
  CUSTOM_TYPES: 'gol_shiftflow_custom_control_types',
  CUSTOM_ITEMS: 'gol_shiftflow_custom_control_items',
  FINISHED_HANDOVERS: 'gol_shiftflow_finished_handovers',
  INDICATORS: 'gol_shiftflow_indicators',
  REPORTS: 'gol_shiftflow_reports',
  REP_ACOMPANHAMENTO: 'gol_rep_acompanhamento',
  REP_RESUMO: 'gol_rep_resumo',
  REP_MENSAL: 'gol_rep_mensal',
  REP_MENSAL_RESUMO: 'gol_rep_mensal_resumo',
  REP_MENSAL_DETALHADO: 'gol_rep_mensal_detalhado',
  REP_DETALHAMENTO: 'gol_rep_detalhamento',
  MONTHLY_COLLECTIONS: 'gol_shiftflow_monthly_collections',
  SHARED_DRAFTS: 'gol_shiftflow_shared_drafts',
  BASE_STATUS: 'gol_shiftflow_base_status'
};

const getFromStorage = <T>(key: string, defaultVal: T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
};

const saveToStorage = <T>(key: string, data: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("[DEBUG Storage] Erro ao salvar storage", key, e);
  }
};

export const timeUtils = {
  converterMinutosParaHoras: (totalMinutes: number) => {
    const horas = Math.floor(totalMinutes / 60);
    const minutos = Math.floor(totalMinutes % 60);
    const segundos = Math.round((totalMinutes * 60) % 60);
    return { horas, minutos, segundos };
  },
  somarMinutos: (h1: number, m1: number, h2: number, m2: number) => {
    const total = (h1 * 60 + m1) + (h2 * 60 + m2);
    const conv = timeUtils.converterMinutosParaHoras(total);
    return { horas: conv.horas, minutos: conv.minutos };
  },
  formatToHms: (h: number, m: number, s: number = 0) => {
    return `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.floor(m)).padStart(2, '0')}:${String(Math.round(s)).padStart(2, '0')}`;
  },
  minutesToHhmmss: (totalMinutes: number): string => {
    if (isNaN(totalMinutes) || totalMinutes <= 0) return '00:00:00';
    const totalSeconds = Math.round(totalMinutes * 60);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
};

function formatarControle(items: any[]): string {
  if (!items || items.length === 0) return '';
  return items
    .filter(item => item.dataVencimento || item.dataMaisAntigo || item.dataSaida || item.quantidade !== undefined || item.saldoSistema !== undefined)
    .map(item => {
        if (item.saldoSistema !== undefined) return `${item.partNumber}: S${item.saldoSistema}/F${item.saldoFisico}`;
        const desc = item.partNumber || item.nomeLocation || item.nomeTransito || 'Item';
        const val = item.dataVencimento || item.dataMaisAntigo || item.dataSaida || item.quantidade;
        return `${desc} (${val})`;
    })
    .join(' | ');
}

function criarMapaTarefas(detalhe: any, allTasks: Task[]): Record<string, string> {
  const tarefasMap: Record<string, string> = {};
  
  allTasks.sort((a, b) => a.ordem - b.ordem).forEach(t => {
    tarefasMap[t.nome.toUpperCase()] = '00:00:00';
  });

  if (detalhe.activities && Array.isArray(detalhe.activities)) {
    detalhe.activities.forEach((atividade: any) => {
      if (atividade.taskNome) {
        tarefasMap[atividade.taskNome.toUpperCase()] = atividade.formatted || '00:00:00';
      }
    });
  }
  
  if (detalhe.nonRoutineTasks && Array.isArray(detalhe.nonRoutineTasks)) {
    detalhe.nonRoutineTasks.forEach((tarefa: any) => {
      if (tarefa.nome && tarefa.nome.trim() !== '') {
        let tempoFinal = tarefa.tempo || '00:00:00';
        if (tarefa.tipoMedida === MeasureType.QTD) {
           const minsTotal = (parseFloat(tarefa.tempo) || 0) * (tarefa.fatorMultiplicador || 0);
           tempoFinal = timeUtils.minutesToHhmmss(minsTotal);
        } else if (tempoFinal.split(':').length === 2) {
           tempoFinal += ':00';
        }
        tarefasMap[tarefa.nome.toUpperCase()] = tempoFinal;
      }
    });
  }
  
  return tarefasMap;
}

// Função auxiliar para garantir formato DD/MM/AAAA
function normalizarDataExibicao(dataStr: string): string {
  if (!dataStr) return '';
  // Se já estiver no formato DD/MM/AAAA, retorna
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataStr)) return dataStr;
  // Se estiver no formato AAAA-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) {
    const [y, m, d] = dataStr.split('-');
    return `${d}/${m}/${y}`;
  }
  return dataStr;
}

export const validationService = {
  validarPassagem: (handover: ShiftHandover, tasks: Task[], categories: Category[]) => {
    const camposPendentes: string[] = [];
    
    // Obrigatoriedade do Cabeçalho - Nomes de grupo atualizados
    if (!handover.turnoId) camposPendentes.push("Configuração - Turno: Campo obrigatório");
    if (!handover.colaboradores.some(c => c !== null)) camposPendentes.push("Configuração - Equipe: Pelo menos um colaborador é obrigatório");
    if (!handover.informacoesImportantes?.trim()) camposPendentes.push("Observações - Notas da Base: Informações importantes são obrigatórias");

    // Obrigatoriedade de Controles Diários - Nomes de grupo atualizados
    handover.shelfLifeData.forEach((i, idx) => {
      if (!i.partNumber || !i.lote || !i.dataVencimento) camposPendentes.push(`Controles Diários - Shelf Life: Linha ${idx+1} - PN, Lote e Vencimento são obrigatórios.`);
    });
    handover.locationsData.forEach((i, idx) => {
      if (!i.nomeLocation || i.quantidade === null || (!i.dataMaisAntigo && i.quantidade > 0)) camposPendentes.push(`Controles Diários - Locations: Linha ${idx+1} - Nome, Qtd e Data (se Qtd > 0) são obrigatórios.`);
    });
    handover.transitData.forEach((i, idx) => {
      if (!i.nomeTransito || i.quantidade === null || (!i.dataSaida && i.quantidade > 0)) camposPendentes.push(`Controles Diários - Trânsito: Linha ${idx+1} - Tipo, Qtd e Data (se Qtd > 0) são obrigatórios.`);
    });
    handover.criticalData.forEach((i, idx) => {
      if (!i.partNumber || i.saldoSistema === null || i.saldoFisico === null || (!i.lote && (i.saldoSistema > 0 || i.saldoFisico > 0))) camposPendentes.push(`Controles Diários - Saldo Crítico: Linha ${idx+1} - PN, Lote (se saldo > 0), Sistema e Físico são obrigatórios.`);
    });

    // Validação de tarefas operacionais em formato LISTA (Ajustado para permitir 0)
    tasks.forEach(task => {
      const cat = categories.find(c => c.id === task.categoriaId);
      if (cat?.exibicao === 'lista') {
        const val = handover.tarefasExecutadas[task.id];
        // Somente dá erro se o campo for literalmente vazio, null ou undefined. Zero e 00:00:00 são válidos.
        if (val === undefined || val === null || val === '') {
          camposPendentes.push(`Processos Operacionais - ${cat.nome}: O campo "${task.nome}" deve ser preenchido.`);
        }
      }
    });

    return { valido: camposPendentes.length === 0, camposPendentes };
  },
  validarPassagemDuplicada: async (data: string, turnoId: string, baseId: string) => {
    const dataNorm = normalizarDataExibicao(data);
    const repDetalhamento = getFromStorage<any[]>(STORAGE_KEYS.REP_DETALHAMENTO, []);
    const duplicado = repDetalhamento.some(h => h.baseId === baseId && normalizarDataExibicao(h.data) === dataNorm && h.turnoId === turnoId);
    if (duplicado) return { valido: false, message: "Já existe uma passagem finalizada para este turno nesta data." };
    return { valido: true };
  },
  verificarColaboradoresEmOutrosTurnos: async (data: string, turnoId: string, baseId: string, colaboradoresIds: (string|null)[], allUsers: User[]) => {
    const dataNorm = normalizarDataExibicao(data);
    const repDetalhamento = getFromStorage<any[]>(STORAGE_KEYS.REP_DETALHAMENTO, []);
    const outrosTurnosDoDia = repDetalhamento.filter(h => h.baseId === baseId && normalizarDataExibicao(h.data) === dataNorm && h.turnoId !== turnoId);
    const idsPresentesEmOutros = new Set<string>();
    outrosTurnosDoDia.forEach(h => {
      if (h.colaboradoresIds) {
        h.colaboradoresIds.forEach((id: string) => { if (id) idsPresentesEmOutros.add(id); });
      }
    });
    const duplicados: string[] = [];
    colaboradoresIds.forEach(id => {
      if (id && idsPresentesEmOutros.has(id)) {
        const user = allUsers.find(u => u.id === id);
        if (user) duplicados.push(user.nome);
      }
    });
    return { colaboradoresDuplicados: duplicados };
  }
};

export const baseService = {
  async getAll(): Promise<Base[]> {
    let data = getFromStorage<Base[]>(STORAGE_KEYS.BASES, []);
    if (data.length === 0) {
      data = BASES;
      saveToStorage(STORAGE_KEYS.BASES, data);
    }
    return data.filter(b => !b.deletada);
  },
  async obterIdsBasesValidas(): Promise<string[]> {
    const bases = await this.getAll();
    return bases.filter(b => b.status === 'Ativa').map(b => b.id);
  },
  async baseExiste(baseId: string): Promise<boolean> {
    const ids = await this.obterIdsBasesValidas();
    return ids.includes(baseId);
  },
  async obterMetaHoras(baseId: string, mes: number): Promise<number> {
    const bases = await this.getAll();
    const base = bases.find(b => b.id === baseId);
    if (!base) return 160;
    const mesKey = String(mes).padStart(2, '0');
    return base.metaHorasDisponiveisAno?.[mesKey] || 160;
  },
  async obterMetasTodasAsBases(mes: number): Promise<Record<string, number>> {
    const bases = await this.getAll();
    const metas: Record<string, number> = {};
    const mesKey = String(mes).padStart(2, '0');
    bases.forEach(b => {
      metas[b.id] = b.metaHorasDisponiveisAno?.[mesKey] || 160;
    });
    return metas;
  },
  async create(data: Omit<Base, 'id'>): Promise<Base> {
    const bases = await this.getAll();
    const newBase = { ...data, id: Math.random().toString(36).substr(2, 9) } as Base;
    saveToStorage(STORAGE_KEYS.BASES, [...bases, newBase]);
    return newBase;
  },
  async update(id: string, data: Partial<Base>): Promise<void> {
    const bases = await this.getAll();
    const updated = bases.map(b => b.id === id ? { ...b, ...data } : b) as Base[];
    saveToStorage(STORAGE_KEYS.BASES, updated);
  },
  async delete(id: string): Promise<void> {
    const bases = await this.getAll();
    const updated = bases.map(b => b.id === id ? { ...b, deletada: true, status: 'Inativa' } : b) as Base[];
    saveToStorage(STORAGE_KEYS.BASES, updated);
  }
};

export const baseStatusService = {
  async saveBaseStatus(baseId: string, status: any): Promise<void> {
    const allStatuses = getFromStorage<Record<string, any>>(STORAGE_KEYS.BASE_STATUS, {});
    allStatuses[baseId] = { ...status, updatedAt: new Date().getTime() };
    saveToStorage(STORAGE_KEYS.BASE_STATUS, allStatuses);
  },
  async getBaseStatus(baseId: string): Promise<any | null> {
    const allStatuses = getFromStorage<Record<string, any>>(STORAGE_KEYS.BASE_STATUS, {});
    return allStatuses[baseId] || null;
  }
};

export const sharedDraftService = {
  async saveDraft(baseId: string, data: string, turnoId: string, content: any): Promise<void> {
    const drafts = getFromStorage<Record<string, any>>(STORAGE_KEYS.SHARED_DRAFTS, {});
    const key = `${baseId}_${data.replace(/\//g, '-')}_${turnoId}`;
    drafts[key] = { ...content, updatedAt: new Date().getTime() };
    saveToStorage(STORAGE_KEYS.SHARED_DRAFTS, drafts);
  },
  async getDraft(baseId: string, data: string, turnoId: string): Promise<any | null> {
    const drafts = getFromStorage<Record<string, any>>(STORAGE_KEYS.SHARED_DRAFTS, {});
    const key = `${baseId}_${data.replace(/\//g, '-')}_${turnoId}`;
    return drafts[key] || null;
  },
  async clearDraft(baseId: string, data: string, turnoId: string): Promise<void> {
    const drafts = getFromStorage<Record<string, any>>(STORAGE_KEYS.SHARED_DRAFTS, {});
    const key = `${baseId}_${data.replace(/\//g, '-')}_${turnoId}`;
    delete drafts[key];
    saveToStorage(STORAGE_KEYS.SHARED_DRAFTS, drafts);
  }
};

export const defaultItemsService = {
  async getLocations(): Promise<DefaultLocationItem[]> {
    let data = getFromStorage<DefaultLocationItem[]>(STORAGE_KEYS.DEF_LOCS, []);
    if (data.length === 0) { data = DEFAULT_LOCATIONS; saveToStorage(STORAGE_KEYS.DEF_LOCS, data); }
    return data;
  },
  async saveLocation(data: DefaultLocationItem): Promise<void> {
    const items = await this.getLocations();
    const existingIndex = items.findIndex(i => i.id === data.id);
    if (existingIndex > -1) items[existingIndex] = data; else items.push(data);
    saveToStorage(STORAGE_KEYS.DEF_LOCS, items);
  },
  async deleteLocation(id: string): Promise<void> {
    const items = await this.getLocations();
    const updated = items.map(i => i.id === id ? { ...i, deletada: true } : i) as DefaultLocationItem[];
    saveToStorage(STORAGE_KEYS.DEF_LOCS, updated);
  },
  async getTransits(): Promise<DefaultTransitItem[]> {
    let data = getFromStorage<DefaultTransitItem[]>(STORAGE_KEYS.DEF_TRANS, []);
    if (data.length === 0) { data = DEFAULT_TRANSITS; saveToStorage(STORAGE_KEYS.DEF_TRANS, data); }
    return data;
  },
  async saveTransit(data: DefaultTransitItem): Promise<void> {
    const items = await this.getTransits();
    const existingIndex = items.findIndex(i => i.id === data.id);
    if (existingIndex > -1) items[existingIndex] = data; else items.push(data);
    saveToStorage(STORAGE_KEYS.DEF_TRANS, items);
  },
  async deleteTransit(id: string): Promise<void> {
    const items = await this.getTransits();
    const updated = items.map(i => i.id === id ? { ...i, deletada: true } : i) as DefaultTransitItem[];
    saveToStorage(STORAGE_KEYS.DEF_TRANS, updated);
  },
  async getCriticals(): Promise<DefaultCriticalItem[]> {
    let data = getFromStorage<DefaultCriticalItem[]>(STORAGE_KEYS.DEF_CRIT, []);
    if (data.length === 0) { data = DEFAULT_CRITICALS; saveToStorage(STORAGE_KEYS.DEF_CRIT, data); }
    return data;
  },
  async saveCritical(data: DefaultCriticalItem): Promise<void> {
    const items = await this.getCriticals();
    const existingIndex = items.findIndex(i => i.id === data.id);
    if (existingIndex > -1) items[existingIndex] = data; else items.push(data);
    saveToStorage(STORAGE_KEYS.DEF_CRIT, items);
  },
  async deleteCritical(id: string): Promise<void> {
    const items = await this.getCriticals();
    const updated = items.map(i => i.id === id ? { ...i, deletada: true } : i) as DefaultCriticalItem[];
    saveToStorage(STORAGE_KEYS.DEF_CRIT, updated);
  },
  async getShelfLifes(): Promise<ShelfLifeItem[]> { return getFromStorage<ShelfLifeItem[]>(STORAGE_KEYS.DEF_SHELF, []); },
  async saveShelfLife(data: ShelfLifeItem): Promise<void> {
    const items = await this.getShelfLifes();
    const existingIndex = items.findIndex(i => i.id === data.id);
    if (existingIndex > -1) items[existingIndex] = data; else items.push(data);
    saveToStorage(STORAGE_KEYS.DEF_SHELF, items);
  },
  async deleteShelfLife(id: string): Promise<void> {
    const items = await this.getShelfLifes();
    const updated = items.map(i => i.id === id ? { ...i, deletada: true } : i) as ShelfLifeItem[];
    saveToStorage(STORAGE_KEYS.DEF_SHELF, updated);
  },
  async getCustomTypes(): Promise<CustomControlType[]> { return getFromStorage<CustomControlType[]>(STORAGE_KEYS.CUSTOM_TYPES, []); },
  async saveCustomType(data: CustomControlType): Promise<void> {
    const types = await this.getCustomTypes();
    const idx = types.findIndex(t => t.id === data.id);
    if (idx > -1) types[idx] = data; else types.push(data);
    saveToStorage(STORAGE_KEYS.CUSTOM_TYPES, types);
  },
  async deleteCustomType(id: string): Promise<void> {
    const types = await this.getCustomTypes();
    const updated = types.map(t => t.id === id ? { ...t, deletada: true } : t) as CustomControlType[];
    saveToStorage(STORAGE_KEYS.CUSTOM_TYPES, updated);
  },
  async getCustomItems(): Promise<CustomControlItem[]> { return getFromStorage<CustomControlItem[]>(STORAGE_KEYS.CUSTOM_ITEMS, []); },
  async saveCustomItem(data: CustomControlItem): Promise<void> {
    const items = await this.getCustomItems();
    const idx = items.findIndex(i => i.id === data.id);
    if (idx > -1) items[idx] = data; else items.push(data);
    saveToStorage(STORAGE_KEYS.CUSTOM_ITEMS, items);
  },
  async deleteCustomItem(id: string): Promise<void> {
    const items = await this.getCustomItems();
    const updated = items.map(i => i.id === id ? { ...i, deletada: true } : i) as CustomControlItem[];
    saveToStorage(STORAGE_KEYS.CUSTOM_ITEMS, updated);
  }
};

export const categoryService = {
  async getAll(): Promise<Category[]> {
    let data = getFromStorage<Category[]>(STORAGE_KEYS.CATEGORIES, []);
    if (data.length === 0) { data = CATEGORIES; saveToStorage(STORAGE_KEYS.CATEGORIES, data); }
    return data;
  },
  async create(data: Omit<Category, 'id'>): Promise<Category> {
    const cats = await this.getAll();
    const newCat = { ...data, id: Math.random().toString(36).substr(2, 9) } as Category;
    saveToStorage(STORAGE_KEYS.CATEGORIES, [...cats, newCat]);
    return newCat;
  },
  async update(id: string, data: Partial<Category>): Promise<void> {
    const cats = await this.getAll();
    const updated = cats.map(c => c.id === id ? { ...c, ...data } : c) as Category[];
    saveToStorage(STORAGE_KEYS.CATEGORIES, updated);
  },
  async delete(id: string): Promise<void> {
    const cats = await this.getAll();
    const updated = cats.map(c => c.id === id ? { ...c, deletada: true, status: 'Inativa', visivel: false } : c) as Category[];
    saveToStorage(STORAGE_KEYS.CATEGORIES, updated);
  }
};

export const taskService = {
  async getAll(): Promise<Task[]> {
    let data = getFromStorage<Task[]>(STORAGE_KEYS.TASKS, []);
    if (data.length === 0) { data = TASKS; saveToStorage(STORAGE_KEYS.TASKS, data); }
    return data;
  },
  async create(data: Omit<Task, 'id'>): Promise<Task> {
    const tasks = await this.getAll();
    const newTask = { ...data, id: Math.random().toString(36).substr(2, 9) } as Task;
    saveToStorage(STORAGE_KEYS.TASKS, [...tasks, newTask]);
    return newTask;
  },
  async update(id: string, data: Partial<Task>): Promise<void> {
    const tasks = await this.getAll();
    const updated = tasks.map(t => t.id === id ? { ...t, ...data } : t) as Task[];
    saveToStorage(STORAGE_KEYS.TASKS, updated);
  },
  async delete(id: string): Promise<void> {
    const tasks = await this.getAll();
    const updated = tasks.map(t => t.id === id ? { ...t, deletada: true, status: 'Inativa', visivel: false } : t) as Task[];
    saveToStorage(STORAGE_KEYS.TASKS, updated);
  }
};

export const controlService = {
  async getAll(): Promise<Control[]> {
    let data = getFromStorage<Control[]>(STORAGE_KEYS.CONTROLS, []);
    if (data.length === 0) { data = CONTROLS; saveToStorage(STORAGE_KEYS.CONTROLS, data); }
    return data;
  },
  async create(data: Omit<Control, 'id'>): Promise<Control> {
    const controls = await this.getAll();
    const newControl = { ...data, id: Math.random().toString(36).substr(2, 9) } as Control;
    saveToStorage(STORAGE_KEYS.CONTROLS, [...controls, newControl]);
    return newControl;
  },
  async update(id: string, data: Partial<Control>): Promise<void> {
    const controls = await this.getAll();
    const updated = controls.map(c => c.id === id ? { ...c, ...data } : c) as Control[];
    saveToStorage(STORAGE_KEYS.CONTROLS, updated);
  },
  async delete(id: string): Promise<void> {
    const controls = await this.getAll();
    saveToStorage(STORAGE_KEYS.CONTROLS, controls.filter(c => c.id !== id));
  }
};

export const userService = {
  async getAll(): Promise<User[]> {
    let data = getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
    if (data.length === 0) { data = USERS; saveToStorage(STORAGE_KEYS.USERS, data); }
    return data;
  },
  async create(data: Omit<User, 'id'>): Promise<User> {
    const users = await this.getAll();
    const newUser = { ...data, id: Math.random().toString(36).substr(2, 9) } as User;
    saveToStorage(STORAGE_KEYS.USERS, [...users, newUser]);
    return newUser;
  },
  async update(id: string, data: Partial<User>): Promise<void> {
    const users = await this.getAll();
    const updated = users.map(u => u.id === id ? { ...u, ...data } : u) as User[];
    saveToStorage(STORAGE_KEYS.USERS, updated);
  },
  async delete(id: string): Promise<void> {
    const users = await this.getAll();
    const updated = users.map(u => u.id === id ? { ...u, deletada: true, status: 'Inativo' } : u) as User[];
    saveToStorage(STORAGE_KEYS.USERS, updated);
  }
};

export const monthlyService = {
  async getAll(): Promise<MonthlyCollection[]> { return getFromStorage<MonthlyCollection[]>(STORAGE_KEYS.MONTHLY_COLLECTIONS, []); },
  async save(data: MonthlyCollection): Promise<void> {
    const collections = await this.getAll();
    const idx = collections.findIndex(c => c.id === data.id);
    if (idx > -1) collections[idx] = data; else collections.push(data);
    saveToStorage(STORAGE_KEYS.MONTHLY_COLLECTIONS, collections);
    await this.syncWithReports(collections);
  },
  async syncWithReports(collections: MonthlyCollection[]): Promise<void> {
    const storeTasks = getFromStorage<Task[]>(STORAGE_KEYS.TASKS, []);
    const storeCats = getFromStorage<Category[]>(STORAGE_KEYS.CATEGORIES, []);
    const storeBases = getFromStorage<Base[]>(STORAGE_KEYS.BASES, []);
    
    const finishedCollections = collections.filter(c => c.status === 'FINALIZADO');
    const repMensalDetalhado = finishedCollections.map(c => {
      const base = storeBases.find(b => b.id === c.baseId);
      let totalMins = 0;
      const tasksBase = storeTasks.filter(t => {
          const cat = storeCats.find(cat => cat.id === t.categoriaId);
          return cat?.tipo === 'mensal' && (!t.baseId || t.baseId === c.baseId);
      }).sort((a, b) => a.ordem - b.ordem);
      const tarefasMap: Record<string, string> = {};
      tasksBase.forEach(t => { tarefasMap[t.nome.toUpperCase()] = '00:00:00'; });
      const activities: any[] = [];
      Object.entries(c.tarefasValores).forEach(([taskId, val]) => {
        const task = storeTasks.find(t => t.id === taskId);
        if (!task) return;
        let mins = 0;
        if (task.tipoMedida === 'TEMPO') { const p = val.split(':').map(Number); mins = (p[0]||0) * 60 + (p[1]||0) + (p[2]||0)/60; }
        else { mins = (parseFloat(val) || 0) * task.fatorMultiplicador; }
        totalMins += mins;
        const formatted = timeUtils.minutesToHhmmss(mins);
        tarefasMap[task.nome.toUpperCase()] = formatted;
        const cat = storeCats.find(ct => ct.id === task.categoriaId);
        activities.push({ taskNome: task.nome, categoryNome: cat?.nome || 'Geral', formatted, ordemCat: cat?.ordem || 99, ordemTask: task.ordem || 99 });
      });
      const mesRefStr = `${String(c.mes).padStart(2, '0')}/${c.ano}`;
      return { id: c.id, baseId: c.baseId, mesReferencia: mesRefStr, data: mesRefStr, baseNome: base?.nome || c.baseId, baseSigla: base?.sigla || '', totalHoras: timeUtils.minutesToHhmmss(totalMins), tarefasMap, activities: activities.sort((a, b) => { if (a.ordemCat !== b.ordemCat) return a.ordemCat - b.ordemCat; return a.ordemTask - b.ordemTask; }), dataFinalizacao: c.dataFinalizacao, status: 'OK' };
    }).sort((a, b) => b.mesReferencia.localeCompare(a.mesReferencia));
    saveToStorage(STORAGE_KEYS.REP_MENSAL_DETALHADO, repMensalDetalhado);
  }
};

export const migrationService = {
  async reprocessarResumo(store: any): Promise<void> {
    const repDetalhamento = getFromStorage<any[]>(STORAGE_KEYS.REP_DETALHAMENTO, []);
    const repResumo: any = { categorias: [], totalMins: 0 };
    const allOpTasks = store.tasks.filter((t: any) => { const cat = store.categories.find((c: any) => c.id === t.categoriaId); return cat?.tipo === 'operacional'; });
    allOpTasks.forEach((task: any) => {
        const cat = store.categories.find((c: any) => c.id === task.categoriaId);
        if (!cat) return;
        let catResumo = repResumo.categorias.find((r: any) => r.categoryId === cat.id);
        if (!catResumo) { catResumo = { categoryId: cat.id, categoryNome: cat.nome, atividades: [], totalCategoryMins: 0, ordem: cat.ordem }; repResumo.categorias.push(catResumo); }
        let taskResumo = catResumo.atividades.find((a: any) => a.nome === task.nome);
        if (!taskResumo) { taskResumo = { nome: task.nome, tipoInput: task.tipoMedida === 'TEMPO' ? 'TIME' : 'QTY', totalQuantidade: 0, totalMins: 0, ordem: task.ordem }; catResumo.atividades.push(taskResumo); }
    });
    repDetalhamento.forEach(handover => {
      Object.entries(handover.tarefasExecutadas || {}).forEach(([taskId, val]: [string, any]) => {
        const task = store.tasks.find((t: any) => t.id === taskId);
        if (!task) return;
        const cat = store.categories.find((c: any) => c.id === task.categoriaId);
        if (!cat) return;
        let catResumo = repResumo.categorias.find((r: any) => r.categoryId === cat.id);
        if (!catResumo) { catResumo = { categoryId: cat.id, categoryNome: cat.nome, atividades: [], totalCategoryMins: 0, ordem: cat.ordem }; repResumo.categorias.push(catResumo); }
        let taskResumo = catResumo.atividades.find((a: any) => a.nome === task.nome);
        if (!taskResumo) { taskResumo = { nome: task.nome, tipoInput: task.tipoMedida === 'TEMPO' ? 'TIME' : 'QTY', totalQuantidade: 0, totalMins: 0, ordem: task.ordem }; catResumo.atividades.push(taskResumo); }
        let taskMins = 0;
        if (task.tipoMedida === 'TEMPO') { const parts = (val as string).split(':').map(Number); taskMins = (parts[0] * 60) + (parts[1] || 0) + (parts[2] || 0) / 60; }
        else { const qty = parseFloat(val as string) || 0; taskResumo.totalQuantidade += qty; taskMins = qty * task.fatorMultiplicador; }
        taskResumo.totalMins += taskMins; catResumo.totalCategoryMins += taskMins; repResumo.totalMins += taskMins;
      });
      if (handover.nonRoutineTasks) {
        handover.nonRoutineTasks.forEach((t: any) => {
           if (!t.nome || !t.tempo) return;
           const catId = t.categoriaId || 'cat_outras';
           const catRef = store.categories.find((c: any) => c.id === catId);
           let catResumo = repResumo.categorias.find((r: any) => r.categoryId === catId);
           if (!catResumo) { catResumo = { categoryId: catId, categoryNome: catRef?.nome || 'OUTROS', atividades: [], totalCategoryMins: 0, ordem: catRef?.ordem || 99 }; repResumo.categorias.push(catResumo); }
           let taskResumo = catResumo.atividades.find((a: any) => a.nome === t.nome);
           if (!taskResumo) { taskResumo = { nome: t.nome, tipoInput: t.tipoMedida === 'QTD' ? 'QTY' : 'TIME', totalQuantidade: 0, totalMins: 0, ordem: 999 }; catResumo.atividades.push(taskResumo); }
           let newMins = 0;
           if (t.tipoMedida === MeasureType.QTD) { const qty = parseFloat(t.tempo) || 0; taskResumo.totalQuantidade += qty; newMins = qty * (t.fatorMultiplicador || 0); }
           else { const parts = (t.tempo as string).split(':').map(Number); newMins = (parts[0] * 60) + (parts[1] || 0) + (parts[2] || 0) / 60; }
           taskResumo.totalMins += newMins; catResumo.totalCategoryMins += newMins; repResumo.totalMins += newMins;
        });
      }
    });
    repResumo.categorias.sort((a: any, b: any) => a.ordem - b.ordem);
    repResumo.categorias.forEach((c: any) => c.atividades.sort((a: any, b: any) => a.ordem - b.ordem));
    const finalResumo = { totalHoras: timeUtils.minutesToHhmmss(repResumo.totalMins), categorias: repResumo.categorias.map((c: any) => ({ ...c, totalCategoryFormatted: timeUtils.minutesToHhmmss(c.totalCategoryMins), atividades: c.atividades.map((a: any) => ({ ...a, totalFormatted: timeUtils.minutesToHhmmss(a.totalMins) })) })) };
    finalResumo.categorias = finalResumo.categorias.filter((c: any) => c.totalCategoryMins > 0);
    saveToStorage(STORAGE_KEYS.REP_RESUMO, finalResumo);
  },
  async processarMigracao(handover: ShiftHandover, store: any, replaceId?: string): Promise<void> {
    const repAcompanhamento = getFromStorage<any[]>(STORAGE_KEYS.REP_ACOMPANHAMENTO, []);
    const repDetalhamento = getFromStorage<any[]>(STORAGE_KEYS.REP_DETALHAMENTO, []);
    
    // 1. Normalizar data da passagem para DD/MM/AAAA para evitar duplicidade de formato
    const dataNormalizada = normalizarDataExibicao(handover.data);

    // Obter sigla real da base e o turno real
    const baseObj = store.bases.find((b: any) => b.id === handover.baseId);
    const turnoObj = baseObj?.turnos.find((t: any) => t.id === handover.turnoId);
    const turnoNumero = turnoObj?.numero || 1;

    // 2. Atualizar Acompanhamento (Status de Passagem) - Busca pela data normalizada
    let dataEntry = repAcompanhamento.find((r: any) => normalizarDataExibicao(r.data) === dataNormalizada && r.baseId === handover.baseId);
    if (!dataEntry) { 
      dataEntry = { baseId: handover.baseId, data: dataNormalizada, turno1: 'Pendente', turno2: 'Pendente', turno3: 'Pendente', turno4: 'Pendente' }; 
      repAcompanhamento.push(dataEntry); 
    }
    const turnoKey = `turno${turnoNumero}` as keyof typeof dataEntry;
    dataEntry[turnoKey] = 'OK';

    const colaboradoresNomes = handover.colaboradores.map(id => store.users.find((u:any) => u.id === id)?.nome).filter(Boolean);
    let hProdTotalMin = 0;
    
    const atividadesDetalhadas: any[] = [];

    // Processar tarefas rotineiras (lista)
    Object.entries(handover.tarefasExecutadas).forEach(([taskId, val]) => {
      const task = store.tasks.find((t: any) => t.id === taskId);
      const cat = store.categories.find((c: any) => c.id === task?.categoriaId);
      let mins = 0;
      if (task?.tipoMedida === 'TEMPO') { const p = val.split(':').map(Number); mins = (p[0]||0) * 60 + (p[1]||0) + (p[2]||0)/60; }
      else { mins = (parseFloat(val) || 0) * (task?.fatorMultiplicador || 0); }
      hProdTotalMin += mins;
      const conv = timeUtils.converterMinutosParaHoras(mins);
      atividadesDetalhadas.push({ taskNome: task?.nome || 'Desc.', categoryNome: cat?.nome || 'OUTROS', horas: conv.horas, minutos: conv.minutos, segundos: conv.segundos, formatted: timeUtils.minutesToHhmmss(mins), ordemCat: cat?.ordem || 0, ordemTask: task?.ordem || 0 });
    });

    // 3. Processar tarefas NÃO rotineiras (itens selecionados nas listas suspensas)
    // GARANTIA: Inclui mesmo que o valor seja 0, desde que tenha nome
    (handover.nonRoutineTasks || []).forEach(t => {
      if (!t.nome || t.nome.trim() === '') return;
      const catRef = store.categories.find((c: any) => c.id === t.categoriaId);
      let mins = 0;
      if (t.tipoMedida === MeasureType.QTD) mins = (parseFloat(t.tempo) || 0) * (t.fatorMultiplicador || 0);
      else { 
        if (t.tempo && t.tempo.includes(':')) {
          const p = t.tempo.split(':').map(Number); 
          mins = (p[0] * 60) + (p[1] || 0) + (p[2] || 0) / 60; 
        } else {
          mins = 0;
        }
      }
      hProdTotalMin += mins;
      const conv = timeUtils.converterMinutosParaHoras(mins);
      atividadesDetalhadas.push({ taskNome: t.nome, categoryNome: catRef?.nome || 'OUTROS', horas: conv.horas, minutos: conv.minutos, segundos: conv.segundos, formatted: timeUtils.minutesToHhmmss(mins), ordemCat: catRef?.ordem || 99, ordemTask: 999 });
    });

    const hDispTotalMin = handover.colaboradores.reduce((acc, id) => acc + (store.users.find((u:any) => u.id === id)?.jornadaPadrao || 0) * 60, 0);
    const performanceCalc = hDispTotalMin > 0 ? (hProdTotalMin / hDispTotalMin) * 100 : 0;
    const tasksBaseOp = store.tasks.filter((t: any) => { const cat = store.categories.find((c: any) => c.id === t.categoriaId); return cat?.tipo === 'operacional' && (!t.baseId || t.baseId === handover.baseId); }).sort((a, b) => { const catA = store.categories.find((c: any) => c.id === a.categoriaId); const catB = store.categories.find((c: any) => c.id === b.categoriaId); if ((catA?.ordem || 0) !== (catB?.ordem || 0)) return (catA?.ordem || 0) - (catB?.ordem || 0); return a.ordem - b.ordem; });
    
    const record = {
      ...handover,
      id: replaceId || handover.id,
      data: dataNormalizada, // 4. Salva no formato padrão DD/MM/AAAA
      colaboradoresIds: handover.colaboradores,
      horaRegistro: new Date().toLocaleTimeString('pt-BR'),
      turno: `Turno ${turnoNumero}`,
      colaboradores: colaboradoresNomes,
      nomeColaboradores: colaboradoresNomes.join(', '),
      qtdColaboradores: colaboradoresNomes.length,
      horasDisponivel: timeUtils.minutesToHhmmss(hDispTotalMin),
      horasProduzida: timeUtils.minutesToHhmmss(hProdTotalMin),
      percentualPerformance: Math.round(performanceCalc * 100) / 100,
      tarefasMap: criarMapaTarefas({ ...handover, activities: atividadesDetalhadas }, tasksBaseOp),
      shelfLife: formatarControle(handover.shelfLifeData),
      locations: formatarControle(handover.locationsData),
      transito: formatarControle(handover.transitData),
      saldoCritico: formatarControle(handover.criticalData),
      observacoes: handover.informacoesImportantes,
      shelfLifeItems: handover.shelfLifeData,
      locationItems: handover.locationsData,
      transitItems: handover.transitData,
      criticosItems: handover.criticalData,
      baseSigla: baseObj?.sigla || handover.baseId,
      activities: atividadesDetalhadas.sort((a, b) => { if (a.ordemCat !== b.ordemCat) return a.ordemCat - b.ordemCat; return a.ordemTask - b.ordemTask; }),
      outrasTarefas: handover.nonRoutineTasks
    };

    if (replaceId) { const idx = repDetalhamento.findIndex(d => d.id === replaceId); if (idx > -1) repDetalhamento[idx] = record; else repDetalhamento.push(record); }
    else repDetalhamento.push(record);
    
    saveToStorage(STORAGE_KEYS.REP_ACOMPANHAMENTO, repAcompanhamento);
    saveToStorage(STORAGE_KEYS.REP_DETALHAMENTO, repDetalhamento);
    await this.reprocessarResumo(store);
    await sharedDraftService.clearDraft(handover.baseId, handover.data, handover.turnoId);
    await baseStatusService.saveBaseStatus(handover.baseId, { obs: handover.informacoesImportantes, locations: handover.locationsData, transit: handover.transitData, shelfLife: handover.shelfLifeData, critical: handover.criticalData });
  }
};
