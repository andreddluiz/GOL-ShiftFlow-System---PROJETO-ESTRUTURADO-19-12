
import React, { useState, useMemo } from 'react';
import { 
  MapPin, 
  Users as UsersIcon, 
  ClipboardList, 
  CalendarDays, 
  AlertTriangle,
  Plus,
  Search,
  Edit2,
  Trash2,
  ChevronUp,
  ChevronDown,
  Info,
  Clock,
  Eye,
  CheckCircle,
  AlertCircle,
  FolderPlus,
  Globe,
  Settings2
} from 'lucide-react';
import { Base, User, Category, Task, Control } from '../types';
import { baseService, userService, taskService, categoryService, controlService } from '../services';
import { BaseModal, UserModal, TaskModal, ControlModal, CategoryModal } from '../modals';
import { useStore } from '../hooks/useStore';

type ManagementTab = 'bases' | 'users' | 'tasks_op' | 'tasks_month' | 'alerts';
type ContextType = 'global' | 'base';

const ManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ManagementTab>('bases');
  const [managementContext, setManagementContext] = useState<ContextType>('global');
  const [contextBaseId, setContextBaseId] = useState<string>('');
  
  const { bases, users, tasks, categories, controls, refreshData } = useStore();

  const [modalState, setModalState] = useState<{
    open: boolean,
    type: ManagementTab | 'category_op' | 'category_month',
    editingItem: any | null
  }>({
    open: false,
    type: 'bases',
    editingItem: null
  });

  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, type: 'success' | 'error' }>({
    open: false,
    message: '',
    type: 'success'
  });

  const showSnackbar = (message: string, type: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, type });
    setTimeout(() => setSnackbar(prev => ({ ...prev, open: false })), 4000);
  };

  const handleSave = async (formData: any) => {
    try {
      const { type, editingItem } = modalState;
      
      // Atribui o baseId baseado no contexto atual se for um novo item
      const dataWithContext = {
        ...formData,
        baseId: managementContext === 'global' ? null : (contextBaseId || null)
      };

      if (type === 'bases') {
        if (editingItem) await baseService.update(editingItem.id, formData);
        else await baseService.create(formData);
      } else if (type === 'users') {
        if (editingItem) await userService.update(editingItem.id, formData);
        else await userService.create(formData);
      } else if (type === 'category_op' || type === 'category_month') {
        if (editingItem) await categoryService.update(editingItem.id, dataWithContext);
        else await categoryService.create(dataWithContext);
      } else if (type === 'tasks_op' || type === 'tasks_month') {
        if (editingItem) await taskService.update(editingItem.id, dataWithContext);
        else await taskService.create({ ...dataWithContext, ordem: tasks.length + 1 });
      } else if (type === 'alerts') {
        if (editingItem) await controlService.update(editingItem.id, formData);
        else await controlService.create(formData);
      }
      
      showSnackbar('Salvo com sucesso!');
      setModalState({ ...modalState, open: false });
      await refreshData(false);
    } catch (e) {
      console.error('Erro ao salvar:', e);
      showSnackbar('Falha ao salvar', 'error');
    }
  };

  const handleDelete = async (id: string, type: string) => {
    if (!confirm('Tem certeza?')) return;
    try {
      if (type === 'bases') await baseService.delete(id);
      else if (type === 'users') await userService.delete(id);
      else if (type.startsWith('tasks')) await taskService.delete(id);
      else if (type.startsWith('category')) await categoryService.delete(id);
      // ADDED FIX: Explicitly handle alert/control deletion
      else if (type === 'alerts') await controlService.delete(id);
      
      showSnackbar('Excluído com sucesso!');
      await refreshData(false);
    } catch (e) {
      showSnackbar('Erro ao excluir', 'error');
    }
  };

  // Filtra dados baseados no contexto selecionado
  const filteredCategories = useMemo(() => {
    const isOp = activeTab === 'tasks_op';
    const tipo = isOp ? 'operacional' : 'mensal';
    return categories.filter(c => 
      c.tipo === tipo && 
      (managementContext === 'global' ? !c.baseId : c.baseId === contextBaseId)
    );
  }, [categories, activeTab, managementContext, contextBaseId]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => 
      (managementContext === 'global' ? !t.baseId : t.baseId === contextBaseId)
    );
  }, [tasks, managementContext, contextBaseId]);

  return (
    <div className="space-y-6 relative min-h-[600px]">
      {snackbar.open && (
        <div className={`fixed top-6 right-6 z-[100] p-4 rounded-2xl shadow-2xl flex items-center space-x-3 border animate-in slide-in-from-right-4 ${
          snackbar.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {snackbar.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-bold text-sm">{snackbar.message}</span>
        </div>
      )}

      {/* Seletor de Contexto (Global vs Base) */}
      {(activeTab === 'tasks_op' || activeTab === 'tasks_month') && (
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
           <div className="flex bg-gray-100 p-1 rounded-xl">
              <button 
                onClick={() => setManagementContext('global')}
                className={`flex items-center space-x-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${managementContext === 'global' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Globe className="w-4 h-4" />
                <span>Configurações Globais</span>
              </button>
              <button 
                onClick={() => setManagementContext('base')}
                className={`flex items-center space-x-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${managementContext === 'base' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Settings2 className="w-4 h-4" />
                <span>Configurações por Base</span>
              </button>
           </div>

           {managementContext === 'base' && (
             <div className="flex items-center space-x-3 mr-2 animate-in fade-in slide-in-from-right-2">
                <span className="text-xs font-black text-gray-400 uppercase tracking-tighter">Selecionar Base:</span>
                <select 
                  value={contextBaseId} 
                  onChange={(e) => setContextBaseId(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-orange-200"
                >
                  <option value="">Selecione...</option>
                  {bases.map(b => <option key={b.id} value={b.id}>{b.sigla} - {b.nome}</option>)}
                </select>
             </div>
           )}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        <div className="flex overflow-x-auto border-b border-gray-100 bg-gray-50/50">
          <TabButton active={activeTab === 'bases'} onClick={() => setActiveTab('bases')} icon={<MapPin className="w-4 h-4" />} label="Bases" />
          <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<UsersIcon className="w-4 h-4" />} label="Usuários" />
          <TabButton active={activeTab === 'tasks_op'} onClick={() => setActiveTab('tasks_op')} icon={<ClipboardList className="w-4 h-4" />} label="Tarefas Operacionais" />
          <TabButton active={activeTab === 'tasks_month'} onClick={() => setActiveTab('tasks_month')} icon={<CalendarDays className="w-4 h-4" />} label="Tarefas Mensais" />
          <TabButton active={activeTab === 'alerts'} onClick={() => setActiveTab('alerts')} icon={<AlertTriangle className="w-4 h-4" />} label="Controles & Alertas" />
        </div>

        <div className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
               <h2 className="text-xl font-black text-gray-800">
                 {activeTab === 'tasks_op' ? 'Gerenciamento Operacional' : activeTab === 'tasks_month' ? 'Gerenciamento Mensal' : 'Cadastros'}
               </h2>
               <p className="text-xs font-bold text-gray-400 uppercase">
                 {managementContext === 'global' ? 'Visualizando Dados Globais' : `Visualizando Dados de ${bases.find(b => b.id === contextBaseId)?.sigla || 'Base não selecionada'}`}
               </p>
            </div>
            
            <div className="flex space-x-2 w-full md:w-auto">
              {(activeTab === 'tasks_op' || activeTab === 'tasks_month') && (
                <button 
                  disabled={managementContext === 'base' && !contextBaseId}
                  onClick={() => setModalState({ open: true, type: activeTab === 'tasks_op' ? 'category_op' : 'category_month', editingItem: null })}
                  className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 px-6 py-2.5 rounded-xl font-bold hover:bg-gray-200 transition-all disabled:opacity-50"
                >
                  <FolderPlus className="w-5 h-5" />
                  <span>+ Categoria</span>
                </button>
              )}
              <button 
                disabled={(activeTab === 'tasks_op' || activeTab === 'tasks_month') && managementContext === 'base' && !contextBaseId}
                onClick={() => setModalState({ open: true, type: activeTab, editingItem: null })}
                className="flex-1 md:flex-none flex items-center justify-center space-x-2 gol-orange text-white px-6 py-2.5 rounded-xl font-bold hover:bg-orange-600 shadow-lg shadow-orange-100 disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
                <span>Adicionar Novo</span>
              </button>
            </div>
          </div>

          {activeTab === 'bases' && <BasesGrid bases={bases} onEdit={i => setModalState({ open: true, type: 'bases', editingItem: i })} onDelete={id => handleDelete(id, 'bases')} />}
          {activeTab === 'users' && <UsersGrid users={users} onEdit={i => setModalState({ open: true, type: 'users', editingItem: i })} onDelete={id => handleDelete(id, 'users')} />}
          {(activeTab === 'tasks_op' || activeTab === 'tasks_month') && (
            managementContext === 'base' && !contextBaseId ? (
              <div className="py-20 text-center text-gray-400 font-bold border-2 border-dashed border-gray-100 rounded-3xl">
                Selecione uma base acima para gerenciar as tarefas específicas.
              </div>
            ) : (
              <TasksGrid 
                type={activeTab === 'tasks_op' ? 'operacional' : 'mensal'} 
                categories={filteredCategories} 
                tasks={filteredTasks} 
                onEdit={i => setModalState({ open: true, type: activeTab, editingItem: i })} 
                // ADDED FIX: Distinguish between task and category deletion
                onDeleteTask={id => handleDelete(id, activeTab)} 
                onDeleteCategory={id => handleDelete(id, activeTab === 'tasks_op' ? 'category_op' : 'category_month')}
                onAddTask={() => setModalState({ open: true, type: activeTab, editingItem: null })} 
              />
            )
          )}
          {activeTab === 'alerts' && <AlertsGrid controls={controls} onEdit={i => setModalState({ open: true, type: 'alerts', editingItem: i })} onDelete={id => handleDelete(id, 'alerts')} />}
        </div>
      </div>

      {modalState.open && modalState.type === 'bases' && <BaseModal isOpen={modalState.open} onClose={() => setModalState({...modalState, open: false})} onSave={handleSave} title="Base Operacional" initialData={modalState.editingItem} />}
      {modalState.open && modalState.type === 'users' && <UserModal isOpen={modalState.open} onClose={() => setModalState({...modalState, open: false})} onSave={handleSave} title="Perfil de Usuário" initialData={modalState.editingItem} allBases={bases} />}
      {modalState.open && (modalState.type === 'tasks_op' || modalState.type === 'tasks_month') && <TaskModal isOpen={modalState.open} onClose={() => setModalState({...modalState, open: false})} onSave={handleSave} title="Tarefa" initialData={modalState.editingItem} categories={filteredCategories} />}
      {modalState.open && modalState.type === 'alerts' && <ControlModal isOpen={modalState.open} onClose={() => setModalState({...modalState, open: false})} onSave={handleSave} title="Controle" initialData={modalState.editingItem} />}
      {modalState.open && (modalState.type === 'category_op' || modalState.type === 'category_month') && <CategoryModal isOpen={modalState.open} onClose={() => setModalState({...modalState, open: false})} onSave={handleSave} title="Nova Categoria" tipo={modalState.type === 'category_op' ? 'operacional' : 'mensal'} initialData={modalState.editingItem} />}
    </div>
  );
};

// Tabelas e Grids (Mantendo a estrutura visual mas usando os dados filtrados)

const BasesGrid: React.FC<{ bases: Base[], onEdit: (b: Base) => void, onDelete: (id: string) => void }> = ({ bases, onEdit, onDelete }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {bases.map(base => (
      <div key={base.id} className="border border-gray-100 p-5 rounded-2xl hover:border-orange-200 transition-all bg-white group">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-xl group-hover:bg-orange-500 group-hover:text-white transition-colors">
            <MapPin className="w-6 h-6" />
          </div>
          <div className="flex space-x-1">
            <button onClick={() => onEdit(base)} className="p-2 text-gray-400 hover:text-orange-600"><Edit2 className="w-4 h-4" /></button>
            <button onClick={() => onDelete(base.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
        <h3 className="text-lg font-bold text-gray-800">{base.nome}</h3>
        <p className="text-orange-600 font-black text-2xl">{base.sigla}</p>
      </div>
    ))}
  </div>
);

const UsersGrid: React.FC<{ users: User[], onEdit: (u: User) => void, onDelete: (id: string) => void }> = ({ users, onEdit, onDelete }) => (
  <div className="overflow-x-auto rounded-xl border border-gray-100">
    <table className="w-full text-left">
      <thead className="bg-gray-50 text-[11px] uppercase font-black text-gray-500">
        <tr><th className="px-6 py-4">Usuário</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Ações</th></tr>
      </thead>
      <tbody className="divide-y text-sm">
        {users.map(user => (
          <tr key={user.id} className="hover:bg-gray-50">
            <td className="px-6 py-4 font-bold">{user.nome}</td>
            <td className="px-6 py-4">{user.status}</td>
            <td className="px-6 py-4 text-right">
              <button onClick={() => onEdit(user)} className="p-2 text-gray-400"><Edit2 className="w-4 h-4" /></button>
              <button onClick={() => onDelete(user.id)} className="p-2 text-gray-400"><Trash2 className="w-4 h-4" /></button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ADDED FIX: Updated prop interface and renamed onDelete to clarify its purpose
const TasksGrid: React.FC<{
  type: string, 
  categories: Category[], 
  tasks: Task[], 
  onEdit: (t: Task) => void, 
  onDeleteTask: (id: string) => void, 
  onDeleteCategory: (id: string) => void, 
  onAddTask: () => void
}> = ({ categories, tasks, onEdit, onDeleteTask, onDeleteCategory }) => (
  <div className="space-y-8">
    {categories.length === 0 && (
      <div className="py-20 text-center text-gray-300 font-medium">Nenhuma categoria encontrada neste contexto.</div>
    )}
    {categories.map(cat => (
      <div key={cat.id} className="bg-gray-50/50 rounded-3xl p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-6">
           <h3 className="font-black text-gray-800 uppercase tracking-tight flex items-center space-x-2">
             <span className="w-2 h-6 bg-orange-500 rounded-full"></span>
             <span>{cat.nome}</span>
           </h3>
           <div className="flex space-x-1">
             {/* ADDED FIX: Use dedicated category deletion handler */}
             <button onClick={() => onDeleteCategory(cat.id)} className="p-2 text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
           </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.filter(t => t.categoriaId === cat.id).map(task => (
            <div key={task.id} className="bg-white p-5 rounded-2xl border border-gray-50 flex justify-between items-center hover:shadow-xl hover:shadow-gray-100 transition-all group">
              <div>
                <p className="font-bold text-gray-700">{task.nome}</p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                  {task.tipoMedida} • Fator {task.fatorMultiplicador} min
                </p>
              </div>
              <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEdit(task)} className="p-2 text-gray-400 hover:text-orange-600"><Edit2 className="w-4 h-4" /></button>
                {/* ADDED FIX: Use dedicated task deletion handler */}
                <button onClick={() => onDeleteTask(task.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
          {tasks.filter(t => t.categoriaId === cat.id).length === 0 && (
             <div className="col-span-2 text-center py-4 text-xs text-gray-300 italic">Nenhuma tarefa vinculada.</div>
          )}
        </div>
      </div>
    ))}
  </div>
);

const AlertsGrid: React.FC<{ controls: Control[], onEdit: (c: Control) => void, onDelete: (id: string) => void }> = ({ controls, onEdit, onDelete }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {controls.map(control => (
      <div key={control.id} className="bg-white p-6 rounded-2xl border flex justify-between items-center">
        <div><h4 className="font-bold">{control.nome}</h4><p className="text-xs text-gray-400">{control.tipo}</p></div>
        <div className="flex space-x-1">
          <button onClick={() => onEdit(control)} className="p-2 text-gray-400 hover:text-orange-600"><Edit2 className="w-4 h-4" /></button>
          <button onClick={() => onDelete(control.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>
    ))}
  </div>
);

const TabButton: React.FC<{active: boolean, onClick: () => void, icon: React.ReactNode, label: string}> = ({active, onClick, icon, label}) => (
  <button onClick={onClick} className={`flex items-center space-x-3 px-8 py-5 text-sm font-bold border-b-4 transition-all ${active ? 'border-orange-500 text-orange-600 bg-white' : 'border-transparent text-gray-400 hover:bg-gray-50'}`}>{icon}<span>{label}</span></button>
);

export default ManagementPage;
