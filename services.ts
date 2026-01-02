
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  serverTimestamp, 
  orderBy, 
  collectionGroup,
  Timestamp
} from "firebase/firestore";
import { db } from "./firebase";
import { 
  Base, User, Category, Task, Control, 
  DefaultLocationItem, DefaultTransitItem, DefaultCriticalItem,
  ShelfLifeItem, CustomControlType, CustomControlItem,
  ShiftHandover, OutraAtividade, MonthlyCollection, MeasureType
} from './types';
import { BASES, CATEGORIES, TASKS, CONTROLS, USERS, DEFAULT_LOCATIONS, DEFAULT_TRANSITS, DEFAULT_CRITICALS } from './constants';

// Chaves para Fallback em LocalStorage (Cache local)
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
  CUSTOM_TYPES: 'gol_shiftflow_cust_types_v2',
  CUSTOM_ITEMS: 'gol_shiftflow_cust_items_v2',
  MONTHLY_COLLECTIONS: 'gol_shiftflow_monthly_collections',
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
    console.error("[Storage Error]", key, e);
  }
};

// --- SERVIÇOS FIRESTORE OTIMIZADOS ---

/**
 * 1. Salva rascunho ou finalização na estrutura: handovers/{baseId}/shifts/{date}_{turno}
 */
export const saveDraft = async (data: ShiftHandover) => {
  const shiftId = `${data.data.replace(/\//g, '-')}_${data.turnoId}`;
  console.log(`[Firestore] Iniciando saveDraft para Base: ${data.baseId}, Shift: ${shiftId}`);
  
  try {
    const docRef = doc(db, 'handovers', data.baseId, 'shifts', shiftId);
    
    const payload = {
      ...data,
      lastModified: serverTimestamp(),
      // Garante nomes de campos consistentes com a solicitação
      notas: data.informacoesImportantes || '',
      tarefas: data.tarefasExecutadas || {},
      controles: {
        shelfLife: data.shelfLifeData,
        locations: data.locationsData,
        transit: data.transitData,
        critical: data.criticalData
      }
    };

    await setDoc(docRef, payload, { merge: true });
    console.log(`[Firestore] Sucesso: Documento ${shiftId} salvo.`);
  } catch (error) {
    console.error(`[Firestore Error] Erro ao salvar draft:`, error);
    throw error;
  }
};

/**
 * 2. Carrega turnos de uma base específica com filtro de data
 */
export const loadHandovers = async (baseId: string, startDate: string, endDate: string) => {
  console.log(`[Firestore] Carregando handovers para Base: ${baseId} entre ${startDate} e ${endDate}`);
  
  try {
    const shiftsRef = collection(db, 'handovers', baseId, 'shifts');
    const q = query(
      shiftsRef, 
      where('data', '>=', startDate), 
      where('data', '<=', endDate),
      orderBy('data', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log(`[Firestore] Busca concluída. Encontrados ${results.length} registros.`);
    return results;
  } catch (error) {
    console.error(`[Firestore Error] Erro ao carregar handovers da base ${baseId}:`, error);
    return [];
  }
};

/**
 * 3. Carrega um turno único específico
 */
export const loadSingleHandover = async (baseId: string, shiftId: string) => {
  console.log(`[Firestore] Buscando turno único: ${baseId} / ${shiftId}`);
  
  try {
    const docRef = doc(db, 'handovers', baseId, 'shifts', shiftId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.log(`[Firestore] Registro encontrado.`);
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.log(`[Firestore] Registro não encontrado.`);
      return null;
    }
  } catch (error) {
    console.error(`[Firestore Error] Erro ao buscar turno ${shiftId}:`, error);
    throw error;
  }
};

/**
 * 4. Remove um registro de turno
 */
export const deleteHandover = async (baseId: string, shiftId: string) => {
  console.log(`[Firestore] Solicitando exclusão: Base ${baseId}, Shift ${shiftId}`);
  
  try {
    const docRef = doc(db, 'handovers', baseId, 'shifts', shiftId);
    await deleteDoc(docRef);
    console.log(`[Firestore] Documento ${shiftId} excluído permanentemente.`);
  } catch (error) {
    console.error(`[Firestore Error] Falha ao deletar documento:`, error);
    throw error;
  }
};

/**
 * 5. Carrega todos os handovers de múltiplas bases (útil para dashboards consolidados)
 * Nota: Requer criação de índice de Collection Group no console do Firebase
 */
export const loadAllHandovers = async (baseIds: string[], startDate: string, endDate: string) => {
  console.log(`[Firestore] Carregando relatório global para ${baseIds.length} bases.`);
  
  try {
    // Usamos collectionGroup para buscar em todas as subcoleções 'shifts' de uma vez
    const allShiftsQuery = query(
      collectionGroup(db, 'shifts'),
      where('data', '>=', startDate),
      where('data', '<=', endDate),
      orderBy('data', 'desc')
    );

    const querySnapshot = await getDocs(allShiftsQuery);
    
    // Filtramos os resultados para garantir que pertencem apenas às bases solicitadas 
    // (Caso existam bases no banco que o usuário não tem acesso)
    const results = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() as any }))
      .filter(item => baseIds.includes(item.baseId));

    console.log(`[Firestore] Relatório global gerado: ${results.length} registros totais.`);
    return results;
  } catch (error) {
    console.error(`[Firestore Error] Erro no relatório global:`, error);
    throw error;
  }
};

