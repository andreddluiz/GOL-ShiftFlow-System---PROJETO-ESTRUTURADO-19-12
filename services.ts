
import { 
  Base, User, Category, Task, Control, 
  DefaultLocationItem, DefaultTransitItem, DefaultCriticalItem,
  ShelfLifeItem, CustomControlType, CustomControlItem,
  ShiftHandover, Indicator, Report, OutraAtividade, MonthlyCollection, MeasureType
} from './types';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  addDoc,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';

// Utilitário para tratar erros de permissão do Firebase
const handleFirestoreError = (error: any) => {
  console.error("Firestore Error:", error);
  if (error.code === 'permission-denied') {
    throw new Error("ERRO DE PERMISSÃO: O banco de dados Firestore está bloqueando o acesso. Verifique as 'Security Rules' no Console do Firebase.");
  }
  throw error;
};

// Coleções Firestore
const COLLECTIONS = {
  BASES: 'bases',
  USERS: 'usuarios',
  CATEGORIES: 'categorias',
  TASKS: 'tarefas',
  CONTROLS: 'controles',
  DEF_LOCS: 'config_locations',
  DEF_TRANS: 'config_transitos',
  DEF_CRIT: 'config_criticos',
  DEF_SHELF: 'config_shelf_life',
  CUSTOM_TYPES: 'config_custom_types',
  CUSTOM_ITEMS: 'config_custom_items',
  HANDOVERS: 'handovers_diarios',
  MONTHLY_COLLECTIONS: 'coletas_mensais',
  BASE_STATUS: 'status_bases_persistente'
};

/**
 * Utilitários de Tempo
 */
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

/**
 * Serviço de Bases Operacionais
 */
export const baseService = {
  async getAll(): Promise<Base[]> {
    try {
      const q = query(collection(db, COLLECTIONS.BASES), where('deletada', '==', false));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Base));
    } catch (e) { return handleFirestoreError(e); }
  },

  async obterMetaHoras(baseId: string, mes: number): Promise<number> {
    try {
      const docRef = doc(db, COLLECTIONS.BASES, baseId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return 160;
      const base = docSnap.data() as Base;
      const mesKey = String(mes).padStart(2, '0');
      return base.metaHorasDisponiveisAno?.[mesKey] || 160;
    } catch (e) { return handleFirestoreError(e); }
  },

  async obterMetasTodasAsBases(mes: number): Promise<Record<string, number>> {
    try {
      const q = query(collection(db, COLLECTIONS.BASES), where('deletada', '==', false));
      const querySnapshot = await getDocs(q);
      const metas: Record<string, number> = {};
      const mesKey = String(mes).padStart(2, '0');
      querySnapshot.docs.forEach(d => {
        const data = d.data() as Base;
        metas[d.id] = data.metaHorasDisponiveisAno?.[mesKey] || 160;
      });
      return metas;
    } catch (e) { return handleFirestoreError(e); }
  },

  async create(data: Omit<Base, 'id'>): Promise<Base> {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.BASES), { ...data, deletada: false });
      return { id: docRef.id, ...data } as Base;
    } catch (e) { return handleFirestoreError(e); }
  },

  async update(id: string, data: Partial<Base>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.BASES, id);
      await updateDoc(docRef, data);
    } catch (e) { return handleFirestoreError(e); }
  },

  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.BASES, id);
      await updateDoc(docRef, { deletada: true, status: 'Inativa' });
    } catch (e) { return handleFirestoreError(e); }
  }
};

/**
 * Serviço de Categorias e Tarefas
 */
