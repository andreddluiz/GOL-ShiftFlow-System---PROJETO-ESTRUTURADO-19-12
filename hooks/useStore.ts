
import { create } from 'zustand';
import { Base, User, Category, Task, Control } from '../types';
import { baseService, userService, taskService, categoryService, controlService } from '../services';

interface AppState {
  bases: Base[];
  users: User[];
  categories: Category[];
  tasks: Task[];
  controls: Control[];
  loading: boolean;
  initialized: boolean;
  
  // Actions
  setBases: (bases: Base[]) => void;
  setUsers: (users: User[]) => void;
  setCategories: (categories: Category[]) => void;
  setTasks: (tasks: Task[]) => void;
  setControls: (controls: Control[]) => void;
  setLoading: (loading: boolean) => void;
  
  // Ação centralizada de sincronização
  refreshData: (showFullLoading?: boolean) => Promise<void>;
  
  // Getters/Selectors Úteis Combinados
  getOpCategoriesCombinadas: (baseId?: string | null) => Category[];
  getOpTasksCombinadas: (baseId?: string | null) => Task[];
  getMonthlyCategoriesCombinadas: (baseId?: string | null) => Category[];
}

export const useStore = create<AppState>((set, get) => ({
  bases: [],
  users: [],
  categories: [],
  tasks: [],
  controls: [],
  loading: false,
  initialized: false,

  setBases: (bases) => set({ bases }),
  setUsers: (users) => set({ users }),
  setCategories: (categories) => set({ categories }),
  setTasks: (tasks) => set({ tasks }),
  setControls: (controls) => set({ controls }),
  setLoading: (loading) => set({ loading }),

  // Retorna categorias Globais + Categorias da Base Específica
  getOpCategoriesCombinadas: (baseId) => {
    return get().categories.filter(c => 
      c.tipo === 'operacional' && 
      c.status === 'Ativa' && 
      (!c.baseId || c.baseId === baseId)
    ).sort((a,b) => a.ordem - b.ordem);
  },

  // Retorna tarefas Globais + Tarefas da Base Específica
  getOpTasksCombinadas: (baseId) => {
    return get().tasks.filter(t => 
      t.status === 'Ativa' && 
      (!t.baseId || t.baseId === baseId)
    );
  },

  getMonthlyCategoriesCombinadas: (baseId) => {
    return get().categories.filter(c => 
      c.tipo === 'mensal' && 
      c.status === 'Ativa' && 
      (!c.baseId || c.baseId === baseId)
    ).sort((a,b) => a.ordem - b.ordem);
  },

  refreshData: async (showFullLoading = false) => {
    if (showFullLoading) set({ loading: true });
    
    try {
      const [bases, users, tasks, cats, controls] = await Promise.all([
        baseService.getAll(),
        userService.getAll(),
        taskService.getAll(),
        categoryService.getAll(),
        controlService.getAll()
      ]);
      
      set({ 
        bases, 
        users, 
        tasks, 
        categories: cats, 
        controls,
        initialized: true 
      });
    } catch (error) {
      console.error("❌ Erro crítico na sincronização:", error);
    } finally {
      if (showFullLoading) set({ loading: false });
    }
  }
}));
