
import { supabase } from './supabaseClient';
import { 
  Base, User, Category, Task, Control, 
  DefaultLocationItem, DefaultTransitItem, DefaultCriticalItem,
  ShelfLifeItem, CustomControlType, CustomControlItem,
  ShiftHandover, Indicator, Report, OutraAtividade, MonthlyCollection, MeasureType
} from './types';

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

export const baseService = {
  async getAll(): Promise<Base[]> {
    const { data, error } = await supabase.from('bases').select('*').eq('status', 'Ativa');
    if (error) return [];
    return (data || []).map(b => ({
        id: b.id,
        nome: b.nome,
        sigla: b.sigla,
        jornada: b.jornada,
        numeroTurnos: b.turnos?.length || 0,
        turnos: b.turnos,
        status: b.status,
        metaVerde: b.meta_verde,
        metaAmarelo: b.meta_amarelo,
        metaVermelho: b.meta_vermelho,
        metaHorasDisponiveisAno: b.meta_horas_ano
    }));
  },
  async obterMetaHoras(baseId: string, mes: number): Promise<number> {
    const { data, error } = await supabase.from('bases').select('meta_horas_ano').eq('id', baseId).single();
    if (error || !data) return 160;
    const mesKey = String(mes).padStart(2, '0');
    return data.meta_horas_ano?.[mesKey] || 160;
  },
  async obterMetasTodasAsBases(mes: number): Promise<Record<string, number>> {
    const { data, error } = await supabase.from('bases').select('id, meta_horas_ano');
    if (error || !data) return {};
    const mesKey = String(mes).padStart(2, '0');
    const result: Record<string, number> = {};
    data.forEach(b => {
      result[b.id] = b.meta_horas_ano?.[mesKey] || 160;
    });
    return result;
  },
  async create(data: Omit<Base, 'id'>): Promise<Base> {
    const id = data.sigla.toLowerCase();
    await supabase.from('bases').insert({
        id,
        nome: data.nome,
        sigla: data.sigla,
        jornada: data.jornada,
        turnos: data.turnos,
        status: data.status,
        meta_verde: data.metaVerde,
        meta_amarelo: data.metaAmarelo,
        meta_vermelho: data.metaVermelho,
        meta_horas_ano: data.metaHorasDisponiveisAno
    });
    return { ...data, id } as Base;
  },
  async update(id: string, data: Partial<Base>): Promise<void> {
    await supabase.from('bases').update({
        nome: data.nome,
        sigla: data.sigla,
        jornada: data.jornada,
        turnos: data.turnos,
        status: data.status,
        meta_verde: data.metaVerde,
        meta_amarelo: data.metaAmarelo,
        meta_vermelho: data.metaVermelho,
        meta_horas_ano: data.metaHorasDisponiveisAno
    }).eq('id', id);
  },
  async delete(id: string): Promise<void> {
    await supabase.from('bases').update({ status: 'Inativa' }).eq('id', id);
  }
};

export const categoryService = {
  async getAll(): Promise<Category[]> {
    const { data, error } = await supabase.from('categories').select('*').order('ordem');
    if (error) return [];
    return data.map(c => ({
        id: c.id,
        nome: c.nome,
        tipo: c.tipo,
        exibicao: c.exibicao,
        ordem: c.ordem,
        status: 'Ativa',
        visivel: c.visivel,
        baseId: c.base_id
    }));
  },
  async create(data: Omit<Category, 'id'>): Promise<Category> {
    const id = `cat_${Date.now()}`;
    await supabase.from('categories').insert({
        id,
        nome: data.nome,
        tipo: data.tipo,
        exibicao: data.exibicao,
        ordem: data.ordem,
        base_id: data.baseId,
        visivel: true
    });
    return { ...data, id } as Category;
  },
  async update(id: string, data: Partial<Category>): Promise<void> {
    await supabase.from('categories').update({
        nome: data.nome,
        exibicao: data.exibicao,
        ordem: data.ordem,
        visivel: data.visivel
    }).eq('id', id);
  },
  async delete(id: string): Promise<void> {
    await supabase.from('categories').update({ visivel: false }).eq('id', id);
  }
};

