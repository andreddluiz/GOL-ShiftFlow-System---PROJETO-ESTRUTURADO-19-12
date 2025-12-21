
import { create } from 'zustand';
import { 
  Base, User, Category, Task, Control, ControlType,
  DefaultLocationItem, DefaultTransitItem, DefaultCriticalItem 
} from '../types';
import { 
  baseService, userService, taskService, categoryService, 
  controlService, defaultItemsService 
} from '../services';

interface AppState {
  bases: Base[];
  users: User[];
  categories: Category[];
  tasks: Task[];
  controls: Control[];
  defaultLocations: DefaultLocationItem[];
  defaultTransits: DefaultTransitItem[];
  defaultCriticals: DefaultCriticalItem[];
  loading: boolean;
  initialized: boolean;
  
  refreshData: (showFullLoading?: boolean) => Promise<void>;
  
  getOpCategoriesCombinadas: (baseId?: string | null) => Category[];
  getOpTasksCombinadas: (baseId?: string | null) => Task[];
  getControlesCombinados: (baseId: string) => Control[];
  
  // Seletores de Itens Padrão
  getDefaultLocations: (baseId: string) => DefaultLocationItem[];
  getDefaultTransits: (baseId: string) => DefaultTransitItem[];
  getDefaultCriticals: (baseId: string) => DefaultCriticalItem[];
}

export const useStore = create<AppState>((set, get) => ({
  bases: [],
  users: [],
  categories: [],
  tasks: [],
  controls: [],
  defaultLocations: [],
  defaultTransits: [],
  defaultCriticals: [],
  loading: false,
  initialized: false,

  refreshData: async (showFullLoading = false) => {
    if (showFullLoading) set({ loading: true });
    try {
      const [bases, users, tasks, cats, controls, defLocs, defTrans, defCrit] = await Promise.all([
        baseService.getAll(),
        userService.getAll(),
        taskService.getAll(),
        categoryService.getAll(),
        controlService.getAll(),
        defaultItemsService.getLocations(),
        defaultItemsService.getTransits(),
        defaultItemsService.getCriticals()
      ]);
      set({ 
        bases, users, tasks, categories: cats, controls, 
        defaultLocations: defLocs, defaultTransits: defTrans, defaultCriticals: defCrit,
        initialized: true 
      });
    } finally {
      if (showFullLoading) set({ loading: false });
    }
  },

  getOpCategoriesCombinadas: (baseId) => {
    return get().categories.filter(c => 
      c.tipo === 'operacional' && c.status === 'Ativa' && (!c.baseId || c.baseId === baseId)
    ).sort((a,b) => a.ordem - b.ordem);
  },

  getOpTasksCombinadas: (baseId) => {
    return get().tasks.filter(t => 
      t.status === 'Ativa' && (!t.baseId || t.baseId === baseId)
    );
  },

  getControlesCombinados: (baseId) => {
    const all = get().controls.filter(c => c.status === 'Ativo');
    const globais = all.filter(c => c.baseId === null);
    const locais = all.filter(c => c.baseId === baseId);

    const tipos: ControlType[] = ['locations', 'transito', 'shelf_life', 'itens_criticos'];

    return tipos.map(tipo => {
      const local = locais.find(l => l.tipo === tipo);
      const global = globais.find(g => g.tipo === tipo);
      return local || global || {
        id: `fallback-${tipo}`,
        baseId: null,
        nome: tipo.toUpperCase(),
        tipo: tipo,
        descricao: 'Configuração padrão do sistema',
        unidade: 'unidade',
        status: 'Ativo',
        alertaConfig: {
          verde: 2, amarelo: 5, vermelho: 6,
          permitirPopupVerde: false, permitirPopupAmarelo: true, permitirPopupVermelho: true,
          mensagemVerde: '', mensagemAmarelo: 'Atenção ao prazo!', mensagemVermelho: 'LIMITE CRÍTICO ATINGIDO!'
        }
      } as Control;
    });
  },

  getDefaultLocations: (baseId) => {
    return get().defaultLocations.filter(i => 
      i.status === 'ativo' && (!i.baseId || i.baseId === baseId)
    );
  },

  getDefaultTransits: (baseId) => {
    return get().defaultTransits.filter(i => 
      i.status === 'ativo' && (!i.baseId || i.baseId === baseId)
    );
  },

  getDefaultCriticals: (baseId) => {
    return get().defaultCriticals.filter(i => 
      i.status === 'ativo' && (!i.baseId || i.baseId === baseId)
    );
  }
}));