export const categoryService = {
  async getAll(): Promise<Category[]> {
    try {
      const q = query(collection(db, COLLECTIONS.CATEGORIES), where('deletada', '==', false), orderBy('ordem', 'asc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Category));
    } catch (e) { return handleFirestoreError(e); }
  },
  async create(data: Omit<Category, 'id'>) {
    return addDoc(collection(db, COLLECTIONS.CATEGORIES), { ...data, deletada: false }).catch(handleFirestoreError);
  },
  async update(id: string, data: Partial<Category>) {
    return updateDoc(doc(db, COLLECTIONS.CATEGORIES, id), data).catch(handleFirestoreError);
  },
  async delete(id: string) {
    return updateDoc(doc(db, COLLECTIONS.CATEGORIES, id), { deletada: true }).catch(handleFirestoreError);
  }
};

export const taskService = {
  async getAll(): Promise<Task[]> {
    try {
      const q = query(collection(db, COLLECTIONS.TASKS), where('deletada', '==', false), orderBy('ordem', 'asc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Task));
    } catch (e) { return handleFirestoreError(e); }
  },
  async create(data: Omit<Task, 'id'>) {
    return addDoc(collection(db, COLLECTIONS.TASKS), { ...data, deletada: false }).catch(handleFirestoreError);
  },
  async update(id: string, data: Partial<Task>) {
    return updateDoc(doc(db, COLLECTIONS.TASKS, id), data).catch(handleFirestoreError);
  },
  async delete(id: string) {
    return updateDoc(doc(db, COLLECTIONS.TASKS, id), { deletada: true }).catch(handleFirestoreError);
  }
};

/**
 * Gestão de Rascunhos Colaborativos (Real-time Hub)
 */
export const sharedDraftService = {
  async saveDraft(baseId: string, data: string, turnoId: string, content: any): Promise<void> {
    try {
      const key = `${baseId}_${data.replace(/\//g, '-')}_${turnoId}`;
      const docRef = doc(db, 'shared_drafts', key);
      await setDoc(docRef, { 
        ...content, 
        updatedAt: Timestamp.now(),
        baseId,
        dataRef: data,
        turnoId
      });
    } catch (e) { return handleFirestoreError(e); }
  },

  async getDraft(baseId: string, data: string, turnoId: string): Promise<any | null> {
    try {
      const key = `${baseId}_${data.replace(/\//g, '-')}_${turnoId}`;
      const docRef = doc(db, 'shared_drafts', key);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;
      const d = snap.data();
      return { ...d, updatedAt: d.updatedAt.toMillis() };
    } catch (e) { return handleFirestoreError(e); }
  },

  async clearDraft(baseId: string, data: string, turnoId: string): Promise<void> {
    try {
      const key = `${baseId}_${data.replace(/\//g, '-')}_${turnoId}`;
      await deleteDoc(doc(db, 'shared_drafts', key));
    } catch (e) { return handleFirestoreError(e); }
  }
};

/**
 * Status Persistente da Base (Notas e Controles que ficam de um turno para o outro)
 */
export const baseStatusService = {
  async saveBaseStatus(baseId: string, status: any): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.BASE_STATUS, baseId);
      await setDoc(docRef, { ...status, updatedAt: Timestamp.now() });
    } catch (e) { return handleFirestoreError(e); }
  },
  async getBaseStatus(baseId: string): Promise<any | null> {
    try {
      const docRef = doc(db, COLLECTIONS.BASE_STATUS, baseId);
      const snap = await getDoc(docRef);
      return snap.exists() ? snap.data() : null;
    } catch (e) { return handleFirestoreError(e); }
  }
};

/**
 * Serviço de Migração e Relatórios (Audit Trail)
 */
export const migrationService = {
  async processarMigracao(handover: ShiftHandover, store: any, replaceId?: string): Promise<void> {
    try {
      // 1. Grava no histórico de detalhamento (Handovers Finalizados)
      const recordId = replaceId || `final_${Date.now()}_${handover.baseId}`;
      const handoverRef = doc(db, COLLECTIONS.HANDOVERS, recordId);

      const baseObj = store.bases.find((b: any) => b.id === handover.baseId);
      const turnoObj = baseObj?.turnos.find((t: any) => t.id === handover.turnoId);
      const turnoNumero = turnoObj?.numero || 1;
      const colaboradoresNomes = handover.colaboradores
        .map(id => store.users.find((u:any) => u.id === id)?.nome)
        .filter(Boolean);

      // Cálculos de Produção para o Relatório
      let hProdTotalMin = 0;
      const atividadesDetalhadas: any[] = [];

      // Processar tarefas padrão
      Object.entries(handover.tarefasExecutadas).forEach(([taskId, val]) => {
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
        atividadesDetalhadas.push({ 
          taskNome: task?.nome, 
          categoryNome: cat?.nome, 
          formatted: timeUtils.minutesToHhmmss(mins),
          ordemCat: cat?.ordem || 0, 
          ordemTask: task?.ordem || 0 
        });
      });

      const hDispTotalMin = handover.colaboradores.reduce((acc, id) => 
        acc + (store.users.find((u:any) => u.id === id)?.jornadaPadrao || 0) * 60, 0);

      const record = {
        ...handover,
        id: recordId,
        colaboradoresIds: handover.colaboradores,
        colaboradoresNomes,
        horasDisponivel: timeUtils.minutesToHhmmss(hDispTotalMin),
        horasProduzida: timeUtils.minutesToHhmmss(hProdTotalMin),
        percentualPerformance: hDispTotalMin > 0 ? (hProdTotalMin / hDispTotalMin) * 100 : 0,
        baseSigla: baseObj?.sigla || handover.baseId,
        finalizadoEm: Timestamp.now(),
        excluido: false
      };

      await setDoc(handoverRef, record);

      // 2. Limpa o rascunho do turno
      await sharedDraftService.clearDraft(handover.baseId, handover.data, handover.turnoId);

      // 3. Atualiza o status da base para o próximo turno
      await baseStatusService.saveBaseStatus(handover.baseId, {
        obs: handover.informacoesImportantes,
        locations: handover.locationsData,
        transit: handover.transitData,
        shelfLife: handover.shelfLifeData,
        critical: handover.criticalData
      });
    } catch (e) { return handleFirestoreError(e); }
  }
};

/**
 * Itens de Controle e Configurações Globais
 */
export const defaultItemsService = {
  async getLocations(): Promise<DefaultLocationItem[]> {
    try {
      const snap = await getDocs(query(collection(db, COLLECTIONS.DEF_LOCS), where('deletada', '==', false)));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as DefaultLocationItem));
    } catch (e) { return handleFirestoreError(e); }
  },
  async saveLocation(data: DefaultLocationItem) {
    const id = data.id || `loc_${Date.now()}`;
    await setDoc(doc(db, COLLECTIONS.DEF_LOCS, id), { ...data, id, deletada: false }).catch(handleFirestoreError);
  },
  async deleteLocation(id: string) {
    await updateDoc(doc(db, COLLECTIONS.DEF_LOCS, id), { deletada: true }).catch(handleFirestoreError);
  },
  async getTransits(): Promise<DefaultTransitItem[]> {
    try {
      const snap = await getDocs(query(collection(db, COLLECTIONS.DEF_TRANS), where('deletada', '==', false)));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as DefaultTransitItem));
    } catch (e) { return handleFirestoreError(e); }
  },
  async saveTransit(data: DefaultTransitItem) {
    const id = data.id || `tr_${Date.now()}`;
    await setDoc(doc(db, COLLECTIONS.DEF_TRANS, id), { ...data, id, deletada: false }).catch(handleFirestoreError);
  },
  async deleteTransit(id: string) {
    await updateDoc(doc(db, COLLECTIONS.DEF_TRANS, id), { deletada: true }).catch(handleFirestoreError);
  },
  async getCriticals(): Promise<DefaultCriticalItem[]> {
    try {
      const snap = await getDocs(query(collection(db, COLLECTIONS.DEF_CRIT), where('deletada', '==', false)));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as DefaultCriticalItem));
    } catch (e) { return handleFirestoreError(e); }
  },
  async saveCritical(data: DefaultCriticalItem) {
    const id = data.id || `crit_${Date.now()}`;
    await setDoc(doc(db, COLLECTIONS.DEF_CRIT, id), { ...data, id, deletada: false }).catch(handleFirestoreError);
  },
  async deleteCritical(id: string) {
    await updateDoc(doc(db, COLLECTIONS.DEF_CRIT, id), { deletada: true }).catch(handleFirestoreError);
  },
  async getShelfLifes(): Promise<ShelfLifeItem[]> {
    try {
      const snap = await getDocs(query(collection(db, COLLECTIONS.DEF_SHELF), where('deletada', '==', false)));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as ShelfLifeItem));
    } catch (e) { return handleFirestoreError(e); }
  },
  async saveShelfLife(data: ShelfLifeItem) {
    const id = data.id || `shelf_${Date.now()}`;
    await setDoc(doc(db, COLLECTIONS.DEF_SHELF, id), { ...data, id, deletada: false }).catch(handleFirestoreError);
  },
  async deleteShelfLife(id: string) {
    await updateDoc(doc(db, COLLECTIONS.DEF_SHELF, id), { deletada: true }).catch(handleFirestoreError);
  },
  async getCustomTypes(): Promise<CustomControlType[]> {
    try {
      const snap = await getDocs(query(collection(db, COLLECTIONS.CUSTOM_TYPES), where('deletada', '==', false)));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as CustomControlType));
    } catch (e) { return handleFirestoreError(e); }
  },
  async saveCustomType(data: CustomControlType) {
    await setDoc(doc(db, COLLECTIONS.CUSTOM_TYPES, data.id), { ...data, deletada: false }).catch(handleFirestoreError);
  },
  async deleteCustomType(id: string) {
    await updateDoc(doc(db, COLLECTIONS.CUSTOM_TYPES, id), { deletada: true }).catch(handleFirestoreError);
  },
  async getCustomItems(): Promise<CustomControlItem[]> {
    try {
      const snap = await getDocs(query(collection(db, COLLECTIONS.CUSTOM_ITEMS), where('deletada', '==', false)));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as CustomControlItem));
    } catch (e) { return handleFirestoreError(e); }
  },
  async saveCustomItem(data: any) {
    const id = data.id || `cust_${Date.now()}`;
    await setDoc(doc(db, COLLECTIONS.CUSTOM_ITEMS, id), { ...data, id, deletada: false }).catch(handleFirestoreError);
  },
  async deleteCustomItem(id: string) {
    await updateDoc(doc(db, COLLECTIONS.CUSTOM_ITEMS, id), { deletada: true }).catch(handleFirestoreError);
  }
};

