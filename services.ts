
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
  SHARED_DRAFTS: 'gol_shiftflow_shared_drafts'
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
    .filter(item => item.data || item.quantidade !== undefined)
    .map(item => item.data || item.quantidade)
    .join(' | ');
}

function criarMapaTarefas(detalhe: any): Record<string, string> {
  const tarefasMap: Record<string, string> = {};
  
  if (detalhe.activities && Array.isArray(detalhe.activities)) {
    detalhe.activities.forEach((atividade: any) => {
      if (atividade.taskNome) {
        const tempo = timeUtils.formatToHms(atividade.horas || 0, atividade.minutos || 0, atividade.segundos || 0);
        tarefasMap[atividade.taskNome.toUpperCase()] = tempo;
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
        tarefasMap[`[EXTRA] ${tarefa.nome.toUpperCase()}`] = tempoFinal;
      }
    });
  }
  
  return tarefasMap;
}

export const baseService = {
  async getAll(): Promise<Base[]> {
    let data = getFromStorage<Base[]>(STORAGE_KEYS.BASES, []);
    if (data.length === 0) {
      data = BASES;
      saveToStorage(STORAGE_KEYS.BASES, data);
    }
    return data;
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

export const sharedDraftService = {
  async saveDraft(baseId: string, data: string, turnoId: string, content: any): Promise<void> {
    const drafts = getFromStorage<Record<string, any>>(STORAGE_KEYS.SHARED_DRAFTS, {});
    // Fix: Using replace with global regex instead of replaceAll to avoid ES2021 dependency errors
    const key = `${baseId}_${data.replace(/\//g, '-')}_${turnoId}`;
    drafts[key] = {
      ...content,
      updatedAt: new Date().getTime()
    };
    saveToStorage(STORAGE_KEYS.SHARED_DRAFTS, drafts);
  },
  async getDraft(baseId: string, data: string, turnoId: string): Promise<any | null> {
    const drafts = getFromStorage<Record<string, any>>(STORAGE_KEYS.SHARED_DRAFTS, {});
    // Fix: Using replace with global regex instead of replaceAll to avoid ES2021 dependency errors
    const key = `${baseId}_${data.replace(/\//g, '-')}_${turnoId}`;
    return drafts[key] || null;
  },
  async clearDraft(baseId: string, data: string, turnoId: string): Promise<void> {
    const drafts = getFromStorage<Record<string, any>>(STORAGE_KEYS.SHARED_DRAFTS, {});
    // Fix: Using replace with global regex instead of replaceAll to avoid ES2021 dependency errors
    const key = `${baseId}_${data.replace(/\//g, '-')}_${turnoId}`;
    delete drafts[key];
    saveToStorage(STORAGE_KEYS.SHARED_DRAFTS, drafts);
  }
};

export const defaultItemsService = {
  async getLocations(): Promise<DefaultLocationItem[]> {
    let data = getFromStorage<DefaultLocationItem[]>(STORAGE_KEYS.DEF_LOCS, []);
    if (data.length === 0) {
      data = DEFAULT_LOCATIONS;
      saveToStorage(STORAGE_KEYS.DEF_LOCS, data);
    }
    return data;
  },
  async saveLocation(data: DefaultLocationItem): Promise<void> {
    const items = await this.getLocations();
    const existingIndex = items.findIndex(i => i.id === data.id);
    if (existingIndex > -1) items[existingIndex] = data;
    else items.push(data);
    saveToStorage(STORAGE_KEYS.DEF_LOCS, items);
  },
  async deleteLocation(id: string): Promise<void> {
    const items = await this.getLocations();
    const updated = items.map(i => i.id === id ? { ...i, deletada: true } : i) as DefaultLocationItem[];
    saveToStorage(STORAGE_KEYS.DEF_LOCS, updated);
  },

  async getTransits(): Promise<DefaultTransitItem[]> {
    let data = getFromStorage<DefaultTransitItem[]>(STORAGE_KEYS.DEF_TRANS, []);
    if (data.length === 0) {
      data = DEFAULT_TRANSITS;
      saveToStorage(STORAGE_KEYS.DEF_TRANS, data);
    }
    return data;
  },
  async saveTransit(data: DefaultTransitItem): Promise<void> {
    const items = await this.getTransits();
    const existingIndex = items.findIndex(i => i.id === data.id);
    if (existingIndex > -1) items[existingIndex] = data;
    else items.push(data);
    saveToStorage(STORAGE_KEYS.DEF_TRANS, items);
  },
  async deleteTransit(id: string): Promise<void> {
    const items = await this.getTransits();
    const updated = items.map(i => i.id === id ? { ...i, deletada: true } : i) as DefaultTransitItem[];
    saveToStorage(STORAGE_KEYS.DEF_TRANS, updated);
  },

  async getCriticals(): Promise<DefaultCriticalItem[]> {
    let data = getFromStorage<DefaultCriticalItem[]>(STORAGE_KEYS.DEF_CRIT, []);
    if (data.length === 0) {
      data = DEFAULT_CRITICALS;
      saveToStorage(STORAGE_KEYS.DEF_CRIT, data);
    }
    return data;
  },
  async saveCritical(data: DefaultCriticalItem): Promise<void> {
    const items = await this.getCriticals();
    const existingIndex = items.findIndex(i => i.id === data.id);
    if (existingIndex > -1) items[existingIndex] = data;
    else items.push(data);
    saveToStorage(STORAGE_KEYS.DEF_CRIT, items);
  },
  async deleteCritical(id: string): Promise<void> {
    const items = await this.getCriticals();
    const updated = items.map(i => i.id === id ? { ...i, deletada: true } : i) as DefaultCriticalItem[];
    saveToStorage(STORAGE_KEYS.DEF_CRIT, updated);
  },

  async getShelfLifes(): Promise<ShelfLifeItem[]> {
    return getFromStorage<ShelfLifeItem[]>(STORAGE_KEYS.DEF_SHELF, []);
  },
  async saveShelfLife(data: ShelfLifeItem): Promise<void> {
    const items = await this.getShelfLifes();
    const existingIndex = items.findIndex(i => i.id === data.id);
    if (existingIndex > -1) items[existingIndex] = data;
    else items.push(data);
    saveToStorage(STORAGE_KEYS.DEF_SHELF, items);
  },
  async deleteShelfLife(id: string): Promise<void> {
    const items = await this.getShelfLifes();
    const updated = items.map(i => i.id === id ? { ...i, deletada: true } : i) as ShelfLifeItem[];
    saveToStorage(STORAGE_KEYS.DEF_SHELF, updated);
  },

  async getCustomTypes(): Promise<CustomControlType[]> {
    return getFromStorage<CustomControlType[]>(STORAGE_KEYS.CUSTOM_TYPES, []);
  },
  async saveCustomType(data: CustomControlType): Promise<void> {
    const types = await this.getCustomTypes();
    const idx = types.findIndex(t => t.id === data.id);
    if (idx > -1) types[idx] = data;
    else types.push(data);
    saveToStorage(STORAGE_KEYS.CUSTOM_TYPES, types);
  },
  async deleteCustomType(id: string): Promise<void> {
    const types = await this.getCustomTypes();
    const updated = types.map(t => t.id === id ? { ...t, deletada: true } : t) as CustomControlType[];
    saveToStorage(STORAGE_KEYS.CUSTOM_TYPES, updated);
  },

  async getCustomItems(): Promise<CustomControlItem[]> {
    return getFromStorage<CustomControlItem[]>(STORAGE_KEYS.CUSTOM_ITEMS, []);
  },
  async saveCustomItem(data: CustomControlItem): Promise<void> {
    const items = await this.getCustomItems();
    const idx = items.findIndex(i => i.id === data.id);
    if (idx > -1) items[idx] = data;
    else items.push(data);
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
    if (data.length === 0) {
      data = CATEGORIES;
      saveToStorage(STORAGE_KEYS.CATEGORIES, data);
    }
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
    if (data.length === 0) {
      data = TASKS;
      saveToStorage(STORAGE_KEYS.TASKS, data);
    }
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
    if (data.length === 0) {
      data = CONTROLS;
      saveToStorage(STORAGE_KEYS.CONTROLS, data);
    }
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
    if (data.length === 0) {
      data = USERS;
      saveToStorage(STORAGE_KEYS.USERS, data);
    }
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
  async getAll(): Promise<MonthlyCollection[]> {
    return getFromStorage<MonthlyCollection[]>(STORAGE_KEYS.MONTHLY_COLLECTIONS, []);
  },

  async save(data: MonthlyCollection): Promise<void> {
    const collections = await this.getAll();
    const idx = collections.findIndex(c => c.id === data.id);
    if (idx > -1) collections[idx] = data;
    else collections.push(data);
    saveToStorage(STORAGE_KEYS.MONTHLY_COLLECTIONS, collections);
    await this.syncWithReports(collections);
  },

  async syncWithReports(collections: MonthlyCollection[]): Promise<void> {
    const storeTasks = getFromStorage<Task[]>(STORAGE_KEYS.TASKS, []);
    const storeCats = getFromStorage<Category[]>(STORAGE_KEYS.CATEGORIES, []);
    const storeBases = getFromStorage<Base[]>(STORAGE_KEYS.BASES, []);
    
    const finishedCollections = collections.filter(c => c.status === 'FINALIZADO');

    // 1. Gerar Detalhamento Mensal (Matriz analítica por mês/base)
    const repMensalDetalhado = finishedCollections.map(c => {
      const base = storeBases.find(b => b.id === c.baseId);
      let totalMins = 0;
      const tarefasMap: Record<string, string> = {};
      const activities: any[] = [];

      Object.entries(c.tarefasValores).forEach(([taskId, val]) => {
        const task = storeTasks.find(t => t.id === taskId);
        if (!task) return;
        
        let mins = 0;
        if (task.tipoMedida === 'TEMPO') {
          const p = val.split(':').map(Number);
          mins = (p[0]||0) * 60 + (p[1]||0) + (p[2]||0)/60;
        } else {
          mins = (parseFloat(val) || 0) * task.fatorMultiplicador;
        }
        totalMins += mins;
        
        const formatted = timeUtils.minutesToHhmmss(mins);
        tarefasMap[task.nome.toUpperCase()] = formatted;
        
        const cat = storeCats.find(ct => ct.id === task.categoriaId);
        activities.push({ taskNome: task.nome, categoryNome: cat?.nome || 'Geral', formatted });
      });

      return {
        id: c.id,
        mesReferencia: `${String(c.mes).padStart(2, '0')}/${c.ano}`,
        data: `${String(c.mes).padStart(2, '0')}/${c.ano}`, // Para facilitar filtro de data
        baseNome: base?.nome || c.baseId,
        baseSigla: base?.sigla || '',
        totalHoras: timeUtils.minutesToHhmmss(totalMins),
        tarefasMap,
        activities,
        dataFinalizacao: c.dataFinalizacao,
        status: 'OK'
      };
    }).sort((a, b) => b.mesReferencia.localeCompare(a.mesReferencia));

    saveToStorage(STORAGE_KEYS.REP_MENSAL_DETALHADO, repMensalDetalhado);

    // 2. Gerar Resumo Geral Mensal (Acumulado por categoria)
    const repResumo: any = { categorias: [], totalMins: 0 };
    
    finishedCollections.forEach(c => {
      Object.entries(c.tarefasValores).forEach(([taskId, val]) => {
        const task = storeTasks.find(t => t.id === taskId);
        if (!task) return;
        const cat = storeCats.find(ct => ct.id === task.categoriaId);
        if (!cat) return;

        let catResumo = repResumo.categorias.find((r: any) => r.categoryId === cat.id);
        if (!catResumo) {
          catResumo = { categoryId: cat.id, categoryNome: cat.nome, atividades: [], totalCategoryMins: 0 };
          repResumo.categorias.push(catResumo);
        }

        let taskResumo = catResumo.atividades.find((a: any) => a.nome === task.nome);
        if (!taskResumo) {
          taskResumo = { nome: task.nome, tipoInput: task.tipoMedida === 'TEMPO' ? 'TIME' : 'QTY', totalQuantidade: 0, totalMins: 0 };
          catResumo.atividades.push(taskResumo);
        }

        let taskMins = 0;
        if (task.tipoMedida === 'TEMPO') {
          const parts = (val as string).split(':').map(Number);
          taskMins = (parts[0] * 60) + (parts[1] || 0) + (parts[2] || 0) / 60;
        } else {
          const qty = parseFloat(val as string) || 0;
          taskResumo.totalQuantidade += qty;
          taskMins = qty * task.fatorMultiplicador;
        }
        taskResumo.totalMins += taskMins;
        catResumo.totalCategoryMins += taskMins;
        repResumo.totalMins += taskMins;
      });
    });

    const finalResumo = {
      totalHoras: timeUtils.minutesToHhmmss(repResumo.totalMins),
      categorias: repResumo.categorias.map((c: any) => ({
        ...c,
        totalCategoryFormatted: timeUtils.minutesToHhmmss(c.totalCategoryMins),
        atividades: c.atividades.map((a: any) => ({
          ...a,
          totalFormatted: timeUtils.minutesToHhmmss(a.totalMins)
        }))
      }))
    };

    saveToStorage(STORAGE_KEYS.REP_MENSAL_RESUMO, finalResumo);
    
    // Fallback para manter compatibilidade com tabela antiga se necessário
    const legacy = repMensalDetalhado.map(d => ({
      id: d.id,
      mesReferencia: d.mesReferencia,
      status: 'OK',
      totalGeral: d.totalHoras,
      dataFinalizacao: d.dataFinalizacao
    }));
    saveToStorage(STORAGE_KEYS.REP_MENSAL, legacy);
  }
};

export const validationService = {
  async validarPassagemDuplicada(data: string, turnoId: string, baseId: string): Promise<{ valido: boolean; mensagem: string }> {
    try {
      const reports = getFromStorage<any[]>(STORAGE_KEYS.REP_DETALHAMENTO, []);
      if (reports.length === 0) return { valido: true, mensagem: '' };

      const jaExiste = reports.some(r => r.data === data && r.turnoId === turnoId && r.baseId === baseId && r.status === 'Finalizado');
      if (jaExiste) {
        const mensagem = `Já existe uma Passagem de Serviço finalizada para o dia ${data} no Turno correspondente. Não é possível finalizar 2 vezes a mesma passagem.`;
        return { valido: false, mensagem };
      }
      return { valido: true, mensagem: '' };
    } catch (e) {
      return { valido: true, mensagem: '' };
    }
  },

  async verificarColaboradoresEmOutrosTurnos(data: string, turnoId: string, baseId: string, atuaisIds: (string | null)[], users: User[]): Promise<{ valido: boolean; mensagem: string; colaboradoresDuplicados: string[] }> {
    try {
      const reports = getFromStorage<any[]>(STORAGE_KEYS.REP_DETALHAMENTO, []);
      const duplicadosNomes: string[] = [];
      const passagensDoDia = reports.filter(r => r.data === data && r.baseId === baseId && r.turnoId !== turnoId && r.status === 'Finalizado');
      atuaisIds.forEach(id => {
        if (!id) return;
        const jaTrabalhou = passagensDoDia.some(p => (p.colaboradoresIds || []).includes(id));
        if (jaTrabalhou) {
          const nome = users.find(u => u.id === id)?.nome || 'Membro do Time';
          if (!duplicadosNomes.includes(nome)) duplicadosNomes.push(nome);
        }
      });
      if (duplicadosNomes.length > 0) {
        const nomes = duplicadosNomes.join(', ');
        return { valido: false, mensagem: `O(s) colaborador(es) '${nomes}' já está(ão) registrado(s) em outro turno do dia ${data}.`, colaboradoresDuplicados: duplicadosNomes };
      }
      return { valido: true, mensagem: '', colaboradoresDuplicados: [] };
    } catch (e) {
      return { valido: true, mensagem: '', colaboradoresDuplicados: [] };
    }
  },

  validarPassagem(handover: ShiftHandover, storeTasks: Task[]): { valido: boolean; camposPendentes: string[] } {
    const pendentes: string[] = [];
    if (!handover.turnoId) pendentes.push("Configuração: Seleção de Turno obrigatória");
    if (handover.colaboradores.every(c => !c)) pendentes.push("Equipe: Pelo menos 1 colaborador deve ser selecionado");
    const baseTasks = storeTasks.filter(t => !t.deletada && t.visivel !== false && (!t.baseId || t.baseId === handover.baseId));
    baseTasks.forEach(task => {
      const valor = handover.tarefasExecutadas[task.id];
      if (valor === undefined || valor === null || valor === "") pendentes.push(`Atividades: A tarefa "${task.nome}" deve ser preenchida`);
    });
    return { valido: pendentes.length === 0, camposPendentes: pendentes };
  }
};

export const migrationService = {
  async reprocessarResumo(store: any): Promise<void> {
    const repDetalhamento = getFromStorage<any[]>(STORAGE_KEYS.REP_DETALHAMENTO, []);
    const repResumo: any = { categorias: [], totalMins: 0 };
    
    repDetalhamento.forEach(handover => {
      Object.entries(handover.tarefasExecutadas || {}).forEach(([taskId, val]: [string, any]) => {
        const task = store.tasks.find((t: any) => t.id === taskId);
        if (!task) return;
        const cat = store.categories.find((c: any) => c.id === task.categoriaId);
        if (!cat) return;
        
        let catResumo = repResumo.categorias.find((r: any) => r.categoryId === cat.id);
        if (!catResumo) {
          catResumo = { categoryId: cat.id, categoryNome: cat.nome, atividades: [], totalCategoryMins: 0 };
          repResumo.categorias.push(catResumo);
        }
        
        let taskResumo = catResumo.atividades.find((a: any) => a.nome === task.nome);
        if (!taskResumo) {
          taskResumo = { nome: task.nome, tipoInput: task.tipoMedida === 'TEMPO' ? 'TIME' : 'QTY', totalQuantidade: 0, totalMins: 0 };
          catResumo.atividades.push(taskResumo);
        }
        
        let taskMins = 0;
        if (task.tipoMedida === 'TEMPO') {
          const parts = (val as string).split(':').map(Number);
          taskMins = (parts[0] * 60) + (parts[1] || 0) + (parts[2] || 0) / 60;
        } else {
          const qty = parseFloat(val as string) || 0;
          taskResumo.totalQuantidade += qty;
          taskMins = qty * task.fatorMultiplicador;
        }
        taskResumo.totalMins += taskMins;
        catResumo.totalCategoryMins += taskMins;
        repResumo.totalMins += taskMins;
      });

      if (handover.nonRoutineTasks && handover.nonRoutineTasks.length > 0) {
        handover.nonRoutineTasks.forEach((t: any) => {
           if (!t.nome || !t.tempo) return;
           const catId = t.categoriaId || 'cat_outras';
           const catRef = store.categories.find((c: any) => c.id === catId);
           const catName = catRef?.nome || '5. OUTROS';

           let catResumo = repResumo.categorias.find((r: any) => r.categoryId === catId);
           if (!catResumo) {
             catResumo = { categoryId: catId, categoryNome: catName, atividades: [], totalCategoryMins: 0 };
             repResumo.categorias.push(catResumo);
           }

           let taskResumo = catResumo.atividades.find((a: any) => a.nome === t.nome);
           if (!taskResumo) {
             taskResumo = { nome: t.nome, tipoInput: t.tipoMedida === 'QTD' ? 'QTY' : 'TIME', totalQuantidade: 0, totalMins: 0 };
             catResumo.atividades.push(taskResumo);
           }
           
           let newMins = 0;
           if (t.tipoMedida === MeasureType.QTD) {
              const qty = parseFloat(t.tempo) || 0;
              taskResumo.totalQuantidade += qty;
              newMins = qty * (t.fatorMultiplicador || 0);
           } else {
              taskResumo.totalQuantidade += 1;
              const parts = (t.tempo as string).split(':').map(Number);
              newMins = (parts[0] * 60) + (parts[1] || 0) + (parts[2] || 0) / 60;
           }
           
           taskResumo.totalMins += newMins;
           catResumo.totalCategoryMins += newMins;
           repResumo.totalMins += newMins;
        });
      }
    });

    // Mapear acumulados para HH:MM:SS antes de salvar
    const finalResumo = {
      totalHoras: timeUtils.minutesToHhmmss(repResumo.totalMins),
      categorias: repResumo.categorias.map((c: any) => ({
        ...c,
        totalCategoryFormatted: timeUtils.minutesToHhmmss(c.totalCategoryMins),
        atividades: c.atividades.map((a: any) => ({
          ...a,
          totalFormatted: timeUtils.minutesToHhmmss(a.totalMins)
        }))
      }))
    };

    saveToStorage(STORAGE_KEYS.REP_RESUMO, finalResumo);
  },

  async processarMigracao(handover: ShiftHandover, store: any, replaceId?: string): Promise<void> {
    const repAcompanhamento = getFromStorage<any[]>(STORAGE_KEYS.REP_ACOMPANHAMENTO, []);
    const repDetalhamento = getFromStorage<any[]>(STORAGE_KEYS.REP_DETALHAMENTO, []);

    let dataEntry = repAcompanhamento.find((r: any) => r.data === handover.data);
    if (!dataEntry) {
      dataEntry = { data: handover.data, turno1: 'Pendente', turno2: 'Pendente', turno3: 'Pendente', turno4: 'Pendente' };
      repAcompanhamento.push(dataEntry);
    }
    const turnoKey = `turno${handover.turnoId}` as keyof typeof dataEntry;
    dataEntry[turnoKey] = 'OK';

    const colaboradoresNomes = handover.colaboradores.map(id => store.users.find((u:any) => u.id === id)?.nome).filter(Boolean);
    
    let hProdTotalMin = 0;
    const atividadesDetalhadas = Object.entries(handover.tarefasExecutadas).map(([taskId, val]) => {
      const task = store.tasks.find((t: any) => t.id === taskId);
      const cat = store.categories.find((c: any) => c.id === task?.categoriaId);
      let mins = 0;
      if (task?.tipoMedida === 'TEMPO') {
        const p = val.split(':').map(Number);
        mins = (p[0]||0) * 60 + (p[1]||0) + (p[2]||0)/60;
      } else {
        mins = (parseFloat(val) || 0) * (task?.fatorMultiplicador || 0);
      }
      hProdTotalMin += mins;
      const conv = timeUtils.converterMinutosParaHoras(mins);
      return { 
        taskNome: task?.nome || 'Desc.', 
        categoryNome: cat?.nome || 'Geral', 
        horas: conv.horas, 
        minutos: conv.minutos,
        segundos: conv.segundos,
        formatted: timeUtils.minutesToHhmmss(mins)
      };
    });

    const hDispTotalMin = handover.colaboradores.reduce((acc, id) => acc + (store.users.find((u:any) => u.id === id)?.jornadaPadrao || 0) * 60, 0);
    
    (handover.nonRoutineTasks || []).forEach(t => {
      if (t.tipoMedida === MeasureType.QTD) {
         hProdTotalMin += (parseFloat(t.tempo) || 0) * (t.fatorMultiplicador || 0);
      } else {
         const p = t.tempo.split(':').map(Number);
         hProdTotalMin += (p[0] * 60) + (p[1] || 0) + (p[2] || 0) / 60;
      }
    });

    const performanceCalc = hDispTotalMin > 0 ? (hProdTotalMin / hDispTotalMin) * 100 : 0;

    const record = {
      ...handover,
      id: replaceId || handover.id,
      colaboradoresIds: handover.colaboradores,
      horaRegistro: new Date().toLocaleTimeString('pt-BR'),
      turno: `Turno ${handover.turnoId}`,
      colaboradores: colaboradoresNomes,
      nomeColaboradores: colaboradoresNomes.join(', '),
      qtdColaboradores: colaboradoresNomes.length,
      horasDisponivel: timeUtils.minutesToHhmmss(hDispTotalMin),
      horasProduzida: timeUtils.minutesToHhmmss(hProdTotalMin),
      percentualPerformance: Math.round(performanceCalc * 100) / 100,
      tarefasMap: criarMapaTarefas({ ...handover, activities: atividadesDetalhadas }),
      shelfLife: formatarControle(handover.shelfLifeData.map(i => ({ data: i.dataVencimento }))),
      locations: formatarControle(handover.locationsData.map(i => ({ quantidade: i.quantidade }))),
      transito: formatarControle(handover.transitData.map(i => ({ quantidade: i.quantidade }))),
      saldoCritico: handover.criticalData
        .filter(c => c.saldoSistema !== null)
        .map(c => `${c.saldoSistema}|${c.saldoFisico}|${(c.saldoSistema||0)-(c.saldoFisico||0)}`)
        .join(' | '),
      observacoes: handover.informacoesImportantes,
      shelfLifeItems: handover.shelfLifeData.map(i => ({ itemNome: i.partNumber, data: i.dataVencimento })),
      locationItems: handover.locationsData.map(i => ({ itemNome: i.nomeLocation, quantidade: i.quantidade })),
      transitItems: handover.transitData.map(i => ({ itemNome: i.nomeTransito, quantidade: i.quantidade })),
      criticosItems: handover.criticalData.map(i => ({ itemNome: i.partNumber, saldoSistema: i.saldoSistema, saldoFisico: i.saldoFisico, divergencia: (i.saldoSistema||0)-(i.saldoFisico||0) })),
      activities: atividadesDetalhadas,
      outrasTarefas: handover.nonRoutineTasks
    };

    if (replaceId) {
      const idx = repDetalhamento.findIndex(d => d.id === replaceId);
      if (idx > -1) repDetalhamento[idx] = record;
      else repDetalhamento.push(record);
    } else {
      repDetalhamento.push(record);
    }

    saveToStorage(STORAGE_KEYS.REP_ACOMPANHAMENTO, repAcompanhamento);
    saveToStorage(STORAGE_KEYS.REP_DETALHAMENTO, repDetalhamento);
    await this.reprocessarResumo(store);
    
    // Ao finalizar com sucesso, limpar o rascunho compartilhado
    await sharedDraftService.clearDraft(handover.baseId, handover.data, handover.turnoId);
  }
};
