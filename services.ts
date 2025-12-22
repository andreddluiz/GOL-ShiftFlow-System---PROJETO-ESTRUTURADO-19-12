
import { 
  Base, User, Category, Task, Control, 
  DefaultLocationItem, DefaultTransitItem, DefaultCriticalItem,
  ShelfLifeItem, CustomControlType, CustomControlItem
} from './types';
import { BASES, CATEGORIES, TASKS, CONTROLS, USERS } from './constants';

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
  CUSTOM_ITEMS: 'gol_shiftflow_custom_control_items'
};

const getFromStorage = <T>(key: string, defaultVal: T[]): T[] => {
  try {
    const data = localStorage.getItem(key);
    const parsed = data ? JSON.parse(data) : defaultVal;
    return parsed;
  } catch (e) {
    console.error("[DEBUG Storage] Erro ao ler storage", key, e);
    return defaultVal;
  }
};

const saveToStorage = <T>(key: string, data: T[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("[DEBUG Storage] Erro ao salvar storage", key, e);
  }
};

export const baseService = {
  async getAll(): Promise<Base[]> {
    let data = getFromStorage<Base>(STORAGE_KEYS.BASES, []);
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
    saveToStorage(STORAGE_KEYS.BASES, bases.filter(b => b.id !== id));
  }
};

export const defaultItemsService = {
  async getLocations(): Promise<DefaultLocationItem[]> {
    return getFromStorage<DefaultLocationItem>(STORAGE_KEYS.DEF_LOCS, []);
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
    saveToStorage(STORAGE_KEYS.DEF_LOCS, items.filter(i => i.id !== id));
  },

  async getTransits(): Promise<DefaultTransitItem[]> {
    return getFromStorage<DefaultTransitItem>(STORAGE_KEYS.DEF_TRANS, []);
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
    saveToStorage(STORAGE_KEYS.DEF_TRANS, items.filter(i => i.id !== id));
  },

  async getCriticals(): Promise<DefaultCriticalItem[]> {
    return getFromStorage<DefaultCriticalItem>(STORAGE_KEYS.DEF_CRIT, []);
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
    saveToStorage(STORAGE_KEYS.DEF_CRIT, items.filter(i => i.id !== id));
  },

  async getShelfLifes(): Promise<ShelfLifeItem[]> {
    return getFromStorage<ShelfLifeItem>(STORAGE_KEYS.DEF_SHELF, []);
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
    saveToStorage(STORAGE_KEYS.DEF_SHELF, items.filter(i => i.id !== id));
  },

  // Novos serviços para custom types
  async getCustomTypes(): Promise<CustomControlType[]> {
    return getFromStorage<CustomControlType>(STORAGE_KEYS.CUSTOM_TYPES, []);
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
    saveToStorage(STORAGE_KEYS.CUSTOM_TYPES, types.filter(t => t.id !== id));
  },

  async getCustomItems(): Promise<CustomControlItem[]> {
    return getFromStorage<CustomControlItem>(STORAGE_KEYS.CUSTOM_ITEMS, []);
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
    saveToStorage(STORAGE_KEYS.CUSTOM_ITEMS, items.filter(i => i.id !== id));
  }
};

export const categoryService = {
  async getAll(): Promise<Category[]> {
    let data = getFromStorage<Category>(STORAGE_KEYS.CATEGORIES, []);
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
    saveToStorage(STORAGE_KEYS.CATEGORIES, cats.filter(c => c.id !== id));
  }
};

export const taskService = {
  async getAll(): Promise<Task[]> {
    let data = getFromStorage<Task>(STORAGE_KEYS.TASKS, []);
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
    saveToStorage(STORAGE_KEYS.TASKS, tasks.filter(t => t.id !== id));
  }
};

export const controlService = {
  async getAll(): Promise<Control[]> {
    let data = getFromStorage<Control>(STORAGE_KEYS.CONTROLS, []);
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
    let data = getFromStorage<User>(STORAGE_KEYS.USERS, []);
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
    saveToStorage(STORAGE_KEYS.USERS, users.filter(u => u.id !== id));
  }
};