/**
 * Coletas Mensais
 */
export const monthlyService = {
  async getAll(): Promise<MonthlyCollection[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.MONTHLY_COLLECTIONS));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as MonthlyCollection));
    } catch (e) { return handleFirestoreError(e); }
  },
  async save(data: MonthlyCollection): Promise<void> {
    try {
      await setDoc(doc(db, COLLECTIONS.MONTHLY_COLLECTIONS, data.id), { ...data, updatedAt: Timestamp.now() });
    } catch (e) { return handleFirestoreError(e); }
  }
};

/**
 * Serviço de Usuários (Integrado com Auth)
 */
export const userService = {
  async getAll(): Promise<User[]> {
    try {
      const snap = await getDocs(query(collection(db, COLLECTIONS.USERS), where('deletada', '==', false)));
      return snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          nome: data.nome,
          email: data.email,
          status: data.ativo ? 'Ativo' : 'Inativo',
          bases: data.basesAssociadas?.map((b: any) => b.baseId) || [],
          permissao: data.basesAssociadas?.[0]?.nivelAcesso || 'OPERACIONAL',
          jornadaPadrao: 6 
        } as unknown as User;
      });
    } catch (e) { return handleFirestoreError(e); }
  }
};

export const controlService = {
  async getAll(): Promise<Control[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.CONTROLS));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Control));
    } catch (e) { return handleFirestoreError(e); }
  },
  async create(data: any) { return addDoc(collection(db, COLLECTIONS.CONTROLS), data).catch(handleFirestoreError); },
  async update(id: string, data: any) { await updateDoc(doc(db, COLLECTIONS.CONTROLS, id), data).catch(handleFirestoreError); },
  async delete(id: string) { await deleteDoc(doc(db, COLLECTIONS.CONTROLS, id)).catch(handleFirestoreError); }
};

