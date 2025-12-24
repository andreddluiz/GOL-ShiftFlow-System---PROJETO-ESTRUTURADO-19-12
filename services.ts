
import { 
  Base, User, Category, Task, Control, 
  DefaultLocationItem, DefaultTransitItem, DefaultCriticalItem,
  ShelfLifeItem, CustomControlType, CustomControlItem,
  ShiftHandover, Indicator, Report
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
  // Chaves específicas das 4 tabelas
  REP_ACOMPANHAMENTO: 'gol_rep_acompanhamento',
  REP_RESUMO: 'gol_rep_resumo',
  REP_MENSAL: 'gol_rep_mensal',
  REP_DETALHAMENTO: 'gol_rep_detalhamento'
};

// Fix: Redefine getFromStorage to support any type T instead of enforcing T[]
const getFromStorage = <T>(key: string, defaultVal: T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
};

// Fix: Redefine saveToStorage to support any type T instead of enforcing T[]
const saveToStorage = <T>(key: string, data: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("[DEBUG Storage] Erro ao salvar storage", key, e);
  }
};

// --- FUNÇÕES AUXILIARES DE TEMPO PARA SOMA ACUMULADA ---
export const timeUtils = {
  converterMinutosParaHoras: (totalMinutes: number) => {
    const horas = Math.floor(totalMinutes / 60);
    const minutos = Math.round(totalMinutes % 60);
    return { horas, minutos };
  },
  somarMinutos: (h1: number, m1: number, h2: number, m2: number) => {
    const total = (h1 * 60 + m1) + (h2 * 60 + m2);
    return timeUtils.converterMinutosParaHoras(total);
  }
};

