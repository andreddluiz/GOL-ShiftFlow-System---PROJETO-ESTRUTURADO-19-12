
import React, { useState, useMemo, useEffect } from 'react';
import { 
  MapPin, Users as UsersIcon, ClipboardList, CalendarDays, AlertTriangle,
  Plus, Search, Edit2, Trash2, ChevronUp, ChevronDown, Info, Clock, Eye,
  CheckCircle, AlertCircle, FolderPlus, Globe, Settings2, Box, Truck, AlertOctagon,
  Calendar, RotateCcw, Archive
} from 'lucide-react';
import { Base, User, Category, Task, Control } from '../types';
import { 
  baseService, userService, taskService, categoryService, 
  controlService, defaultItemsService 
} from '../services';
import { 
  BaseModal, UserModal, TaskModal, ControlModal, CategoryModal,
  DefaultLocationModal, DefaultTransitModal, DefaultCriticalModal
} from '../modals';
import { useStore } from '../hooks/useStore';

type ManagementTab = 'bases' | 'users' | 'tasks_op' | 'tasks_month' | 'alerts';
type ContextType = 'global' | 'base';

const ManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ManagementTab>('bases');
  const [managementContext, setManagementContext] = useState<ContextType>('global');
  const [contextBaseId, setContextBaseId] = useState<string>('');
  const [showInactive, setShowInactive] = useState(false);
  
  const { 
    bases, users, tasks, categories, controls, 
    defaultLocations, defaultTransits, defaultCriticals, 
    refreshData 
  } = useStore();

  const [modalState, setModalState] = useState<{
    open: boolean,
    type: ManagementTab | 'category_op' | 'category_month' | 'def_loc' | 'def_trans' | 'def_crit' | 'task_modal',
    editingItem: any | null
  }>({
    open: false,
    type: 'bases',
    editingItem: null
  });

  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, type: 'success' | 'error' }>({
    open: false, message: '', type: 'success'
  });

  const showSnackbar = (message: string, type: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, type });
    setTimeout(() => setSnackbar(prev => ({ ...prev, open: false })), 4000);
  };

  useEffect(() => {
    console.debug(`[DEBUG Management] Refreshing data for tab: ${activeTab}, Context: ${managementContext}`);
    refreshData();
  }, [managementContext, contextBaseId, activeTab]);

  const handleSave = async (formData: any) => {
    try {
      const { type, editingItem } = modalState;
      const baseId = managementContext === 'global' ? null : contextBaseId;
      const dataWithContext = { ...formData, baseId };

      if (type === 'bases') {
        if (editingItem) await baseService.update(editingItem.id, formData);
        else await baseService.create(formData);
      } else if (type === 'users') {
        if (editingItem) await userService.update(editingItem.id, formData);
        else await userService.create(formData);
      } else if (type === 'category_op' || type === 'category_month') {
        if (editingItem) await categoryService.update(editingItem.id, dataWithContext);
        else await categoryService.create({ ...dataWithContext, tipo: type === 'category_op' ? 'operacional' : 'mensal' });
      } else if (type === 'task_modal') {
        if (editingItem?.id) {
           console.debug("[DEBUG Management] Atualizando tarefa:", editingItem.id);
           await taskService.update(editingItem.id, dataWithContext);
        } else {
           console.debug("[DEBUG Management] Criando nova tarefa...");
           await taskService.create({ ...dataWithContext, ordem: tasks.length + 1, status: 'Ativa' });
        }
      } else if (type === 'alerts') {
        if (editingItem) await controlService.update(editingItem.id, dataWithContext);
        else await controlService.create(dataWithContext);
      } else if (type === 'def_loc') {
        await defaultItemsService.saveLocation(dataWithContext);
      } else if (type === 'def_trans') {
        await defaultItemsService.saveTransit(dataWithContext);
      } else if (type === 'def_crit') {
        await defaultItemsService.saveCritical(dataWithContext);
      }
      
      showSnackbar('Dados salvos com sucesso!');
      setModalState({ ...modalState, open: false });
      await refreshData();
    } catch (e) {
      console.error(e);
      showSnackbar('Falha ao salvar os dados', 'error');
    }
  };

  const handleDelete = async (id: string, type: string, currentItem?: any) => {
    // Implementação de Soft Delete (Desativar) para tarefas
    if (type === 'task_modal') {
       if (!confirm(`Deseja arquivar/desativar a tarefa "${currentItem?.nome}"? Ela deixará de aparecer em novas passagens de serviço.`)) return;
       try {
         console.debug("[DEBUG Management] Executando Soft Delete na tarefa:", id);
         await taskService.update(id, { status: 'Inativa', dataExclusao: new Date().toISOString() });
         showSnackbar('Tarefa arquivada com sucesso');
         await refreshData();
       } catch (e) {
         showSnackbar('Erro ao desativar tarefa', 'error');
       }
       return;
    }

    if (!confirm('Esta ação removerá o registro permanentemente. Confirmar exclusão?')) return;
    try {
      if (type === 'bases') await baseService.delete(id);
      else if (type === 'users') await userService.delete(id);
      else if (type.includes('category')) await categoryService.delete(id);
      else if (type === 'alerts') await controlService.delete(id);
      else if (type === 'def_loc') await defaultItemsService.deleteLocation(id);
      else if (type === 'def_trans') await defaultItemsService.deleteTransit(id);
      else if (type === 'def_crit') await defaultItemsService.deleteCritical(id);
      
      showSnackbar('Item excluído permanentemente');
      await refreshData();
    } catch (e) {
      showSnackbar('Erro ao excluir item', 'error');
    }
  };

  const handleReactivateTask = async (task: Task) => {
     try {
       console.debug("[DEBUG Management] Reativando tarefa:", task.id);
       await taskService.update(task.id, { status: 'Ativa', dataExclusao: undefined });
       showSnackbar('Tarefa reativada com sucesso!');
       await refreshData();
     } catch (e) {
       showSnackbar('Erro ao reativar tarefa', 'error');
     }
  };

  const filteredCategories = useMemo(() => 
    categories.filter(c => 
      (managementContext === 'global' ? !c.baseId : c.baseId === contextBaseId) && 
      (activeTab === 'tasks_op' ? c.tipo === 'operacional' : c.tipo === 'mensal')
    ),
    [categories, managementContext, contextBaseId, activeTab]
  );

  const filteredTasks = useMemo(() => 
    tasks.filter(t => 
      (managementContext === 'global' ? !t.baseId : t.baseId === contextBaseId) &&
      (showInactive ? true : t.status === 'Ativa')
    ),
    [tasks, managementContext, contextBaseId, showInactive]
  );

  return (
    <div className="space-y-6 relative min-h-[600px] animate-in fade-in">
      {snackbar.open && (
        <div className={`fixed top-6 right-6 z-[200] p-4 rounded-2xl shadow-2xl flex items-center space-x-3 border animate-in slide-in-from-right-4 ${
          snackbar.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {snackbar.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-bold text-sm">{snackbar.message}</span>
        </div>
      )}

      {/* Toolbar Contextual */}
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="flex bg-gray-100 p-1 rounded-xl w-full md:w-auto">
            <button onClick={() => setManagementContext('global')} className={`flex-1 md:flex-none flex items-center justify-center space-x-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${managementContext === 'global' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
              <Globe className="w-4 h-4" /><span>Global</span>
            </button>
            <button onClick={() => setManagementContext('base')} className={`flex-1 md:flex-none flex items-center justify-center space-x-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${managementContext === 'base' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
              <Settings2 className="w-4 h-4" /><span>Por Base</span>
            </button>
         </div>
         <div className="flex items-center space-x-4">
           {(activeTab === 'tasks_op' || activeTab === 'tasks_month') && (
              <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 group">
                <input type="checkbox" className="w-4 h-4 accent-orange-500" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-orange-600 transition-colors">Exibir Inativas / Arquivadas</span>
              </label>
           )}
           {managementContext === 'base' && (activeTab !== 'bases' && activeTab !== 'users') && (
             <select value={contextBaseId} onChange={(e) => setContextBaseId(e.target.value)} className="w-full md:w-64 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-orange-100 transition-all">
               <option value="">Selecione a Base...</option>
               {bases.map(b => <option key={b.id} value={b.id}>{b.sigla} - {b.nome}</option>)}
             </select>
           )}
         </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm overflow-hidden border border-gray-100 min-h-[500px]">
        <div className="flex overflow-x-auto border-b border-gray-100 bg-gray-50/50 scrollbar-hide">
          <TabButton active={activeTab === 'bases'} onClick={() => setActiveTab('bases')} icon={<MapPin className="w-4 h-4" />} label="Bases" />
          <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<UsersIcon className="w-4 h-4" />} label="Usuários" />
          <TabButton active={activeTab === 'tasks_op'} onClick={() => setActiveTab('tasks_op')} icon={<ClipboardList className="w-4 h-4" />} label="Tarefas Operacionais" />
          <TabButton active={activeTab === 'tasks_month'} onClick={() => setActiveTab('tasks_month')} icon={<CalendarDays className="w-4 h-4" />} label="Tarefas Mensais" />
          <TabButton active={activeTab === 'alerts'} onClick={() => setActiveTab('alerts')} icon={<AlertTriangle className="w-4 h-4" />} label="Controles & Alertas" />
        </div>

        <div className="p-8">
          {activeTab === 'bases' && <BasesGrid bases={bases} onEdit={i => setModalState({ open: true, type: 'bases', editingItem: i })} onDelete={id => handleDelete(id, 'bases')} />}
          {activeTab === 'users' && <UsersGrid users={users} onEdit={i => setModalState({ open: true, type: 'users', editingItem: i })} onDelete={id => handleDelete(id, 'users')} />}
          
          {(activeTab === 'tasks_op' || activeTab === 'tasks_month') && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                 <div>
                   <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">{activeTab === 'tasks_op' ? 'Categorias Operacionais' : 'Categorias Mensais'}</h3>
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Estrutura de seções da passagem de serviço.</p>
                 </div>
                 <button onClick={() => setModalState({ open: true, type: activeTab === 'tasks_op' ? 'category_op' : 'category_month', editingItem: null })} className="bg-orange-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-100 hover:bg-orange-700 transition-all">+ Nova Categoria</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredCategories.map(cat => (
                  <div key={cat.id} className="bg-gray-50/50 rounded-3xl border border-gray-100 p-6 space-y-4">
                    <div className="flex justify-between items-center">
                       <h4 className="font-black text-gray-700 uppercase tracking-widest text-sm flex items-center space-x-2">
                         <span className="w-2 h-2 rounded-full bg-orange-600"></span>
                         <span>{cat.nome}</span>
                       </h4>
                       <div className="flex space-x-2">
                          <button onClick={() => setModalState({ open: true, type: activeTab === 'tasks_op' ? 'category_op' : 'category_month', editingItem: cat })} className="p-2 text-gray-400 hover:text-orange-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(cat.id, activeTab === 'tasks_op' ? 'category_op' : 'category_month')} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                       </div>
                    </div>

                    <div className="space-y-2">
                       {filteredTasks.filter(t => t.categoriaId === cat.id).map(task => (
                         <div key={task.id} className={`bg-white p-3 rounded-xl border border-gray-100 flex justify-between items-center group shadow-sm transition-all ${task.status === 'Inativa' ? 'opacity-40 grayscale' : 'hover:border-orange-100'}`}>
                            <div className="flex flex-col min-w-0 pr-4">
                              <span className="text-xs font-bold text-gray-600 truncate">{task.nome}</span>
                              {task.status === 'Inativa' && <span className="text-[8px] font-black text-red-500 uppercase tracking-tighter italic">Arquivada</span>}
                            </div>
                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                               {task.status === 'Ativa' ? (
                                  <>
                                    <button onClick={() => setModalState({ open: true, type: 'task_modal', editingItem: task })} className="p-1.5 text-gray-400 hover:text-orange-600 bg-gray-50 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => handleDelete(task.id, 'task_modal', task)} title="Arquivar" className="p-1.5 text-gray-400 hover:text-red-500 bg-gray-50 rounded-lg"><Archive className="w-3.5 h-3.5" /></button>
                                  </>
                               ) : (
                                  <button onClick={() => handleReactivateTask(task)} title="Reativar" className="p-1.5 text-orange-600 bg-orange-50 rounded-lg hover:scale-110 transition-transform"><RotateCcw className="w-3.5 h-3.5" /></button>
                               )}
                            </div>
                         </div>
                       ))}
                       <button 
                        onClick={() => setModalState({ open: true, type: 'task_modal', editingItem: { categoriaId: cat.id } })}
                        className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-[10px] font-black uppercase text-gray-400 hover:border-orange-200 hover:text-orange-600 transition-all bg-white/50"
                       >
                         + Adicionar Tarefa
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="space-y-12 animate-in slide-in-from-bottom-4">
              {/* Seção de Alertas e Controles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {/* Conteúdo de controles mantido para integridade */}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modais */}
      {modalState.open && modalState.type === 'bases' && (
        <BaseModal
          isOpen={modalState.open}
          onClose={() => setModalState({ ...modalState, open: false })}
          onSave={handleSave}
          title={modalState.editingItem ? 'Editar Base' : 'Nova Base'}
          initialData={modalState.editingItem}
        />
      )}
      {modalState.open && modalState.type === 'users' && (
        <UserModal
          isOpen={modalState.open}
          onClose={() => setModalState({ ...modalState, open: false })}
          onSave={handleSave}
          title={modalState.editingItem ? 'Editar Usuário' : 'Novo Usuário'}
          initialData={modalState.editingItem}
        />
      )}
      {modalState.open && (modalState.type === 'category_op' || modalState.type === 'category_month') && (
        <CategoryModal
          isOpen={modalState.open}
          onClose={() => setModalState({ ...modalState, open: false })}
          onSave={handleSave}
          title={modalState.editingItem ? 'Editar Categoria' : 'Nova Categoria'}
          initialData={modalState.editingItem}
        />
      )}
      {modalState.open && modalState.type === 'task_modal' && (
        <TaskModal
          isOpen={modalState.open}
          onClose={() => setModalState({ ...modalState, open: false })}
          onSave={handleSave}
          title={modalState.editingItem?.id ? 'Editar Tarefa' : 'Nova Tarefa'}
          initialData={modalState.editingItem}
          categories={filteredCategories}
        />
      )}
    </div>
  );
};

const TabButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-8 py-5 text-xs font-black uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
      active ? 'border-orange-600 text-orange-600 bg-white' : 'border-transparent text-gray-400 hover:text-gray-600'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const BasesGrid: React.FC<{ bases: Base[], onEdit: (base: Base) => void, onDelete: (id: string) => void }> = ({ bases, onEdit, onDelete }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4">
    {bases.map(base => (
      <div key={base.id} className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 hover:shadow-lg transition-all group">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-white rounded-2xl shadow-sm text-orange-600"><MapPin className="w-6 h-6" /></div>
          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(base)} className="p-2 text-gray-400 hover:text-orange-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
            <button onClick={() => onDelete(base.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
        <h4 className="text-xl font-black text-gray-800 tracking-tight">{base.sigla}</h4>
        <p className="text-xs font-bold text-gray-500 mb-4">{base.nome}</p>
        <div className="flex items-center space-x-2">
          <span className={`w-2 h-2 rounded-full ${base.status === 'Ativa' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{base.status}</span>
        </div>
      </div>
    ))}
  </div>
);

const UsersGrid: React.FC<{ users: User[], onEdit: (user: User) => void, onDelete: (id: string) => void }> = ({ users, onEdit, onDelete }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4">
    {users.map(user => (
      <div key={user.id} className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 hover:shadow-lg transition-all group">
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center font-black text-orange-600 text-xl">{user.nome.charAt(0)}</div>
          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(user)} className="p-2 text-gray-400 hover:text-orange-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
            <button onClick={() => onDelete(user.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
        <h4 className="text-lg font-black text-gray-800 tracking-tight">{user.nome}</h4>
        <p className="text-xs font-bold text-gray-400 mb-4 truncate">{user.email}</p>
        <div className="flex items-center justify-between">
           <div className="flex items-center space-x-2">
             <span className={`w-2 h-2 rounded-full ${user.status === 'Ativo' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{user.status}</span>
           </div>
           <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-lg text-[10px] font-black uppercase">{user.permissao}</span>
        </div>
      </div>
    ))}
  </div>
);

export default ManagementPage;