// --- UTILITÁRIOS DE TEMPO ---

// Added local hhmmssToMinutes for internal logic
const hhmmssToMinutes = (hms: string): number => {
  if (!hms || hms === '00:00:00') return 0;
  const parts = hms.split(':').map(Number);
  if (parts.length === 3) return (parts[0] * 60) + (parts[1] || 0) + (parts[2] || 0) / 60;
  return (parts[0] || 0) * 60;
};

export const timeUtils = {
  converterMinutosParaHoras: (totalMinutes: number) => {
    const horas = Math.floor(totalMinutes / 60);
    const minutos = Math.floor(totalMinutes % 60);
    const segundos = Math.round((totalMinutes * 60) % 60);
    return { horas, minutos, segundos };
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

// --- SERVIÇOS DE CONFIGURAÇÃO (BASE, TASKS, USERS) ---

export const baseService = {
  async getAll(): Promise<Base[]> {
    let data = getFromStorage<Base[]>(STORAGE_KEYS.BASES, []);
    if (data.length === 0) { data = BASES; saveToStorage(STORAGE_KEYS.BASES, data); }
    return data.filter(b => !b.deletada);
  },
  async obterMetaHoras(baseId: string, mes: number): Promise<number> {
    const bases = await this.getAll();
    const base = bases.find(b => b.id === baseId);
    if (!base) return 160;
    const mesKey = String(mes).padStart(2, '0');
    return base.metaHorasDisponiveisAno?.[mesKey] || 160;
  },
  // Added: obtaining goals for all bases
  async obterMetasTodasAsBases(mes: number): Promise<Record<string, number>> {
    const bases = await this.getAll();
    const res: Record<string, number> = {};
    const mesKey = String(mes).padStart(2, '0');
    bases.forEach(b => {
      res[b.id] = b.metaHorasDisponiveisAno?.[mesKey] || 160;
    });
    return res;
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
    const updated = bases.map(b => b.id === id ? { ...b, deletada: true } : b) as Base[];
    saveToStorage(STORAGE_KEYS.BASES, updated);
  }
};

export const taskService = {
  async getAll(): Promise<Task[]> {
    let data = getFromStorage<Task[]>(STORAGE_KEYS.TASKS, []);
    if (data.length === 0) { data = TASKS; saveToStorage(STORAGE_KEYS.TASKS, data); }
    return data.filter(t => !t.deletada);
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
    const updated = tasks.map(t => t.id === id ? { ...t, deletada: true } : t) as Task[];
    saveToStorage(STORAGE_KEYS.TASKS, updated);
  }
};

export const categoryService = {
  async getAll(): Promise<Category[]> {
    let data = getFromStorage<Category[]>(STORAGE_KEYS.CATEGORIES, []);
    if (data.length === 0) { data = CATEGORIES; saveToStorage(STORAGE_KEYS.CATEGORIES, data); }
    return data.filter(c => !c.deletada);
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
    const updated = cats.map(c => c.id === id ? { ...c, deletada: true } : c) as Category[];
    saveToStorage(STORAGE_KEYS.CATEGORIES, updated);
  }
};

export const userService = {
  async getAll(): Promise<User[]> {
    let data = getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
    if (data.length === 0) { data = USERS; saveToStorage(STORAGE_KEYS.USERS, data); }
    return data.filter(u => !u.deletada);
  },
  async create(data: Omit<User, 'id'>): Promise<User> {
    const users = await this.getAll();
    const newUser = { ...data, id: Math.random().toString(36).substr(2, 9), status: 'Ativo' } as User;
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
    const updated = users.map(u => u.id === id ? { ...u, deletada: true } : u) as User[];
    saveToStorage(STORAGE_KEYS.USERS, updated);
  }
};

export const defaultItemsService = {
  async getLocations(): Promise<DefaultLocationItem[]> {
    let data = getFromStorage<DefaultLocationItem[]>(STORAGE_KEYS.DEF_LOCS, []);
    if (data.length === 0) { data = DEFAULT_LOCATIONS; saveToStorage(STORAGE_KEYS.DEF_LOCS, data); }
    return data.filter(i => !i.deletada);
  },
  async getTransits(): Promise<DefaultTransitItem[]> {
    let data = getFromStorage<DefaultTransitItem[]>(STORAGE_KEYS.DEF_TRANS, []);
    if (data.length === 0) { data = DEFAULT_TRANSITS; saveToStorage(STORAGE_KEYS.DEF_TRANS, data); }
    return data.filter(i => !i.deletada);
  },
  async getCriticals(): Promise<DefaultCriticalItem[]> {
    let data = getFromStorage<DefaultCriticalItem[]>(STORAGE_KEYS.DEF_CRIT, []);
    if (data.length === 0) { data = DEFAULT_CRITICALS; saveToStorage(STORAGE_KEYS.DEF_CRIT, data); }
    return data.filter(i => !i.deletada);
  },
  async getShelfLifes(): Promise<ShelfLifeItem[]> {
    return getFromStorage<ShelfLifeItem[]>(STORAGE_KEYS.DEF_SHELF, []).filter(i => !i.deletada);
  },
  // Added: methods for custom types and items management
  async getCustomTypes(): Promise<CustomControlType[]> {
    return getFromStorage<CustomControlType[]>(STORAGE_KEYS.CUSTOM_TYPES, []);
  },
  async getCustomItems(): Promise<CustomControlItem[]> {
    return getFromStorage<CustomControlItem[]>(STORAGE_KEYS.CUSTOM_ITEMS, []);
  },
  async saveShelfLife(data: any) {
    const list = await this.getShelfLifes();
    const idx = list.findIndex(i => i.id === data.id);
    if (idx > -1) list[idx] = data; else list.push(data);
    saveToStorage(STORAGE_KEYS.DEF_SHELF, list);
  },
  async saveLocation(data: any) {
    const list = await this.getLocations();
    const idx = list.findIndex(i => i.id === data.id);
    if (idx > -1) list[idx] = data; else list.push(data);
    saveToStorage(STORAGE_KEYS.DEF_LOCS, list);
  },
  async saveTransit(data: any) {
    const list = await this.getTransits();
    const idx = list.findIndex(i => i.id === data.id);
    if (idx > -1) list[idx] = data; else list.push(data);
    saveToStorage(STORAGE_KEYS.DEF_TRANS, list);
  },
  async saveCritical(data: any) {
    const list = await this.getCriticals();
    const idx = list.findIndex(i => i.id === data.id);
    if (idx > -1) list[idx] = data; else list.push(data);
    saveToStorage(STORAGE_KEYS.DEF_CRIT, list);
  },
  async saveCustomItem(data: any) {
    const list = await this.getCustomItems();
    const idx = list.findIndex(i => i.id === data.id);
    if (idx > -1) list[idx] = data; else list.push(data);
    saveToStorage(STORAGE_KEYS.CUSTOM_ITEMS, list);
  },
  async deleteShelfLife(id: string) {
    const list = await this.getShelfLifes();
    const updated = list.map(i => i.id === id ? { ...i, deletada: true } : i);
    saveToStorage(STORAGE_KEYS.DEF_SHELF, updated);
  },
  async deleteLocation(id: string) {
    const list = await this.getLocations();
    const updated = list.map(i => i.id === id ? { ...i, deletada: true } : i);
    saveToStorage(STORAGE_KEYS.DEF_LOCS, updated);
  },
  async deleteTransit(id: string) {
    const list = await this.getTransits();
    const updated = list.map(i => i.id === id ? { ...i, deletada: true } : i);
    saveToStorage(STORAGE_KEYS.DEF_TRANS, updated);
  },
  async deleteCritical(id: string) {
    const list = await this.getCriticals();
    const updated = list.map(i => i.id === id ? { ...i, deletada: true } : i);
    saveToStorage(STORAGE_KEYS.DEF_CRIT, updated);
  },
  async deleteCustomItem(id: string) {
    const list = await this.getCustomItems();
    const updated = list.map(i => i.id === id ? { ...i, deletada: true } : i);
    saveToStorage(STORAGE_KEYS.CUSTOM_ITEMS, updated);
  },
  async saveCustomType(data: CustomControlType) {
    const list = await this.getCustomTypes();
    const idx = list.findIndex(i => i.id === data.id);
    if (idx > -1) list[idx] = data; else list.push(data);
    saveToStorage(STORAGE_KEYS.CUSTOM_TYPES, list);
  },
  async deleteCustomType(id: string) {
    const list = await this.getCustomTypes();
    const updated = list.map(i => i.id === id ? { ...i, deletada: true } : i);
    saveToStorage(STORAGE_KEYS.CUSTOM_TYPES, updated);
  }
};

export const monthlyService = {
  async getAll(): Promise<MonthlyCollection[]> {
    return getFromStorage<MonthlyCollection[]>(STORAGE_KEYS.MONTHLY_COLLECTIONS, []);
  },
  async save(data: MonthlyCollection): Promise<void> {
    const collections = await this.getAll();
    const idx = collections.findIndex(c => c.id === data.id);
    if (idx > -1) collections[idx] = data; else collections.push(data);
    saveToStorage(STORAGE_KEYS.MONTHLY_COLLECTIONS, collections);
  }
};

export const controlService = {
  async getAll(): Promise<Control[]> {
    let data = getFromStorage<Control[]>(STORAGE_KEYS.CONTROLS, []);
    if (data.length === 0) { data = CONTROLS; saveToStorage(STORAGE_KEYS.CONTROLS, data); }
    return data;
  },
  // Added: methods to manage controls
  async create(data: Omit<Control, 'id'>): Promise<Control> {
    const list = await this.getAll();
    const newControl = { ...data, id: Math.random().toString(36).substr(2, 9) } as Control;
    saveToStorage(STORAGE_KEYS.CONTROLS, [...list, newControl]);
    return newControl;
  },
  async update(id: string, data: Partial<Control>): Promise<void> {
    const list = await this.getAll();
    const updated = list.map(c => c.id === id ? { ...c, ...data } : c) as Control[];
    saveToStorage(STORAGE_KEYS.CONTROLS, updated);
  }
};

export const validationService = {
  validarPassagem: (handover: ShiftHandover, tasks: Task[], categories: Category[]) => {
    const camposPendentes: string[] = [];
    if (!handover.turnoId) camposPendentes.push("Configuração - Turno: Campo obrigatório");
    if (!handover.colaboradores.some(c => c !== null)) camposPendentes.push("Configuração - Equipe: Pelo menos um colaborador é obrigatório");
    if (!handover.informacoesImportantes?.trim()) camposPendentes.push("Observações - Notas da Base: Informações importantes são obrigatórias");

    return { valido: camposPendentes.length === 0, camposPendentes };
  },
  // Added: duplicate handover validation
  validarPassagemDuplicada: async (dataStr: string, turnoId: string, baseId: string) => {
    const raw = localStorage.getItem('gol_rep_detalhamento');
    const registros = raw ? JSON.parse(raw) : [];
    
    const normDate = dataStr.includes('-') ? dataStr.split('-').reverse().join('/') : dataStr;

    const duplicado = registros.find((r: any) => 
      !r.excluido && r.baseId === baseId && r.data === normDate && String(r.turnoId) === String(turnoId)
    );
    
    if (duplicado) return { valido: false, message: `Já existe uma passagem finalizada para este turno no dia ${normDate}.` };
    return { valido: true };
  },
  // Added: duplicate employee validation
  verificarColaboradoresEmOutrosTurnos: async (dataStr: string, turnoId: string, baseId: string, colaboradoresIds: (string|null)[], users: User[]) => {
    const raw = localStorage.getItem('gol_rep_detalhamento');
    const registros = raw ? JSON.parse(raw) : [];
    const normDate = dataStr.includes('-') ? dataStr.split('-').reverse().join('/') : dataStr;
    
    const turnosDoDia = registros.filter((r: any) => 
      !r.excluido && r.baseId === baseId && r.data === normDate && String(r.turnoId) !== String(turnoId)
    );
    
    const idsPresentes = new Set<string>();
    turnosDoDia.forEach((r: any) => {
      (r.colaboradoresIds || []).forEach((id: string) => id && idsPresentes.add(id));
    });
    
    const duplicados: string[] = [];
    colaboradoresIds.forEach(id => {
      if (id && idsPresentes.has(id)) {
        const nome = users.find(u => u.id === id)?.nome || id;
        duplicados.push(nome);
      }
    });
    
    return { colaboradoresDuplicados: duplicados };
  }
};

// Added: Shared Draft Service implementation
export const sharedDraftService = {
  async getDraft(baseId: string, data: string, turnoId: string) {
    const key = `gol_draft_${baseId}_${data.replace(/\//g, '-')}_${turnoId}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  },
  async saveDraft(baseId: string, data: string, turnoId: string, content: any) {
    const key = `gol_draft_${baseId}_${data.replace(/\//g, '-')}_${turnoId}`;
    localStorage.setItem(key, JSON.stringify({ ...content, updatedAt: Date.now() }));
    try {
        const shiftId = `${data.replace(/\//g, '-')}_${turnoId}`;
        const docRef = doc(db, 'handovers', baseId, 'shifts', shiftId);
        await setDoc(docRef, { ...content, lastModified: serverTimestamp() }, { merge: true });
    } catch (e) { console.error("Firestore draft sync failed", e); }
  }
};

// Added: Base Status Service implementation
export const baseStatusService = {
  async getBaseStatus(baseId: string) {
    const all = getFromStorage<any>(STORAGE_KEYS.BASE_STATUS, {});
    return all[baseId] || null;
  },
  async saveBaseStatus(baseId: string, status: any) {
    const all = getFromStorage<any>(STORAGE_KEYS.BASE_STATUS, {});
    all[baseId] = status;
    saveToStorage(STORAGE_KEYS.BASE_STATUS, all);
  }
};

// Added: Migration Service implementation
export const migrationService = {
  async processarMigracao(handover: ShiftHandover, store: any, editId?: string) {
    const keyDet = 'gol_rep_detalhamento';
    const rawDet = localStorage.getItem(keyDet);
    let registrosDet = rawDet ? JSON.parse(rawDet) : [];
    
    let dataFormatada = handover.data;
    if (dataFormatada.includes('-')) {
      const [y, m, d] = dataFormatada.split('-');
      dataFormatada = `${d}/${m}/${y}`;
    }

    const colaboradoresNomes = handover.colaboradores
      .filter(id => id !== null)
      .map(id => store.users.find((u: any) => u.id === id)?.nome || 'Desconhecido')
      .join(', ');

    const tarefasMap: Record<string, string> = {};
    Object.entries(handover.tarefasExecutadas).forEach(([taskId, val]) => {
       const task = store.tasks.find((t: any) => t.id === taskId);
       if (task) {
          if (task.tipoMedida === MeasureType.TEMPO) {
             tarefasMap[task.nome.toUpperCase()] = val;
          } else {
             const mins = (parseFloat(val) || 0) * task.fatorMultiplicador;
             tarefasMap[task.nome.toUpperCase()] = timeUtils.minutesToHhmmss(mins);
          }
       }
    });

    (handover.nonRoutineTasks || []).forEach(nr => {
       if (!nr.nome) return;
       const val = nr.tempo || '00:00:00';
       const current = tarefasMap[nr.nome.toUpperCase()] || '00:00:00';
       
       let totalMins = hhmmssToMinutes(current);
       if (nr.tipoMedida === MeasureType.QTD) {
          totalMins += (parseFloat(val) || 0) * (nr.fatorMultiplicador || 0);
       } else {
          totalMins += hhmmssToMinutes(val);
       }
       tarefasMap[nr.nome.toUpperCase()] = timeUtils.minutesToHhmmss(totalMins);
    });

    const horasDisponivelMins = handover.colaboradores.reduce((acc, id) => {
        if (!id) return acc;
        return acc + (store.users.find((u: any) => u.id === id)?.jornadaPadrao || 0) * 60;
    }, 0);

    let prodMins = 0;
    Object.values(tarefasMap).forEach(v => prodMins += hhmmssToMinutes(v));

    const novoRegistro = {
      id: editId || `rep_${Date.now()}`,
      baseId: handover.baseId,
      baseSigla: store.bases.find((b: any) => b.id === handover.baseId)?.sigla,
      data: dataFormatada,
      turnoId: handover.turnoId,
      turno: `Turno ${handover.turnoId}`,
      colaboradoresIds: handover.colaboradores,
      nomeColaboradores: colaboradoresNomes,
      horasDisponivel: timeUtils.minutesToHhmmss(horasDisponivelMins),
      horasProduzida: timeUtils.minutesToHhmmss(prodMins),
      percentualPerformance: handover.performance.toFixed(1),
      tarefasMap,
      activities: Object.entries(tarefasMap).map(([name, time]) => ({
         taskNome: name,
         categoryNome: 'GERAL',
         formatted: time
      })),
      informacoesImportantes: handover.informacoesImportantes,
      locationsData: handover.locationsData,
      transitData: handover.transitData,
      shelfLifeData: handover.shelfLifeData,
      criticalData: handover.criticalData,
      excluido: false
    };

    if (editId) {
       registrosDet = registrosDet.map((r: any) => r.id === editId ? novoRegistro : r);
    } else {
       registrosDet.push(novoRegistro);
    }
    localStorage.setItem(keyDet, JSON.stringify(registrosDet));

    // Update gol_rep_acompanhamento
    const keyAcomp = 'gol_rep_acompanhamento';
    const rawAcomp = localStorage.getItem(keyAcomp);
    let registrosAcomp = rawAcomp ? JSON.parse(rawAcomp) : [];
    
    let acomp = registrosAcomp.find((r: any) => r.data === dataFormatada && r.baseId === handover.baseId);
    if (!acomp) {
      acomp = { data: dataFormatada, baseId: handover.baseId, turno1: 'PENDENTE', turno2: 'PENDENTE', turno3: 'PENDENTE', turno4: 'PENDENTE' };
      registrosAcomp.push(acomp);
    }
    
    const base = store.bases.find((b: any) => b.id === handover.baseId);
    const turno = base?.turnos.find((t: any) => t.id === handover.turnoId);
    const numTurno = turno?.numero || 1;
    const turnoKey = `turno${numTurno}`;
    
    if (acomp.hasOwnProperty(turnoKey)) {
       acomp[turnoKey] = 'OK';
    }
    localStorage.setItem(keyAcomp, JSON.stringify(registrosAcomp));
  }
};