export const baseService = {
  async getAll(): Promise<Base[]> {
    // Fix: Explicitly use Base[] for generic type after signature change
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
    // Fix: Explicitly use DefaultLocationItem[] for generic type
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
    // Fix: Explicitly use DefaultTransitItem[] for generic type
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
    // Fix: Explicitly use DefaultCriticalItem[] for generic type
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
    // Fix: Explicitly use ShelfLifeItem[] for generic type
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
    // Fix: Explicitly use CustomControlType[] for generic type
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
    // Fix: Explicitly use CustomControlItem[] for generic type
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
    // Fix: Explicitly use Category[] for generic type
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
    // Fix: Explicitly use Task[] for generic type
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
    // Fix: Explicitly use Control[] for generic type
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
    // Fix: Explicitly use User[] for generic type
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

/**
 * SERVIÇOS DE VALIDAÇÃO E MIGRAÇÃO
 */

export const validationService = {
  validarPassagem(handover: ShiftHandover): { valido: boolean; camposPendentes: string[] } {
    const pendentes: string[] = [];

    if (!handover.turnoId) pendentes.push("Configuração: Seleção de Turno obrigatória");
    if (handover.colaboradores.every(c => !c)) pendentes.push("Equipe: Pelo menos 1 colaborador deve ser selecionado");

    handover.shelfLifeData.forEach(item => {
      if ((item.isPadrao || item.partNumber) && !item.dataVencimento) {
        pendentes.push(`Shelf Life - ${item.partNumber || 'Item'}: Data de Vencimento obrigatória`);
      }
    });

    handover.locationsData.forEach(item => {
      if (item.isPadrao && item.quantidade > 0 && !item.dataMaisAntigo) {
        pendentes.push(`Locations - ${item.nomeLocation}: Data do volume mais antigo obrigatória para itens com saldo`);
      }
    });

    handover.transitData.forEach(item => {
      if (item.isPadrao && item.quantidade > 0 && !item.dataSaida) {
        pendentes.push(`Trânsito - ${item.nomeTransito}: Data de Saída obrigatória para itens com saldo`);
      }
    });

    handover.criticalData.forEach(item => {
      if (item.isPadrao || item.partNumber) {
        if (item.saldoSistema === undefined || item.saldoSistema === null) pendentes.push(`Saldo - ${item.partNumber || 'Item'}: Saldo Sistema obrigatório`);
        if (item.saldoFisico === undefined || item.saldoFisico === null) pendentes.push(`Saldo - ${item.partNumber || 'Item'}: Saldo Físico obrigatório`);
      }
    });

    console.debug("[Validação] Resultado:", { valido: pendentes.length === 0, pendentes });
    return { valido: pendentes.length === 0, camposPendentes: pendentes };
  }
};

export const migrationService = {
  async processarMigracao(handover: ShiftHandover, store: any): Promise<void> {
    console.debug("[Migração] Iniciando processamento para base:", handover.baseId);

    // 1. CARREGAR DADOS EXISTENTES
    // Fix: Use any[] and any to match storage structure, resolving type errors on line 356 onwards
    const repAcompanhamento = getFromStorage<any[]>(STORAGE_KEYS.REP_ACOMPANHAMENTO, []);
    const repResumo = getFromStorage<any>(STORAGE_KEYS.REP_RESUMO, { categorias: [], totalHoras: 0, totalMinutos: 0 });
    const repDetalhamento = getFromStorage<any[]>(STORAGE_KEYS.REP_DETALHAMENTO, []);

    // --- TABELA 1: ACOMPANHAMENTO DE TURNOS ---
    let dataEntry = repAcompanhamento.find((r: any) => r.data === handover.data);
    if (!dataEntry) {
      dataEntry = { data: handover.data, turno1: 'Pendente', turno2: 'Pendente', turno3: 'Pendente', turno4: 'Pendente' };
      repAcompanhamento.push(dataEntry);
    }
    const turnoKey = `turno${handover.turnoId}` as keyof typeof dataEntry;
    dataEntry[turnoKey] = 'OK';

    // --- TABELA 2: RESUMO GERAL DE PRODUTIVIDADE (SOMA ACUMULADA) ---
    Object.entries(handover.tarefasExecutadas).forEach(([taskId, val]) => {
      const task = store.tasks.find((t: any) => t.id === taskId);
      if (!task) return;
      
      const cat = store.categories.find((c: any) => c.id === task.categoriaId);
      if (!cat) return;

      // Fix: repResumo is now correctly identified as an object by TypeScript
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
        const parts = val.split(':').map(Number);
        const newMins = (parts[0] * 60) + parts[1];
        const updated = timeUtils.somarMinutos(taskResumo.totalHoras, taskResumo.totalMinutos, 0, newMins);
        taskResumo.totalHoras = updated.horas;
        taskResumo.totalMinutos = updated.minutos;
      } else {
        const qty = parseFloat(val) || 0;
        taskResumo.totalQuantidade += qty;
        const newMins = qty * task.fatorMultiplicador;
        const updated = timeUtils.somarMinutos(taskResumo.totalHoras, taskResumo.totalMinutos, 0, newMins);
        taskResumo.totalHoras = updated.horas;
        taskResumo.totalMinutos = updated.minutos;
      }
    });

    // Recalcular subtotais de categoria e total geral
    let totalGeralMins = 0;
    repResumo.categorias.forEach((cat: any) => {
      let catMins = 0;
      cat.atividades.forEach((at: any) => {
        catMins += (at.totalHoras * 60) + at.totalMinutos;
      });
      const { horas, minutos } = timeUtils.converterMinutosParaHoras(catMins);
      cat.totalCategoryHoras = horas;
      cat.totalCategoryMinutos = minutos;
      totalGeralMins += catMins;
    });
    const { horas: gH, minutos: gM } = timeUtils.converterMinutosParaHoras(totalGeralMins);
    repResumo.totalHoras = gH;
    repResumo.totalMinutos = gM;

    // --- TABELA 4: DETALHAMENTO ANALÍTICO (ANEXA TUDO) ---
    const colaboradoresNomes = handover.colaboradores
      .map(id => store.users.find((u:any) => u.id === id)?.nome)
      .filter(Boolean);

    // Calcular horas disponíveis baseadas na equipe selecionada
    let dispHorasTurno = 0;
    handover.colaboradores.forEach(id => {
      const u = store.users.find((u:any) => u.id === id);
      if(u) dispHorasTurno += u.jornadaPadrao;
    });

    // Transformar tarefas para detalhamento flat
    const atividadesDetalhadas = Object.entries(handover.tarefasExecutadas).map(([taskId, val]) => {
      const task = store.tasks.find((t: any) => t.id === taskId);
      const cat = store.categories.find((c: any) => c.id === task?.categoriaId);
      let h = 0, m = 0;
      if (task?.tipoMedida === 'TEMPO') {
        const p = val.split(':').map(Number);
        h = p[0]; m = p[1];
      } else {
        const mins = (parseFloat(val) || 0) * (task?.fatorMultiplicador || 0);
        const conv = timeUtils.converterMinutosParaHoras(mins);
        h = conv.horas; m = conv.minutos;
      }
      return { taskNome: task?.nome || 'Desc.', categoryNome: cat?.nome || 'Geral', horas: h, minutos: m };
    });

    const novaLinhaDetalhamento = {
      id: `det-${Date.now()}`,
      data: handover.data,
      horaRegistro: new Date().toLocaleTimeString('pt-BR'),
      turno: `Turno ${handover.turnoId}`,
      baseId: handover.baseId,
      colaboradores: colaboradoresNomes,
      horasDisponivel: dispHorasTurno,
      horasProduzida: handover.performance * (dispHorasTurno / 100), // Aproximação baseada no cálculo da página
      percentualPerformance: handover.performance,
      shelfLifeItems: handover.shelfLifeData.map(i => ({ itemNome: i.partNumber, data: i.dataVencimento })),
      locationItems: handover.locationsData.map(i => ({ itemNome: i.nomeLocation, data: i.dataMaisAntigo, quantidade: i.quantidade })),
      transitItems: handover.transitData.map(i => ({ itemNome: i.nomeTransito, data: i.dataSaida, quantidade: i.quantidade })),
      saldoItems: handover.criticalData.map(i => ({ itemNome: i.partNumber, saldoSistema: i.saldoSistema, saldoFisico: i.saldoFisico, divergencia: i.saldoSistema - i.saldoFisico })),
      atividades: atividadesDetalhadas,
      observacoes: handover.informacoesImportantes
    };

    repDetalhamento.push(novaLinhaDetalhamento);

    // PERSISTIR
    saveToStorage(STORAGE_KEYS.REP_ACOMPANHAMENTO, repAcompanhamento);
    saveToStorage(STORAGE_KEYS.REP_RESUMO, repResumo);
    saveToStorage(STORAGE_KEYS.REP_DETALHAMENTO, repDetalhamento);

    console.debug("[Migração] Relatórios atualizados com sucesso.");
  }
};
