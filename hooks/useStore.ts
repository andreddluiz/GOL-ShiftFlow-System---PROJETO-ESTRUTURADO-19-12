
import { create } from 'zustand';
import { 
  Base, User, Category, Task, Control, ControlType,
  DefaultLocationItem, DefaultTransitItem, DefaultCriticalItem,
  ShelfLifeItem, CustomControlType, CustomControlItem,
  MonthlyCollection
} from '../types';
import { 
  baseService, userService, taskService, categoryService, 
  controlService, defaultItemsService, monthlyService
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
  monthlyCollections: MonthlyCollection[];
  loading: boolean;
  initialized: boolean;
  
  refreshData: (showFullLoading?: boolean) => Promise<void>;
  
  saveDefaultItem: (type: string, data: any) => Promise<void>;
  deleteDefaultItem: (type: string, id: string) => Promise<void>;
  saveCustomControlType: (data: CustomControlType) => Promise<void>;
  deleteCustomControlType: (id: string) => Promise<void>;
  saveMonthlyCollection: (data: MonthlyCollection) => Promise<void>;

  getOpCategoriesCombinadas: (baseId?: string | null) => Category[];
  getOpTasksCombinadas: (baseId?: string | null) => Task[];
  getMonthlyCategoriesCombinadas: (baseId?: string | null) => Category[];
  getMonthlyTasksCombinadas: (baseId?: string | null) => Task[];
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
  monthlyCollections: [],
  loading: false,
  initialized: false,

  refreshData: async (showFullLoading = false) => {
    if (showFullLoading) set({ loading: true });
    try {
      const [bases, users, tasks, cats, controls, defLocs, defTrans, defCrit, defShelf, custTypes, custItems, monthly] = await Promise.all([
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
        defaultItemsService.getCustomItems(),
        monthlyService.getAll()
      ]);
      set({ 
        bases: (bases || []).filter(b => !b.deletada), 
        users: (users || []).filter(u => !u.deletada), 
        tasks: (tasks || []).filter(t => !t.deletada), 
        categories: (cats || []).filter(c => !c.deletada), 
        controls: controls || [], 
        defaultLocations: (defLocs || []).filter(i => !i.deletada), 
        defaultTransits: (defTrans || []).filter(i => !i.deletada), 
        defaultCriticals: (defCrit || []).filter(i => !i.deletada),
        defaultShelfLifes: (defShelf || []).filter(i => !i.deletada),
        customControlTypes: (custTypes || []).filter(t => !t.deletada),
        customControlItems: (custItems || []).filter(i => !i.deletada),
        monthlyCollections: monthly || [],
        initialized: true 
      });
    } catch (e) {
      console.error("[Store Refresh Error]", e);
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

  saveMonthlyCollection: async (data) => {
    await monthlyService.save(data);
    await get().refreshData();
  },

  getOpCategoriesCombinadas: (baseId) => {
    return get().categories.filter(c => 
      !c.deletada && c.tipo === 'operacional' && c.status === 'Ativa' && (!c.baseId || c.baseId === baseId)
    ).sort((a,b) => a.ordem - b.ordem);
  },

  getOpTasksCombinadas: (baseId) => {
    return get().tasks.filter(t => !t.deletada && t.status === 'Ativa' && (!t.baseId || t.baseId === baseId));
  },

  getMonthlyCategoriesCombinadas: (baseId) => {
    return get().categories.filter(c => 
      !c.deletada && c.tipo === 'mensal' && c.status === 'Ativa' && (!c.baseId || c.baseId === baseId)
    ).sort((a,b) => a.ordem - b.ordem);
  },

  getMonthlyTasksCombinadas: (baseId) => {
    const monthlyCats = get().getMonthlyCategoriesCombinadas(baseId);
    const catIds = new Set(monthlyCats.map(c => c.id));
    return get().tasks.filter(t => !t.deletada && t.status === 'Ativa' && catIds.has(t.categoriaId));
  },

  getControlesCombinados: (baseId) => {
    const all = get().controls.filter(c => c.status === 'Ativo');
    const globais = all.filter(c => c.baseId === null);
    const locais = all.filter(c => c.baseId === baseId);
    const tipos: ControlType[] = ['locations', 'transito', 'shelf_life', 'itens_criticos'];

    return tipos.map(tipo => {
      const control = locais.find(l => l.tipo === tipo) || globais.find(g => g.tipo === tipo);
      return control ? { ...control } : {
        id: `fallback-${tipo}`, baseId: null, nome: tipo.toUpperCase(), tipo, status: 'Ativo', alertaConfig: { verde: 30, amarelo: 15, vermelho: 0 }
      } as any;
    });
  },

  getDefaultLocations: (baseId) => get().defaultLocations.filter(i => !i.deletada && (!i.baseId || i.baseId === baseId)),
  getDefaultTransits: (baseId) => get().defaultTransits.filter(i => !i.deletada && (!i.baseId || i.baseId === baseId)),
  getDefaultCriticals: (baseId) => get().defaultCriticals.filter(i => !i.deletada && (!i.baseId || i.baseId === baseId)),
  getDefaultShelfLifes: (baseId) => get().defaultShelfLifes.filter(i => !i.deletada && (!i.baseId || i.baseId === baseId)),
  getCustomControlItems: (baseId, typeId) => get().customControlItems.filter(i => !i.deletada && i.tipoId === typeId && (!i.baseId || i.baseId === baseId))
}));