export const validationService = {
  validarPassagem: (handover: ShiftHandover, tasks: Task[], categories: Category[]) => {
    const camposPendentes: string[] = [];
    if (!handover.turnoId) camposPendentes.push("Configuração - Turno: Campo obrigatório");
    if (!handover.colaboradores.some(c => c !== null)) camposPendentes.push("Configuração - Equipe: Pelo menos um colaborador é obrigatório");
    if (!handover.informacoesImportantes?.trim()) camposPendentes.push("Observações - Notas da Base: Informações importantes são obrigatórias");

    handover.shelfLifeData.forEach((i, idx) => {
      if (!i.partNumber || !i.lote || !i.dataVencimento) camposPendentes.push(`Controles Diários - Shelf Life: Linha ${idx+1} - PN, Lote e Vencimento são obrigatórios.`);
    });
    
    tasks.forEach(task => {
      const cat = categories.find(c => c.id === task.categoriaId);
      if (cat?.exibicao === 'lista') {
        const val = handover.tarefasExecutadas[task.id];
        if (val === undefined || val === null || val === '') {
          camposPendentes.push(`Processos Operacionais - ${cat.nome}: O campo "${task.nome}" deve ser preenchido.`);
        }
      }
    });

    return { valido: camposPendentes.length === 0, camposPendentes };
  },
  async validarPassagemDuplicada(data: string, turnoId: string, baseId: string) {
    try {
      const q = query(
        collection(db, COLLECTIONS.HANDOVERS), 
        where('baseId', '==', baseId),
        where('data', '==', data),
        where('turnoId', '==', turnoId),
        where('excluido', '==', false)
      );
      const snap = await getDocs(q);
      return { 
        valido: snap.empty, 
        message: snap.empty ? undefined : "Já existe uma Passagem de Serviço finalizada para este turno neste dia." 
      };
    } catch (e) { return handleFirestoreError(e); }
  },
  async verificarColaboradoresEmOutrosTurnos(data: string, turnoId: string, baseId: string, colaboradoresIds: (string|null)[], allUsers: User[]) {
    return { colaboradoresDuplicados: [] };
  }
};
