
import { 
  Base, User, Category, Task, Control, 
  DefaultLocationItem, DefaultTransitItem, DefaultCriticalItem,
  ShelfLifeItem, CustomControlType, CustomControlItem,
  ShiftHandover, Indicator, Report, OutraAtividade
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
  REP_DETALHAMENTO: 'gol_rep_detalhamento'
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
    const minutos = Math.round(totalMinutes % 60);
    return { horas, minutos };
  },
  somarMinutos: (h1: number, m1: number, h2: number, m2: number) => {
    const total = (h1 * 60 + m1) + (h2 * 60 + m2);
    return timeUtils.converterMinutosParaHoras(total);
  },
  formatToHms: (h: number, m: number, s: number = 0) => {
    return `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round(m)).padStart(2, '0')}:${String(Math.round(s)).padStart(2, '0')}`;
  }
};

// --- FUNÇÕES DE FORMATAÇÃO E MAPEAMENTO (SOLICITAÇÃO 44.0) ---

function formatarControle(items: any[]): string {
  if (!items || items.length === 0) return '';
  return items
    .filter(item => item.data || item.quantidade !== undefined)
    .map(item => item.data || item.quantidade)
    .join(' | ');
}

function criarMapaTarefas(detalhe: any): Record<string, string> {
  console.debug(`[Tarefas] Criando mapa de tarefas para registro ${detalhe.id}`);
  const tarefasMap: Record<string, string> = {};
  
  // 1. Processar atividades rotineiras
  if (detalhe.activities && Array.isArray(detalhe.activities)) {
    detalhe.activities.forEach((atividade: any) => {
      if (atividade.taskNome) {
        const tempo = timeUtils.formatToHms(atividade.horas || 0, atividade.minutos || 0, atividade.segundos || 0);
        tarefasMap[atividade.taskNome.toUpperCase()] = tempo;
        console.debug(`[Tarefas] Mapeada atividade: ${atividade.taskNome} = ${tempo}`);
      }
    });
  }
  
  // 2. Processar outras tarefas (extras)
  if (detalhe.nonRoutineTasks && Array.isArray(detalhe.nonRoutineTasks)) {
    detalhe.nonRoutineTasks.forEach((tarefa: any) => {
      if (tarefa.nome && tarefa.nome.trim() !== '') {
        const tempo = tarefa.tempo || '00:00:00';
        tarefasMap[`[EXTRA] ${tarefa.nome.toUpperCase()}`] = tempo;
        console.debug(`[Tarefas] Mapeada outra tarefa: ${tarefa.nome} = ${tempo}`);
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

export const validationService = {
  async validarPassagemDuplicada(data: string, turnoId: string, baseId: string): Promise<{ valido: boolean; mensagem: string }> {
    console.debug(`[Validação 2] ========== INICIANDO VALIDAÇÃO DE DUPLICIDADE ==========`);
    console.debug(`[Validação 2] Data: ${data}, TurnoID: ${turnoId}, Base: ${baseId}`);

    try {
      const reports = getFromStorage<any[]>(STORAGE_KEYS.REP_DETALHAMENTO, []);
      if (reports.length === 0) return { valido: true, mensagem: '' };

      const jaExiste = reports.some(r => r.data === data && r.turnoId === turnoId && r.baseId === baseId && r.status === 'Finalizado');
      if (jaExiste) {
        const mensagem = `Já existe uma Passagem de Serviço finalizada para o dia ${data} no Turno correspondente. Não é possível finalizar 2 vezes a mesma passagem.`;
        console.debug(`[Validação 2] FALHOU: ${mensagem}`);
        return { valido: false, mensagem };
      }
      return { valido: true, mensagem: '' };
    } catch (e) {
      console.error(`[Validação 2] ERRO:`, e);
      return { valido: true, mensagem: '' };
    }
  },

  async verificarColaboradoresEmOutrosTurnos(data: string, turnoId: string, baseId: string, atuaisIds: (string | null)[], users: User[]): Promise<{ valido: boolean; mensagem: string; colaboradoresDuplicados: string[] }> {
    console.debug(`[Validação 3] ========== INICIANDO VALIDAÇÃO DE COLABORADOR DUPLICADO ==========`);
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
    console.debug(`[Resumo] ========== INICIANDO REPROCESSAMENTO DO RESUMO GERAL ==========`);
    const repDetalhamento = getFromStorage<any[]>(STORAGE_KEYS.REP_DETALHAMENTO, []);
    const repResumo: any = { categorias: [], totalHoras: 0, totalMinutos: 0 };
    
    repDetalhamento.forEach(handover => {
      // 1. Processar Atividades Rotineiras
      Object.entries(handover.tarefasExecutadas || {}).forEach(([taskId, val]: [string, any]) => {
        const task = store.tasks.find((t: any) => t.id === taskId);
        if (!task) return;
        const cat = store.categories.find((c: any) => c.id === task.categoriaId);
        if (!cat) return;
        
        let catResumo = repResumo.categorias.find((r: any) => r.categoryId === cat.id);
        if (!catResumo) {
          catResumo = { categoryId: cat.id, categoryNome: cat.nome, atividades: [], totalCategoryHoras: 0, totalCategoryMinutos: 0 };
          repResumo.categorias.push(catResumo);
        }
        
        let taskResumo = catResumo.atividades.find((a: any) => a.nome === task.nome);
        if (!taskResumo) {
          taskResumo = { nome: task.nome, tipoInput: task.tipoMedida === 'TEMPO' ? 'TIME' : 'QTY', totalQuantidade: 0, totalHoras: 0, totalMinutos: 0 };
          catResumo.atividades.push(taskResumo);
        }
        
        if (task.tipoMedida === 'TEMPO') {
          const parts = (val as string).split(':').map(Number);
          const newMins = (parts[0] * 60) + (parts[1] || 0);
          const updated = timeUtils.somarMinutos(taskResumo.totalHoras, taskResumo.totalMinutos, 0, newMins);
          taskResumo.totalHoras = updated.horas; taskResumo.totalMinutos = updated.minutos;
          const catUpdated = timeUtils.somarMinutos(catResumo.totalCategoryHoras, catResumo.totalCategoryMinutos, 0, newMins);
          catResumo.totalCategoryHoras = catUpdated.horas; catResumo.totalCategoryMinutos = catUpdated.minutos;
          const globalUpdated = timeUtils.somarMinutos(repResumo.totalHoras, repResumo.totalMinutos, 0, newMins);
          repResumo.totalHoras = globalUpdated.horas; repResumo.totalMinutos = globalUpdated.minutos;
        } else {
          const qty = parseFloat(val as string) || 0;
          taskResumo.totalQuantidade += qty;
          const newMins = qty * task.fatorMultiplicador;
          const updated = timeUtils.somarMinutos(taskResumo.totalHoras, taskResumo.totalMinutos, 0, newMins);
          taskResumo.totalHoras = updated.horas; taskResumo.totalMinutos = updated.minutos;
          const catUpdated = timeUtils.somarMinutos(catResumo.totalCategoryHoras, catResumo.totalCategoryMinutos, 0, newMins);
          catResumo.totalCategoryHoras = catUpdated.horas; catResumo.totalCategoryMinutos = catUpdated.minutos;
          const globalUpdated = timeUtils.somarMinutos(repResumo.totalHoras, repResumo.totalMinutos, 0, newMins);
          repResumo.totalHoras = globalUpdated.horas; repResumo.totalMinutos = globalUpdated.minutos;
        }
      });

      // 2. Processar Outras Tarefas (Detalhadas Individualmente na categoria 5. OUTROS)
      if (handover.nonRoutineTasks && handover.nonRoutineTasks.length > 0) {
        let catOutros = repResumo.categorias.find((r: any) => r.categoryNome.includes('OUTROS'));
        if (!catOutros) {
          catOutros = { categoryId: 'cat_outros', categoryNome: '5. OUTROS', atividades: [], totalCategoryHoras: 0, totalCategoryMinutos: 0 };
          repResumo.categorias.push(catOutros);
        }

        handover.nonRoutineTasks.forEach((t: any) => {
           if (!t.nome || !t.tempo) return;
           const taskName = t.nome;
           // Localizar ou criar a atividade customizada específica pelo NOME
           let taskResumo = catOutros.atividades.find((a: any) => a.nome === taskName);
           if (!taskResumo) {
             taskResumo = { nome: taskName, tipoInput: 'CUSTOM', totalQuantidade: 0, totalHoras: 0, totalMinutos: 0 };
             catOutros.atividades.push(taskResumo);
           }
           
           // Incrementar quantidade (cada registro é 1)
           taskResumo.totalQuantidade += 1;
           
           const parts = (t.tempo as string).split(':').map(Number);
           const newMins = (parts[0] * 60) + (parts[1] || 0);
           
           const updated = timeUtils.somarMinutos(taskResumo.totalHoras, taskResumo.totalMinutos, 0, newMins);
           taskResumo.totalHoras = updated.horas; taskResumo.totalMinutos = updated.minutos;
           
           const catUpdated = timeUtils.somarMinutos(catOutros.totalCategoryHoras, catOutros.totalCategoryMinutos, 0, newMins);
           catOutros.totalCategoryHoras = catUpdated.horas; catOutros.totalCategoryMinutos = catUpdated.minutos;
           
           const globalUpdated = timeUtils.somarMinutos(repResumo.totalHoras, repResumo.totalMinutos, 0, newMins);
           repResumo.totalHoras = globalUpdated.horas; repResumo.totalMinutos = globalUpdated.minutos;
        });
      }
    });

    saveToStorage(STORAGE_KEYS.REP_RESUMO, repResumo);
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
    const atividadesDetalhadas = Object.entries(handover.tarefasExecutadas).map(([taskId, val]) => {
      const task = store.tasks.find((t: any) => t.id === taskId);
      const cat = store.categories.find((c: any) => c.id === task?.categoriaId);
      let h = 0, m = 0;
      if (task?.tipoMedida === 'TEMPO') {
        const p = val.split(':').map(Number); h = p[0]||0; m = p[1]||0;
      } else {
        const mins = (parseFloat(val) || 0) * (task?.fatorMultiplicador || 0);
        const conv = timeUtils.converterMinutosParaHoras(mins); h = conv.horas; m = conv.minutos;
      }
      return { taskNome: task?.nome || 'Desc.', categoryNome: cat?.nome || 'Geral', horas: h, minutos: m };
    });

    const hDisp = handover.colaboradores.reduce((acc, id) => acc + (store.users.find((u:any) => u.id === id)?.jornadaPadrao || 0), 0);
    let hProdTotalMin = 0;
    atividadesDetalhadas.forEach(a => hProdTotalMin += (a.horas * 60) + a.minutos);
    (handover.nonRoutineTasks || []).forEach(t => {
      const p = t.tempo.split(':').map(Number);
      hProdTotalMin += (p[0] * 60) + (p[1] || 0);
    });

    const performanceCalc = hDisp > 0 ? (hProdTotalMin / (hDisp * 60)) * 100 : 0;

    const record = {
      ...handover,
      id: replaceId || handover.id,
      colaboradoresIds: handover.colaboradores,
      horaRegistro: new Date().toLocaleTimeString('pt-BR'),
      turno: `Turno ${handover.turnoId}`,
      colaboradores: colaboradoresNomes,
      nomeColaboradores: colaboradoresNomes.join(', '),
      qtdColaboradores: colaboradoresNomes.length,
      horasDisponivel: timeUtils.formatToHms(hDisp, 0, 0).substring(0, 5),
      horasProduzida: timeUtils.formatToHms(Math.floor(hProdTotalMin / 60), hProdTotalMin % 60, 0).substring(0, 5),
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
  }
};
