
import React, { useState, useMemo, useEffect } from 'react';
import { 
  MapPin, Users as UsersIcon, ClipboardList, CalendarDays,
  Plus, Edit2, Trash2, Globe, Settings2, ShieldAlert,
  CheckCircle, AlertCircle, RotateCcw, Archive, Search, ShieldCheck, Loader2
} from 'lucide-react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, IconButton, TextField, Typography, Box, TablePagination, Chip,
  Button, Switch, FormControlLabel, Alert
} from '@mui/material';
import { Base, Category, Task, NivelAcessoCustomizado } from '../types';
import { 
  baseService, taskService, categoryService 
} from '../services';
import { 
  listAllUsers, 
  createUserInFirebase, 
  updateUserInFirebase, 
  toggleUserStatus,
  UserProfileV2 
} from '../services/userManagementService';
import { useAuth } from '../hooks/useAuth';
import { permissaoCustomizavelService } from '../services/permissaoCustomizavelService';
import { 
  BaseModal, UserModal, TaskModal, CategoryModal, ConfirmModal
} from '../modals';
import { useStore } from '../hooks/useStore';
import ManagementControlsAlertsPage from './ManagementControlsAlertsPage';

type ManagementTab = 'bases' | 'users' | 'tasks_op' | 'tasks_month' | 'alerts' | 'permissions';

const ManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<ManagementTab>('bases');
  const [loading, setLoading] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  
  const { bases, tasks, categories, refreshData } = useStore();
  const [firebaseUsers, setFirebaseUsers] = useState<UserProfileV2[]>([]);

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
    open: false, title: '', message: '', onConfirm: () => {}
  });

  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, type: 'success' | 'error' }>({
    open: false, message: '', type: 'success'
  });

  const showSnackbar = (message: string, type: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, type });
    setTimeout(() => setSnackbar(prev => ({ ...prev, open: false })), 4000);
  };

  const loadFirebaseUsers = async () => {
    setLoading(true);
    const result = await listAllUsers();
    if (result.success && result.users) {
      setFirebaseUsers(result.users);
    } else {
      showSnackbar('Falha ao carregar usuários da nuvem.', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'users') loadFirebaseUsers();
  }, [activeTab]);

  const handleSave = async (formData: any) => {
    const { type, editingItem } = modalState;
    
    if (type === 'users') {
      setLoading(true);
      const adminEmail = currentUser?.email || 'admin@system.com';
      
      const userPayload = {
        email: formData.email.toLowerCase().trim(),
        name: formData.nome.toUpperCase().trim(),
        bases: formData.bases || [],
        permissionLevel: formData.permissao,
        jornada: String(formData.jornadaPadrao || 6),
        tipoJornada: formData.tipoJornada || 'Predefinida',
        active: formData.status === 'Ativo'
      };

      let result;
      if (editingItem?.uid) {
        result = await updateUserInFirebase(editingItem.uid, userPayload, adminEmail);
      } else {
        if (!userPayload.email.endsWith('@gol.com.br')) {
          alert('⚠️ Use apenas e-mails corporativos @gol.com.br');
          setLoading(false);
          return;
        }
        result = await createUserInFirebase(userPayload, adminEmail);
      }

      if (result.success) {
        showSnackbar(editingItem ? 'Dados atualizados!' : 'Colaborador criado!');
        if (!editingItem && 'tempPassword' in result) {
          alert(`✅ COLABORADOR CADASTRADO!\n\nE-mail: ${userPayload.email}\nSenha Temporária: ${result.tempPassword}\n\nEnvie os dados ao colaborador.`);
        }
        setModalState({ ...modalState, open: false });
        await loadFirebaseUsers();
      } else {
        alert('❌ Erro no Firebase: ' + result.error);
      }
      setLoading(false);
      return;
    }

    try {
      if (type === 'bases') {
        if (editingItem) await baseService.update(editingItem.id, formData);
        else await baseService.create(formData);
      } else if (type === 'category_op' || type === 'category_month') {
        if (editingItem) await categoryService.update(editingItem.id, { ...formData });
        else await categoryService.create({ ...formData, tipo: type === 'category_op' ? 'operacional' : 'mensal' });
      } else if (type === 'task_modal') {
        if (editingItem?.id) await taskService.update(editingItem.id, { ...formData });
        else await taskService.create({ ...formData, ordem: tasks.length + 1, status: 'Ativa' });
      }
      
      showSnackbar('Dados sincronizados com sucesso!');
      setModalState({ ...modalState, open: false });
      await refreshData();
    } catch (e) {
      showSnackbar('Falha na sincronização local.', 'error');
    }
  };

  const handleToggleActive = async (user: UserProfileV2) => {
    const action = user.active ? 'DESATIVAR' : 'REATIVAR';
    if (!window.confirm(`Deseja realmente ${action} o acesso de ${user.name}?`)) return;

    setLoading(true);
    const result = await toggleUserStatus(user.uid, user.active, currentUser?.email || '');
    if (result.success) {
      showSnackbar(`Usuário ${action === 'DESATIVAR' ? 'arquivado' : 'ativado'}.`);
      await loadFirebaseUsers();
    } else {
      showSnackbar('Erro ao alterar status.', 'error');
    }
    setLoading(false);
  };

  const filteredUsers = useMemo(() => {
    return (firebaseUsers || []).filter(u => showInactive ? true : u.active);
  }, [firebaseUsers, showInactive]);

  return (
    <div className="space-y-6 relative min-h-[600px] animate-in fade-in">
      {loading && (
        <div className="fixed inset-0 z-[300] bg-black/30 backdrop-blur-[2px] flex items-center justify-center">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-orange-600 animate-spin" />
            <Typography sx={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.75rem', color: 'gray', letterSpacing: '0.1em' }}>
              Sincronizando Cloud...
            </Typography>
          </div>
        </div>
      )}

      {snackbar.open && (
        <div className={`fixed top-6 right-6 z-[200] p-4 rounded-2xl shadow-2xl flex items-center space-x-3 border animate-in slide-in-from-right-4 ${
          snackbar.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {snackbar.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-bold text-sm">{snackbar.message}</span>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] shadow-sm overflow-hidden border border-gray-100 min-h-[500px]">
        <div className="flex overflow-x-auto border-b border-gray-100 bg-gray-50/50 scrollbar-hide">
          <TabButton active={activeTab === 'bases'} onClick={() => setActiveTab('bases')} icon={<MapPin className="w-4 h-4" />} label="Bases" />
          <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<UsersIcon className="w-4 h-4" />} label="Usuários (Cloud)" />
          <TabButton active={activeTab === 'tasks_op'} onClick={() => setActiveTab('tasks_op')} icon={<ClipboardList className="w-4 h-4" />} label="Operacional" />
          <TabButton active={activeTab === 'tasks_month'} onClick={() => setActiveTab('tasks_month')} icon={<CalendarDays className="w-4 h-4" />} label="Mensal" />
          <TabButton active={activeTab === 'alerts'} onClick={() => setActiveTab('alerts')} icon={<ShieldAlert className="w-4 h-4" />} label="Controles" />
        </div>

        <div className="p-8">
          {activeTab === 'users' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-2">
              <div className="flex justify-between items-center">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <div>
                    <h3 className="text-xl font-black text-gray-800 uppercase">Gestão de Equipe</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Base de dados centralizada no Firebase</p>
                  </div>
                  <FormControlLabel 
                    control={<Switch size="small" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} color="warning" />} 
                    label={<Typography sx={{ fontSize: '0.65rem', fontWeight: 900, color: 'gray' }}>VER INATIVOS</Typography>}
                  />
                </Box>
                <button 
                  onClick={() => setModalState({ open: true, type: 'users', editingItem: null })} 
                  className="bg-orange-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-orange-100 hover:bg-orange-700 hover:scale-105 transition-all flex items-center gap-2"
                >
                  <Plus size={16} /> Novo Colaborador
                </button>
              </div>
              
              <UsersCloudTable 
                users={filteredUsers} 
                bases={bases} 
                onEdit={i => {
                  const uiData = {
                    ...i,
                    nome: i.name || '',
                    permissao: i.permissionLevel || 'OPERACIONAL',
                    jornadaPadrao: Number(i.jornada || 6),
                    status: i.active ? 'Ativo' : 'Inativo',
                    bases: i.bases || []
                  };
                  setModalState({ open: true, type: 'users', editingItem: uiData });
                }} 
                onToggleStatus={handleToggleActive} 
              />
            </div>
          )}

          {activeTab === 'bases' && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <button onClick={() => setModalState({ open: true, type: 'bases', editingItem: null })} className="bg-orange-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-100 hover:bg-orange-700 transition-all">+ Nova Base</button>
              </div>
              <BasesGrid bases={bases} onEdit={i => setModalState({ open: true, type: 'bases', editingItem: i })} onDelete={() => {}} />
            </div>
          )}

          {(activeTab === 'tasks_op' || activeTab === 'tasks_month') && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                 <h3 className="text-xl font-black text-gray-800 uppercase">{activeTab === 'tasks_op' ? 'Categorias Operacionais' : 'Categorias Mensais'}</h3>
                 <button onClick={() => setModalState({ open: true, type: activeTab === 'tasks_op' ? 'category_op' : 'category_month', editingItem: null })} className="bg-orange-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest">+ Nova Categoria</button>
              </div>
              <CategoriesGrid 
                activeTab={activeTab} 
                categories={categories} 
                tasks={tasks} 
                onEditCat={cat => setModalState({ open: true, type: activeTab === 'tasks_op' ? 'category_op' : 'category_month', editingItem: cat })}
                onEditTask={task => setModalState({ open: true, type: 'task_modal', editingItem: task })}
                onAddTask={catId => setModalState({ open: true, type: 'task_modal', editingItem: { categoriaId: catId } })}
              />
            </div>
          )}

          {activeTab === 'alerts' && <ManagementControlsAlertsPage />}
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
        <BaseModal isOpen={modalState.open} onClose={() => setModalState({ ...modalState, open: false })} onSave={handleSave} title={modalState.editingItem ? 'Editar Base' : 'Nova Base'} initialData={modalState.editingItem} />
      )}
      
      {modalState.open && modalState.type === 'users' && (
        <UserModal 
          isOpen={modalState.open} 
          onClose={() => setModalState({ ...modalState, open: false })} 
          onSave={handleSave} 
          title={modalState.editingItem?.uid ? 'Editar Colaborador' : 'Novo Colaborador'} 
          initialData={modalState.editingItem} 
          availableBases={bases} 
          availableLevels={permissaoCustomizavelService.listarNiveis()}
        />
      )}

      {modalState.open && (modalState.type === 'category_op' || modalState.type === 'category_month') && (
        <CategoryModal isOpen={modalState.open} onClose={() => setModalState({ ...modalState, open: false })} onSave={handleSave} title="Gestão de Categoria" initialData={modalState.editingItem} />
      )}

      {modalState.open && modalState.type === 'task_modal' && (
        <TaskModal isOpen={modalState.open} onClose={() => setModalState({ ...modalState, open: false })} onSave={handleSave} title="Gestão de Tarefa" initialData={modalState.editingItem} categories={categories} />
      )}
    </div>
  );
};

const TabButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-8 py-5 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
      active ? 'border-orange-600 text-orange-600 bg-white' : 'border-transparent text-gray-400 hover:text-gray-600'
    }`}
  >
    {icon} <span>{label}</span>
  </button>
);

const UsersCloudTable: React.FC<{
  users: UserProfileV2[];
  bases: Base[];
  onEdit: (user: UserProfileV2) => void;
  onToggleStatus: (user: UserProfileV2) => void;
}> = ({ users, bases, onEdit, onToggleStatus }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    return (users || []).filter(u => 
      (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [users, searchTerm]);

  return (
    <Box>
      <TextField 
        fullWidth variant="outlined" placeholder="Filtrar por nome ou e-mail..." size="small"
        value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
        sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 4, bgcolor: 'white' } }}
        InputProps={{ startAdornment: <Search className="w-4 h-4 mr-2 text-gray-300" /> }}
      />

      <TableContainer component={Paper} sx={{ borderRadius: 6, boxShadow: 'none', border: '1px solid #f3f4f6' }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#f9fafb' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 900, fontSize: '0.65rem' }}>COLABORADOR</TableCell>
              <TableCell sx={{ fontWeight: 900, fontSize: '0.65rem' }}>ACESSO</TableCell>
              <TableCell sx={{ fontWeight: 900, fontSize: '0.65rem' }}>UNIDADES</TableCell>
              <TableCell sx={{ fontWeight: 900, fontSize: '0.65rem' }}>JORNADA</TableCell>
              <TableCell align="right" sx={{ fontWeight: 900, fontSize: '0.65rem' }}>AÇÕES</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((u) => (
              <TableRow key={u.uid} hover sx={{ opacity: u.active ? 1 : 0.6 }}>
                <TableCell>
                  <Typography sx={{ fontWeight: 900, fontSize: '0.8rem' }}>{u.name || 'S/ NOME'}</Typography>
                  <Typography sx={{ fontSize: '0.65rem', color: 'gray', fontWeight: 600 }}>{u.email}</Typography>
                </TableCell>
                <TableCell>
                  <Chip label={u.permissionLevel || 'N/A'} size="small" sx={{ fontWeight: 900, fontSize: '0.6rem', height: 20, bgcolor: 'orange.50', color: 'orange.900' }} />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {(u.bases || []).map(bId => (
                      <Chip key={bId} label={bases.find(b => b.id === bId)?.sigla || bId} size="small" variant="outlined" sx={{ fontWeight: 900, fontSize: '0.55rem', height: 18 }} />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 800 }}>{u.jornada || '6'}h</Typography>
                </TableCell>
                <TableCell align="right">
                   <IconButton size="small" onClick={() => onEdit(u)} sx={{ color: 'orange.600' }}><Edit2 size={14} /></IconButton>
                   <IconButton size="small" onClick={() => onToggleStatus(u)} color={u.active ? "error" : "success"}>
                     {u.active ? <Archive size={14} /> : <RotateCcw size={14} />}
                   </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'gray', fontWeight: 800 }}>Nenhum colaborador encontrado.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        component="div" count={filtered.length} rowsPerPage={rowsPerPage} page={page}
        onPageChange={(_, p) => setPage(p)} onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
      />
    </Box>
  );
};

const BasesGrid: React.FC<{ bases: Base[], onEdit: (base: Base) => void, onDelete: (base: Base) => void }> = ({ bases, onEdit }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4">
    {bases.map(base => (
      <div key={base.id} className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 hover:shadow-lg transition-all group relative">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-white rounded-2xl shadow-sm text-orange-600"><MapPin className="w-6 h-6" /></div>
          <button onClick={() => onEdit(base)} className="p-2 text-gray-400 hover:text-orange-600 opacity-0 group-hover:opacity-100 transition-all"><Edit2 className="w-4 h-4" /></button>
        </div>
        <h4 className="text-xl font-black text-gray-800 tracking-tight">{base.sigla}</h4>
        <p className="text-xs font-bold text-gray-500 mb-4">{base.nome}</p>
        <Chip label={base.status} size="small" color={base.status === 'Ativa' ? 'success' : 'default'} sx={{ fontWeight: 900, fontSize: '0.6rem' }} />
      </div>
    ))}
  </div>
);

const CategoriesGrid: React.FC<{ 
  activeTab: string, categories: Category[], tasks: Task[], 
  onEditCat: (c: Category) => void, onEditTask: (t: Task) => void, onAddTask: (catId: string) => void 
}> = ({ activeTab, categories, tasks, onEditCat, onEditTask, onAddTask }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
    {categories.filter(c => (activeTab === 'tasks_op' ? c.tipo === 'operacional' : c.tipo === 'mensal')).map(cat => (
      <div key={cat.id} className="rounded-3xl border border-gray-100 p-6 space-y-4 bg-gray-50/50">
        <div className="flex justify-between items-center">
           <h4 className="font-black text-gray-700 uppercase text-sm flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-orange-600"></span>
             <span>{cat.nome}</span>
           </h4>
           <button onClick={() => onEditCat(cat)} className="p-2 text-gray-400 hover:text-orange-600"><Edit2 className="w-4 h-4" /></button>
        </div>
        <div className="space-y-2">
           {tasks.filter(t => t.categoriaId === cat.id).map(task => (
             <div key={task.id} className="bg-white p-3 rounded-xl border border-gray-100 flex justify-between items-center group hover:border-orange-100 shadow-sm transition-all">
                <span className="text-xs font-bold text-gray-600 truncate">{task.nome}</span>
                <button onClick={() => onEditTask(task)} className="p-1.5 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-orange-600"><Edit2 className="w-3.5 h-3.5" /></button>
             </div>
           ))}
           <button 
            onClick={() => onAddTask(cat.id)}
            className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-[10px] font-black uppercase text-gray-400 hover:border-orange-200 hover:text-orange-600 transition-all bg-white/50"
           >
             + Adicionar Tarefa
           </button>
        </div>
      </div>
    ))}
  </div>
);

export default ManagementPage;
