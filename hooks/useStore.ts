
import { create } from 'zustand';
import { 
  Base, User, Category, Task, Control, ControlType,
  DefaultLocationItem, DefaultTransitItem, DefaultCriticalItem,
  ShelfLifeItem, CustomControlType, CustomControlItem
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
  defaultShelfLifes: ShelfLifeItem[];
  customControlTypes: CustomControlType[];
  customControlItems: CustomControlItem[];
  loading: boolean;
  initialized: boolean;
  
  refreshData: (showFullLoading?: boolean) => Promise<void>;
  
  // CRUD para Itens de Controle
  saveDefaultItem: (type: 'shelf' | 'loc' | 'trans' | 'crit' | string, data: any) => Promise<void>;
  deleteDefaultItem: (type: 'shelf' | 'loc' | 'trans' | 'crit' | string, id: string) => Promise<void>;
  
  // Custom Control Types
  saveCustomControlType: (data: CustomControlType) => Promise<void>;
  deleteCustomControlType: (id: string) => Promise<void>;

  getOpCategoriesCombinadas: (baseId?: string | null) => Category[];
  getOpTasksCombinadas: (baseId?: string | null) => Task[];
  getControlesCombinados: (baseId: string) => Control[];
  
  getDefaultLocations: (baseId: string) => DefaultLocationItem[];
  getDefaultTransits: (baseId: string) => DefaultTransitItem[];
  getDefaultCriticals: (baseId: string) => DefaultCriticalItem[];
  getDefaultShelfLifes: (baseId: string) => ShelfLifeItem[];
  getCustomControlItems: (baseId: string, typeId: string) => CustomControlItem[];
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
  defaultShelfLifes: [],
  customControlTypes: [],
  customControlItems: [],
  loading: false,
  initialized: false,

  refreshData: async (showFullLoading = false) => {
    if (showFullLoading) set({ loading: true });
    try {
      const [bases, users, tasks, cats, controls, defLocs, defTrans, defCrit, defShelf, custTypes, custItems] = await Promise.all([
        baseService.getAll(),
        userService.getAll(),
        taskService.getAll(),
        categoryService.getAll(),
        controlService.getAll(),
        defaultItemsService.getLocations(),
        defaultItemsService.getTransits(),
        defaultItemsService.getCriticals(),
        defaultItemsService.getShelfLifes(),
        defaultItemsService.getCustomTypes(),
        defaultItemsService.getCustomItems()
      ]);
      set({ 
        // Filtra deletados globalmente
        bases: bases.filter(b => !b.deletada), 
        users: users.filter(u => !u.deletada), 
        tasks: tasks.filter(t => !t.deletada), 
        categories: cats.filter(c => !c.deletada), 
        controls, 
        defaultLocations: defLocs.filter(i => !i.deletada), 
        defaultTransits: defTrans.filter(i => !i.deletada), 
        defaultCriticals: defCrit.filter(i => !i.deletada),
        defaultShelfLifes: defShelf.filter(i => !i.deletada),
        customControlTypes: custTypes.filter(t => !t.deletada),
        customControlItems: custItems.filter(i => !i.deletada),
        initialized: true 
      });
    } finally {
      if (showFullLoading) set({ loading: false });
    }
  },

  saveDefaultItem: async (type, data) => {
    if (type === 'shelf') await defaultItemsService.saveShelfLife(data);
    else if (type === 'loc') await defaultItemsService.saveLocation(data);
    else if (type === 'trans') await defaultItemsService.saveTransit(data);
    else if (type === 'crit') await defaultItemsService.saveCritical(data);
    else await defaultItemsService.saveCustomItem(data);
    await get().refreshData();
  },

  deleteDefaultItem: async (type, id) => {
    if (type === 'shelf') await defaultItemsService.deleteShelfLife(id);
    else if (type === 'loc') await defaultItemsService.deleteLocation(id);
    else if (type === 'trans') await defaultItemsService.deleteTransit(id);
    else if (type === 'crit') await defaultItemsService.deleteCritical(id);
    else await defaultItemsService.deleteCustomItem(id);
    await get().refreshData();
  },

  saveCustomControlType: async (data) => {
    await defaultItemsService.saveCustomType(data);
    await get().refreshData();
  },

  deleteCustomControlType: async (id) => {
    await defaultItemsService.deleteCustomType(id);
    await get().refreshData();
  },

  getOpCategoriesCombinadas: (baseId) => {
    // Filtra categorias visíveis e NÃO DELETADAS para a Passagem de Turno
    return get().categories.filter(c => 
      !c.deletada &&
      c.tipo === 'operacional' && 
      c.status === 'Ativa' && 
      (c.visivel !== false) && 
      (!c.baseId || c.baseId === baseId)
    ).sort((a,b) => a.ordem - b.ordem);
  },

  getOpTasksCombinadas: (baseId) => {
    // Filtra tarefas visíveis e NÃO DELETADAS para a Passagem de Turno
    return get().tasks.filter(t => 
      !t.deletada &&
      t.status === 'Ativa' && 
      (t.visivel !== false) && 
      (!t.baseId || t.baseId === baseId)
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
      !i.deletada && (i.visivel !== false) && (!i.baseId || i.baseId === baseId)
    );
  },

  getDefaultTransits: (baseId) => {
    return get().defaultTransits.filter(i => 
      !i.deletada && (i.visivel !== false) && (!i.baseId || i.baseId === baseId)
    );
  },

  getDefaultCriticals: (baseId) => {
    return get().defaultCriticals.filter(i => 
      !i.deletada && (i.visivel !== false) && (!i.baseId || i.baseId === baseId)
    );
  },

  getDefaultShelfLifes: (baseId) => {
    return get().defaultShelfLifes.filter(i => 
      !i.deletada && (i.visivel !== false) && (!i.baseId || i.baseId === baseId)
    );
  },

  getCustomControlItems: (baseId, typeId) => {
    return get().customControlItems.filter(i => 
      !i.deletada && (i.visivel !== false) && i.tipoId === typeId && (!i.baseId || i.baseId === baseId)
    );
  }
}));