export const taskService = {
  async getAll(): Promise<Task[]> {
    const { data, error } = await supabase.from('tasks').select('*').order('ordem');
    if (error) return [];
    return data.map(t => ({
        id: t.id,
        categoriaId: t.categoria_id,
        nome: t.nome,
        tipoMedida: t.tipo_medida as MeasureType,
        fatorMultiplicador: t.fator_multiplicador,
        obrigatoriedade: false,
        status: 'Ativa',
        visivel: t.visivel,
        ordem: t.ordem,
        baseId: t.base_id
    }));
  },
  async create(data: Omit<Task, 'id'>): Promise<Task> {
    const id = `task_${Date.now()}`;
    await supabase.from('tasks').insert({
        id,
        categoria_id: data.categoriaId,
        nome: data.nome,
        tipo_medida: data.tipo_medida,
        fator_multiplicador: data.fator_multiplicador,
        base_id: data.baseId,
        ordem: data.ordem,
        visivel: true
    });
    return { ...data, id } as Task;
  },
  async update(id: string, data: Partial<Task>): Promise<void> {
    await supabase.from('tasks').update({
        nome: data.nome,
        categoria_id: data.categoriaId,
        tipo_medida: data.tipo_medida,
        fator_multiplicador: data.fator_multiplicador,
        ordem: data.ordem,
        visivel: data.visivel
    }).eq('id', id);
  },
  async delete(id: string): Promise<void> {
    await supabase.from('tasks').update({ visivel: false }).eq('id', id);
  }
};

export const migrationService = {
  async processarMigracao(handover: ShiftHandover, store: any, replaceId?: string): Promise<void> {
    const payload = {
        id: replaceId || handover.id,
        base_id: handover.baseId,
        data: handover.data,
        turno_id: handover.turnoId,
        colaboradores_ids: handover.colaboradores,
        tarefas_executadas: handover.tarefasExecutadas,
        // Fix: nonRoutineTasks exists in ShiftHandover interface, replacing non_routine_tasks reference
        non_routine_tasks: handover.nonRoutineTasks,
        locations_data: handover.locationsData,
        transit_data: handover.transitData,
        shelf_life_data: handover.shelfLifeData,
        critical_data: handover.criticalData,
        observacoes: handover.informacoesImportantes,
        status: handover.status,
        performance: handover.performance
    };
    if (replaceId) await supabase.from('shift_handovers').update(payload).eq('id', replaceId);
    else await supabase.from('shift_handovers').insert(payload);
  }
};

export const controlService = { async getAll(): Promise<Control[]> { return []; }, async create(d: any) { return d; }, async update(id: string, d: any) { }, async delete(id: string) { } };
export const defaultItemsService = { 
    getLocations: async () => [], 
    getTransits: async () => [], 
    getCriticals: async () => [], 
    getShelfLifes: async () => [],
    getCustomTypes: async () => [],
    getCustomItems: async () => [],
    saveLocation: async (d: any) => {},
    saveTransit: async (d: any) => {},
    saveCritical: async (d: any) => {},
    saveShelfLife: async (d: any) => {},
    saveCustomType: async (d: any) => {},
    saveCustomItem: async (d: any) => {},
    deleteLocation: async (id: string) => {},
    deleteTransit: async (id: string) => {},
    deleteCritical: async (id: string) => {},
    deleteShelfLife: async (id: string) => {},
    deleteCustomType: async (id: string) => {},
    deleteCustomItem: async (id: string) => {}
};
export const userService = { async getAll(): Promise<User[]> { return []; }, async create(d: any) { return d; }, async update(id: string, d: any) { }, async delete(id: string) { } };
export const monthlyService = { async getAll(): Promise<MonthlyCollection[]> { return []; }, async save(d: any) { }, async syncWithReports(c: any) { } };
export const baseStatusService = { async saveBaseStatus(b: string, s: any) { }, async getBaseStatus(b: string) { return null; } };
export const sharedDraftService = { async saveDraft(b: string, d: string, t: string, c: any) { }, async getDraft(b: string, d: string, t: string) { return null; }, async clearDraft(b: string, d: string, t: string) { } };
export const validationService = {
  validarPassagem: (h: any, t: any, c: any) => ({ valido: true, camposPendentes: [] as string[] }),
  validarPassagemDuplicada: async (d: string, t: string, b: string): Promise<{ valido: boolean; message?: string }> => ({ valido: true }),
  verificarColaboradoresEmOutrosTurnos: async (d: string, t: string, b: string, c: any, u: any) => ({ colaboradoresDuplicados: [] as string[] })
};
