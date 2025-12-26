
import React, { useState, useMemo, useEffect } from 'react';
import { 
  MapPin, Users as UsersIcon, ClipboardList, CalendarDays,
  Plus, Edit2, Trash2, Globe, Settings2, ShieldAlert,
  CheckCircle, AlertCircle, RotateCcw, Archive, Search
} from 'lucide-react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, IconButton, Tooltip, TextField, Typography, Box, TablePagination, Chip
} from '@mui/material';
import { Base, User, Category, Task } from '../types';
import { 
  baseService, userService, taskService, categoryService 
} from '../services';
import { 
  BaseModal, UserModal, TaskModal, CategoryModal, ConfirmModal
} from '../modals';
import { useStore } from '../hooks/useStore';
import ManagementControlsAlertsPage from './ManagementControlsAlertsPage';

type ManagementTab = 'bases' | 'users' | 'tasks_op' | 'tasks_month' | 'alerts';
type ContextType = 'global' | 'base';

const ManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ManagementTab>('bases');
  const [managementContext, setManagementContext] = useState<ContextType>('global');
  const [contextBaseId, setContextBaseId] = useState<string>('');
  const [showInactive, setShowInactive] = useState(false);
  
  const { 
    bases, users, tasks, categories, 
    refreshData 
  } = useStore();

  const [modalState, setModalState] = useState<{
    open: boolean,
    type: ManagementTab | 'category_op' | 'category_month' | 'task_modal',
    editingItem: any | null
  }>({
    open: false,
    type: 'bases',
    editingItem: null
  });

  const [confirmModal, setConfirmModal] = useState<{
    open: boolean,
    title: string,
    message: string,
    onConfirm: () => void,
    type?: 'danger' | 'warning' | 'info'
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, type: 'success' | 'error' }>({
    open: false, message: '', type: 'success'
  });

  const showSnackbar = (message: string, type: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, type });
    setTimeout(() => setSnackbar(prev => ({ ...prev, open: false })), 4000);
  };

  useEffect(() => {
    refreshData();
  }, [managementContext, contextBaseId, activeTab, refreshData]);

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
        if (editingItem) await categoryService.update(editingItem.id, { ...dataWithContext, visivel: editingItem.visivel ?? true });
        else await categoryService.create({ ...dataWithContext, tipo: type === 'category_op' ? 'operacional' : 'mensal', visivel: true });
      } else if (type === 'task_modal') {
        if (editingItem?.id) {
           await taskService.update(editingItem.id, { ...dataWithContext, visivel: editingItem.visivel ?? true });
        } else {
           await taskService.create({ ...dataWithContext, ordem: tasks.length + 1, status: 'Ativa', visivel: true });
        }
      }
      
      showSnackbar('Dados salvos com sucesso!');
      setModalState({ ...modalState, open: false });
      await refreshData();
    } catch (e) {
      console.error(e);
      showSnackbar('Falha ao salvar os dados', 'error');
    }
  };

  const handleArchive = (id: string, type: string, currentItem?: any) => {
    const isCategory = type.includes('category');
    const label = isCategory ? 'categoria' : 'tarefa';
    
    setConfirmModal({
      open: true,
      title: 'Arquivar Item',
      message: `Deseja arquivar/ocultar a ${label} "${currentItem?.nome || 'este item'}"?\nEla deixará de aparecer na Passagem de Turno, mas continuará disponível para edição no gerenciamento.`,
      type: 'warning',
      onConfirm: async () => {
        try {
          if (isCategory) {
            await categoryService.update(id, { visivel: false });
            showSnackbar('Categoria arquivada com sucesso');
          } else {
            await taskService.update(id, { visivel: false });
            showSnackbar('Tarefa arquivada com sucesso');
          }
          await refreshData();
        } catch (e) {
          showSnackbar(`Erro ao ocultar ${label}`, 'error');
        }
      }
    });
  };

  const handleReactivate = async (id: string, type: string) => {
    const isCategory = type.includes('category');
    try {
      if (isCategory) {
        await categoryService.update(id, { visivel: true });
        showSnackbar('Categoria reativada!');
      } else {
        await taskService.update(id, { visivel: true });
        showSnackbar('Tarefa reativada!');
      }
      await refreshData();
    } catch (e) {
      showSnackbar('Erro ao reativar item', 'error');
    }
  };

  const handleDeletePermanent = (id: string, type: string, currentItem?: any) => {
    const isCategory = type.includes('category');
    const isTask = type === 'task_modal';
    const label = isCategory ? 'categoria' : (isTask ? 'tarefa' : 'item');

    setConfirmModal({
      open: true,
      title: 'Remover Permanentemente',
      message: `Deseja excluir a ${label} "${currentItem?.nome || 'este item'}"?\n\nAtenção: O item será removido das listas de gerenciamento e operação, mas todos os registros históricos feitos até hoje serão preservados nos relatórios.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          if (type === 'bases') await baseService.delete(id);
          else if (type === 'users') await userService.delete(id);
          else if (isCategory) await categoryService.delete(id);
          else if (isTask) await taskService.delete(id);
          
          showSnackbar(`${label.charAt(0).toUpperCase() + label.slice(1)} removida com sucesso`);
          await refreshData();
        } catch (e) {
          showSnackbar('Erro ao excluir item', 'error');
        }
      }
    });
  };

  const filteredCategories = useMemo(() => 
    categories.filter(c => 
      !c.deletada && 
      (managementContext === 'global' ? !c.baseId : c.baseId === contextBaseId) && 
      (activeTab === 'tasks_op' ? c.tipo === 'operacional' : c.tipo === 'mensal') &&
      (showInactive ? true : (c.visivel !== false))
    ),
    [categories, managementContext, contextBaseId, activeTab, showInactive]
  );

  const filteredTasks = useMemo(() => 
    tasks.filter(t => 
      !t.deletada && 
      (managementContext === 'global' ? !t.baseId : t.baseId === contextBaseId) &&
      (showInactive ? true : (t.visivel !== false))
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

      {activeTab !== 'alerts' && (
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
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-orange-600 transition-colors">Exibir Arquivados</span>
                </label>
             )}
             {managementContext === 'base' && (activeTab !== 'bases' && activeTab !== 'users') && (
               <select value={contextBaseId} onChange={(e) => setContextBaseId(e.target.value)} className="w-full md:w-64 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-orange-100 transition-all">
                 <option value="">Selecione a Base...</option>
                 {bases.map(b => <option key={b.id} value={b.id}>{b.sigla}</option>)}
               </select>
             )}
           </div>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] shadow-sm overflow-hidden border border-gray-100 min-h-[500px]">
        <div className="flex overflow-x-auto border-b border-gray-100 bg-gray-50/50 scrollbar-hide">
          <TabButton active={activeTab === 'bases'} onClick={() => setActiveTab('bases')} icon={<MapPin className="w-4 h-4" />} label="Bases" />
          <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<UsersIcon className="w-4 h-4" />} label="Usuários" />
          <TabButton active={activeTab === 'tasks_op'} onClick={() => setActiveTab('tasks_op')} icon={<ClipboardList className="w-4 h-4" />} label="Tarefas Operacionais" />
          <TabButton active={activeTab === 'tasks_month'} onClick={() => setActiveTab('tasks_month'} icon={<CalendarDays className="w-4 h-4" />} label="Tarefas Mensais" />
          <TabButton active={activeTab === 'alerts'} onClick={() => setActiveTab('alerts')} icon={<ShieldAlert className="w-4 h-4" />} label="Controles & Alertas" />
        </div>

        <div className="p-8">
          {activeTab === 'bases' && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <button onClick={() => setModalState({ open: true, type: 'bases', editingItem: null })} className="bg-orange-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-100 hover:bg-orange-700 transition-all">+ Nova Base</button>
              </div>
              <BasesGrid bases={bases} onEdit={i => setModalState({ open: true, type: 'bases', editingItem: i })} onDelete={i => handleDeletePermanent(i.id, 'bases', i)} />
            </div>
          )}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <button onClick={() => setModalState({ open: true, type: 'users', editingItem: null })} className="bg-orange-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-100 hover:bg-orange-700 transition-all">+ Novo Usuário</button>
              </div>
              <UsersTable users={users} bases={bases} onEdit={i => setModalState({ open: true, type: 'users', editingItem: i })} onDelete={id => handleDeletePermanent(id, 'users')} />
            </div>
          )}
          
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
                  <div key={cat.id} className={`rounded-3xl border border-gray-100 p-6 space-y-4 transition-all ${cat.visivel === false ? 'bg-gray-100 opacity-60 border-dashed' : 'bg-gray-50/50'}`}>
                    <div className="flex justify-between items-center">
                       <h4 className="font-black text-gray-700 uppercase tracking-widest text-sm flex items-center space-x-2">
                         <span className={`w-2 h-2 rounded-full ${cat.visivel === false ? 'bg-gray-400' : 'bg-orange-600'}`}></span>
                         <span className={cat.visivel === false ? 'line-through' : ''}>{cat.nome}</span>
                         {cat.visivel === false && <span className="text-[9px] bg-gray-200 px-1.5 py-0.5 rounded text-gray-500 font-black ml-2 uppercase">Arquivado</span>}
                       </h4>
                       <div className="flex space-x-1">
                          <button onClick={() => setModalState({ open: true, type: activeTab === 'tasks_op' ? 'category_op' : 'category_month', editingItem: cat })} className="p-2 text-gray-400 hover:text-orange-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                          {cat.visivel !== false ? (
                            <button onClick={() => handleArchive(cat.id, activeTab === 'tasks_op' ? 'category_op' : 'category_month', cat)} title="Arquivar" className="p-2 text-gray-400 hover:text-amber-600 transition-colors"><Archive className="w-4 h-4" /></button>
                          ) : (
                            <button onClick={() => handleReactivate(cat.id, activeTab === 'tasks_op' ? 'category_op' : 'category_month')} title="Desarquivar" className="p-2 text-orange-600 hover:scale-110 transition-transform"><RotateCcw className="w-4 h-4" /></button>
                          )}
                          <button onClick={() => handleDeletePermanent(cat.id, activeTab === 'tasks_op' ? 'category_op' : 'category_month', cat)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                       </div>
                    </div>
                    <div className="space-y-2">
                       {filteredTasks.filter(t => (t.visivel !== false) && t.categoriaId === cat.id).map(task => (
                         <div key={task.id} className="bg-white p-3 rounded-xl border border-gray-100 flex justify-between items-center group shadow-sm transition-all hover:border-orange-100">
                            <div className="flex flex-col min-w-0 pr-4">
                              <span className="text-xs font-bold text-gray-600 truncate">{task.nome}</span>
                            </div>
                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button onClick={() => setModalState({ open: true, type: 'task_modal', editingItem: task })} className="p-1.5 text-gray-400 hover:text-orange-600 bg-gray-50 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                               <button onClick={() => handleArchive(task.id, 'task_modal', task)} title="Arquivar" className="p-1.5 text-gray-400 hover:text-amber-600 bg-gray-50 rounded-lg"><Archive className="w-3.5 h-3.5" /></button>
                               <button onClick={() => handleDeletePermanent(task.id, 'task_modal', task)} className="p-1.5 text-gray-400 hover:text-red-500 bg-gray-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                         </div>
                       ))}
                       <button 
                        disabled={cat.visivel === false}
                        onClick={() => setModalState({ open: true, type: 'task_modal', editingItem: { categoriaId: cat.id } })}
                        className={`w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-[10px] font-black uppercase text-gray-400 transition-all bg-white/50 ${cat.visivel === false ? 'cursor-not-allowed opacity-50' : 'hover:border-orange-200 hover:text-orange-600'}`}
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
            <div className="animate-in slide-in-from-bottom-4">
              <ManagementControlsAlertsPage />
            </div>
          )}
        </div>
      </div>

      <ConfirmModal 
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ ...confirmModal, open: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />

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
          availableBases={bases}
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
          categories={filteredCategories.filter(c => c.visivel !== false)}
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

const BasesGrid: React.FC<{ bases: Base[], onEdit: (base: Base) => void, onDelete: (base: Base) => void }> = ({ bases, onEdit, onDelete }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4">
    {bases.map(base => (
      <div key={base.id} className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 hover:shadow-lg transition-all group">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-white rounded-2xl shadow-sm text-orange-600"><MapPin className="w-6 h-6" /></div>
          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(base)} className="p-2 text-gray-400 hover:text-orange-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
            <button onClick={() => onDelete(base)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
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

/**
 * UsuariosTable Atualizado (Solicitação 55.0)
 * Inclui colunas BASE e JORNADA.
 */
interface UsuariosTableProps {
  users: User[];
  bases: Base[];
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
}

const formatJornada = (val: number) => {
  if (val === 7.2) return '7,12h';
  return `${val}h`;
};

const UsersTable: React.FC<UsuariosTableProps> = ({ users, bases, onEdit, onDelete }) => {
  console.debug(`[UsuariosTable] Renderizando tabela com ${users.length} usuários`);
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = useMemo(() => {
    console.debug(`[UsuariosTable] Filtrando usuários por: ${searchTerm}`);
    const lowerSearch = searchTerm.toLowerCase();
    
    return users.filter(user => {
      const baseSigla = bases.find(b => b.id === user.bases[0])?.sigla?.toLowerCase() || '';
      const jornadaStr = formatJornada(user.jornadaPadrao).toLowerCase();
      
      return (
        user.nome.toLowerCase().includes(lowerSearch) ||
        user.email.toLowerCase().includes(lowerSearch) ||
        user.permissao.toLowerCase().includes(lowerSearch) ||
        baseSigla.includes(lowerSearch) ||
        jornadaStr.includes(lowerSearch)
      );
    });
  }, [users, bases, searchTerm]);

  const handleChangePage = (_: unknown, newPage: number) => {
    console.debug(`[UsuariosTable] Página alterada para: ${newPage}`);
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.debug(`[UsuariosTable] Linhas por página alteradas para: ${event.target.value}`);
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <Box sx={{ position: 'relative', flex: 1 }}>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text"
            placeholder="Pesquisar por nome, e-mail, cargo, base ou jornada..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-orange-100 transition-all"
          />
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: '2rem', boxShadow: 'none', border: '1px solid #f3f4f6', overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f9fafb' }}>
              <TableCell sx={{ fontWeight: 900, fontSize: '0.7rem', color: '#6b7280', py: 3 }}>NOME</TableCell>
              <TableCell sx={{ fontWeight: 900, fontSize: '0.7rem', color: '#6b7280' }}>E-MAIL</TableCell>
              <TableCell sx={{ fontWeight: 900, fontSize: '0.7rem', color: '#6b7280' }}>CARGO</TableCell>
              <TableCell sx={{ fontWeight: 900, fontSize: '0.7rem', color: '#6b7280' }}>BASE</TableCell>
              <TableCell sx={{ fontWeight: 900, fontSize: '0.7rem', color: '#6b7280' }}>JORNADA</TableCell>
              <TableCell sx={{ fontWeight: 900, fontSize: '0.7rem', color: '#6b7280' }}>STATUS</TableCell>
              <TableCell align="right" sx={{ fontWeight: 900, fontSize: '0.7rem', color: '#6b7280', pr: 4 }}>AÇÕES</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((user) => {
                const baseSigla = bases.find(b => b.id === user.bases[0])?.sigla || '-';
                return (
                  <TableRow key={user.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell sx={{ py: 2.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ w: 32, h: 32, borderRadius: '50%', bgcolor: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#ea580c', fontSize: '0.7rem', width: 32, height: 32 }}>
                          {user.nome.charAt(0)}
                        </Box>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: '#1f2937' }}>{user.nome}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 600 }}>{user.email}</TableCell>
                    <TableCell>
                      <Chip 
                        label={user.permissao.toUpperCase()} 
                        size="small" 
                        sx={{ fontWeight: 900, fontSize: '0.6rem', bgcolor: '#f3f4f6', color: '#4b5563', borderRadius: '0.5rem' }} 
                      />
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 900, fontSize: '0.8rem', color: '#ea580c' }}>{baseSigla}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 800, fontSize: '0.8rem', color: '#1f2937' }}>{formatJornada(user.jornadaPadrao)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: user.status === 'Ativo' ? '#22c55e' : '#9ca3af' }} />
                        <Typography sx={{ fontWeight: 900, fontSize: '0.65rem', color: user.status === 'Ativo' ? '#166534' : '#6b7280', textTransform: 'uppercase' }}>
                          {user.status}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right" sx={{ pr: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => { console.debug(`[UsuariosTable] Editando usuário: ${user.id}`); onEdit(user); }} sx={{ color: '#9ca3af', '&:hover': { color: '#ea580c', bgcolor: '#fff7ed' } }}>
                            <Edit2 size={16} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Excluir">
                          <IconButton size="small" onClick={() => { console.debug(`[UsuariosTable] Deletando usuário: ${user.id}`); onDelete(user.id); }} sx={{ color: '#9ca3af', '&:hover': { color: '#ef4444', bgcolor: '#fef2f2' } }}>
                            <Trash2 size={16} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            {filteredUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Nenhum usuário encontrado para a busca
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredUsers.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Linhas por página:"
        sx={{ mt: 1, '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { fontWeight: 800, fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase' } }}
      />
    </Box>
  );
};

export default ManagementPage;
