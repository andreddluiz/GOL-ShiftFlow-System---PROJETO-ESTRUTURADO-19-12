
import React, { useState, useMemo, useEffect } from 'react';
import { 
  MapPin, Users as UsersIcon, ClipboardList, CalendarDays,
  Plus, Edit2, Trash2, Globe, Settings2, ShieldAlert,
  CheckCircle, AlertCircle, RotateCcw, Archive, Search, ShieldCheck, Lock, ChevronRight
} from 'lucide-react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, IconButton, Tooltip, TextField, Typography, Box, TablePagination, Chip,
  Grid, Card, CardContent, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Switch, Alert
} from '@mui/material';
import { Base, User, Category, Task, Usuario, NivelAcessoCustomizado, PermissaoItem } from '../types';
import { 
  baseService, taskService, categoryService 
} from '../services';
import { authService } from '../services/authService';
import { permissaoCustomizavelService } from '../services/permissaoCustomizavelService';
import { 
  BaseModal, UserModal, TaskModal, CategoryModal, ConfirmModal, minutesToHhmmss
} from '../modals';
import { useStore } from '../hooks/useStore';
import ManagementControlsAlertsPage from './ManagementControlsAlertsPage';

type ManagementTab = 'bases' | 'users' | 'tasks_op' | 'tasks_month' | 'alerts' | 'permissions';
type ContextType = 'global' | 'base';

const ManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ManagementTab>('bases');
  const [managementContext, setManagementContext] = useState<ContextType>('global');
  const [contextBaseId, setContextBaseId] = useState<string>('');
  const [showInactive, setShowInactive] = useState(false);
  
  const { 
    bases, tasks, categories, 
    refreshData 
  } = useStore();

  const [usuariosUnificados, setUsuariosUnificados] = useState<Usuario[]>([]);

  // Estados para Gestão de Permissões (Restaurado)
  const [niveis, setNiveis] = useState<NivelAcessoCustomizado[]>([]);
  const [nivelSelecionado, setNivelSelecionado] = useState<NivelAcessoCustomizado | null>(null);
  const [dialogNovoPerfilAberto, setDialogNovoPerfilAberto] = useState(false);
  const [novoPerfilNome, setNovoPerfilNome] = useState('');
  const [novoPerfilDesc, setNovoPerfilDesc] = useState('');
  const [duplicarDeId, setDuplicarDeId] = useState('');

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

  /**
   * Fix for line 84: Expected 0 arguments, but got 1.
   * Also handled the async nature of listarUsuarios.
   */
  const carregarUsuarios = () => {
    authService.listarUsuarios().then(setUsuariosUnificados);
  };

  const carregarNiveis = () => {
    const data = permissaoCustomizavelService.listarNiveis();
    setNiveis(data);
    if (data.length > 0 && !nivelSelecionado) setNivelSelecionado(data[0]);
  };

  useEffect(() => {
    refreshData();
    carregarUsuarios();
    carregarNiveis();
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
        if (editingItem) {
          const userUnificado: Usuario = {
            ...editingItem,
            ...formData,
            basesAssociadas: formData.bases.map((bId: string) => ({
              baseId: bId,
              nivelAcesso: formData.permissao,
              ativo: formData.status === 'Ativo',
              dataCriacao: editingItem.dataCriacao || new Date().toISOString(),
              dataAtualizacao: new Date().toISOString()
            })),
            ativo: formData.status === 'Ativo'
          };
          /**
           * Fix for line 124: Expected 1 arguments, but got 2.
           * Also added await for the async call.
           */
          await authService.atualizarUsuario(userUnificado);
        } else {
          const novoUser: any = {
            ...formData,
            id: `u-${Date.now()}`,
            basesAssociadas: formData.bases.map((bId: string) => ({
              baseId: bId,
              nivelAcesso: formData.permissao,
              ativo: formData.status === 'Ativo',
              dataCriacao: new Date().toISOString(),
              dataAtualizacao: new Date().toISOString()
            })),
            ativo: formData.status === 'Ativo',
            dataCriacao: new Date().toISOString()
          };
          const raw = localStorage.getItem('gol_shiftflow_users_v2');
          const list = raw ? JSON.parse(raw) : [];
          list.push(novoUser);
          localStorage.setItem('gol_shiftflow_users_v2', JSON.stringify(list));
        }
        carregarUsuarios();
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

  const handleDeletePermanent = (id: string, type: string, currentItem?: any) => {
    setConfirmModal({
      open: true,
      title: 'Remover Permanentemente',
      message: `Deseja excluir "${currentItem?.nome || 'este item'}"?`,
      type: 'danger',
      onConfirm: async () => {
        try {
          if (type === 'bases') await baseService.delete(id);
          else if (type === 'users') {
             const raw = localStorage.getItem('gol_shiftflow_users_v2');
             const list = raw ? JSON.parse(raw) : [];
             const filtered = list.filter((u: any) => u.id !== id);
             localStorage.setItem('gol_shiftflow_users_v2', JSON.stringify(filtered));
             carregarUsuarios();
          }
          else if (type.includes('category')) await categoryService.delete(id);
          else if (type === 'task_modal') await taskService.delete(id);
          
          showSnackbar(`Item removido com sucesso`);
          await refreshData();
        } catch (e) {
          showSnackbar('Erro ao excluir item', 'error');
        }
      }
    });
  };

  // Funções de Gestão de Permissões Restauradas
  const handleCriarPerfil = () => {
    if (!novoPerfilNome) return;
    const novoId = `CUSTOM_${Date.now()}`;
    
    if (duplicarDeId) {
      permissaoCustomizavelService.duplicarNivel(duplicarDeId, novoId, novoPerfilNome);
    } else {
      const novoNivel: NivelAcessoCustomizado = {
        id: novoId,
        nome: novoPerfilNome,
        descricao: novoPerfilDesc,
        tipo: 'CUSTOMIZADO',
        ativo: true,
        dataCriacao: new Date().toISOString(),
        dataAtualizacao: new Date().toISOString(),
        permissoes: {}
      };
      permissaoCustomizavelService.salvarNivel(novoNivel);
    }
    
    carregarNiveis();
    setDialogNovoPerfilAberto(false);
    setNovoPerfilNome(''); setNovoPerfilDesc(''); setDuplicarDeId('');
    showSnackbar('Novo perfil criado com sucesso!');
  };

  const handleDeletarPerfil = (id: string) => {
    setConfirmModal({
        open: true,
        title: 'Excluir Perfil de Acesso',
        message: 'Tem certeza que deseja excluir permanentemente este perfil? Usuários associados a ele poderão perder acesso.',
        type: 'danger',
        onConfirm: () => {
            permissaoCustomizavelService.deletarNivel(id);
            carregarNiveis();
            setNivelSelecionado(niveis[0]);
            showSnackbar('Perfil excluído com sucesso');
        }
    });
  };

  const handleTogglePermissao = (permId: string, value: boolean) => {
    if (!nivelSelecionado || nivelSelecionado.tipo === 'PADRÃO') return;
    
    const atualizado = {
      ...nivelSelecionado,
      permissoes: { ...nivelSelecionado.permissoes, [permId]: value }
    };
    
    permissaoCustomizavelService.salvarNivel(atualizado);
    setNivelSelecionado(atualizado);
    setNiveis(niveis.map(n => n.id === atualizado.id ? atualizado : n));
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

  const permissoesAgrupadas = permissaoCustomizavelService.obterPermissoesPorCategoria();

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

      <div className="bg-white rounded-[2.5rem] shadow-sm overflow-hidden border border-gray-100 min-h-[500px]">
        <div className="flex overflow-x-auto border-b border-gray-100 bg-gray-50/50 scrollbar-hide">
          <TabButton active={activeTab === 'bases'} onClick={() => setActiveTab('bases')} icon={<MapPin className="w-4 h-4" />} label="Bases" />
          <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<UsersIcon className="w-4 h-4" />} label="Usuários" />
          <TabButton active={activeTab === 'permissions'} onClick={() => setActiveTab('permissions')} icon={<ShieldCheck className="w-4 h-4" />} label="Níveis de Acesso" />
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
              <UsersTable users={usuariosUnificados.map(u => ({
                id: u.id,
                nome: u.nome,
                email: u.email,
                bases: u.basesAssociadas.map(b => b.baseId),
                permissao: u.basesAssociadas[0]?.nivelAcesso as any,
                status: u.ativo ? 'Ativo' : 'Inativo',
                jornadaPadrao: 6 // Fallback
              }))} bases={bases} onEdit={i => {
                const fullUser = usuariosUnificados.find(u => u.id === i.id);
                setModalState({ open: true, type: 'users', editingItem: fullUser });
              }} onDelete={id => handleDeletePermanent(id, 'users')} />
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="animate-in fade-in slide-in-from-bottom-2">
                <Grid container spacing={4}>
                    <Grid item xs={12} md={4}>
                    <Card sx={{ borderRadius: 6, border: '1px solid #f3f4f6', boxShadow: 'none' }}>
                        <CardContent sx={{ p: 3 }}>
                        <Button 
                            fullWidth 
                            variant="contained" 
                            color="warning" 
                            startIcon={<Plus size={18}/>} 
                            onClick={() => setDialogNovoPerfilAberto(true)} 
                            sx={{ borderRadius: 3, fontWeight: 900, mb: 3 }}
                        >
                            Novo Perfil
                        </Button>
                        
                        <Typography sx={{ fontWeight: 950, fontSize: '0.65rem', color: '#9ca3af', textTransform: 'uppercase', mb: 2, px: 1 }}>Perfis do Sistema</Typography>
                        
                        <Box className="space-y-2">
                            {niveis.map(n => (
                            <Paper 
                                key={n.id} 
                                onClick={() => setNivelSelecionado(n)}
                                sx={{ 
                                p: 2, cursor: 'pointer', borderRadius: 4, border: '2px solid',
                                borderColor: nivelSelecionado?.id === n.id ? '#FF5A00' : 'transparent',
                                bgcolor: nivelSelecionado?.id === n.id ? '#fff7ed' : '#fff',
                                transition: 'all 0.2s', boxShadow: 'none',
                                '&:hover': { bgcolor: '#fffcf9' }
                                }}
                            >
                                <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <Typography sx={{ fontWeight: 900, fontSize: '0.85rem' }}>{n.nome}</Typography>
                                    <Chip label={n.tipo} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 900, mt: 0.5, bgcolor: n.tipo === 'PADRÃO' ? '#f3f4f6' : '#e0f2fe' }} />
                                </div>
                                {n.tipo === 'CUSTOMIZADO' && (
                                    <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDeletarPerfil(n.id); }}>
                                    <Trash2 size={14}/>
                                    </IconButton>
                                )}
                                </div>
                            </Paper>
                            ))}
                        </Box>
                        </CardContent>
                    </Card>
                    </Grid>

                    <Grid item xs={12} md={8}>
                    {nivelSelecionado ? (
                        <Card sx={{ borderRadius: 6, border: '1px solid #f3f4f6', boxShadow: 'none' }}>
                        <CardContent sx={{ p: 4 }}>
                            <div className="flex justify-between items-center mb-6">
                            <div>
                                <Typography variant="h6" sx={{ fontWeight: 950 }}>{nivelSelecionado.nome}</Typography>
                                <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 600 }}>{nivelSelecionado.descricao}</Typography>
                            </div>
                            {nivelSelecionado.tipo === 'PADRÃO' && (
                                <Chip icon={<Lock size={14}/>} label="Perfil Protegido" size="small" sx={{ fontWeight: 900, bgcolor: '#fef3c7', color: '#92400e' }} />
                            )}
                            </div>

                            {nivelSelecionado.tipo === 'PADRÃO' && (
                            <Alert severity="warning" sx={{ mb: 4, borderRadius: 3, fontWeight: 700 }}>
                                Perfis padrão não podem ser alterados. Crie um perfil customizado para definir novas regras.
                            </Alert>
                            )}

                            <Box className="space-y-6">
                            {Object.entries(permissoesAgrupadas).map(([cat, perms]) => (
                                <Box key={cat}>
                                <Typography sx={{ fontWeight: 950, fontSize: '0.7rem', color: '#ea580c', textTransform: 'uppercase', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <ChevronRight size={14}/> {cat}
                                </Typography>
                                <Grid container spacing={2}>
                                    {perms.map(p => (
                                    <Grid item xs={12} sm={6} key={p.id}>
                                        <Paper sx={{ p: 2.5, borderRadius: 4, border: '1px solid #f3f4f6', boxShadow: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Box>
                                            <Typography sx={{ fontWeight: 800, fontSize: '0.8rem' }}>{p.nome}</Typography>
                                            <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 600 }}>{p.descricao}</Typography>
                                        </Box>
                                        <Switch 
                                            color="warning"
                                            checked={!!nivelSelecionado.permissoes[p.id]} 
                                            onChange={e => handleTogglePermissao(p.id, e.target.checked)}
                                            disabled={nivelSelecionado.tipo === 'PADRÃO'}
                                        />
                                        </Paper>
                                    </Grid>
                                    ))}
                                </Grid>
                                </Box>
                            ))}
                            </Box>
                        </CardContent>
                        </Card>
                    ) : (
                        <Box sx={{ p: 10, textAlign: 'center', bgcolor: 'gray.50', borderRadius: 6, border: '2px dashed #e5e7eb' }}>
                            <ShieldCheck size={48} className="mx-auto mb-4 text-gray-300" />
                            <Typography sx={{ fontWeight: 800, color: 'gray.400' }}>Selecione um perfil para ver as permissões</Typography>
                        </Box>
                    )}
                    </Grid>
                </Grid>

                <Dialog open={dialogNovoPerfilAberto} onClose={() => setDialogNovoPerfilAberto(false)} PaperProps={{ sx: { borderRadius: 6, p: 1 } }}>
                    <DialogTitle sx={{ fontWeight: 950 }}>Criar Novo Perfil de Acesso</DialogTitle>
                    <DialogContent>
                    <TextField fullWidth label="Nome do Perfil" margin="normal" value={novoPerfilNome} onChange={e => setNovoPerfilNome(e.target.value)} placeholder="Ex: Supervisor de Campo" sx={{ mt: 1 }} />
                    <TextField fullWidth label="Descrição" margin="normal" value={novoPerfilDesc} onChange={e => setNovoPerfilDesc(e.target.value)} multiline rows={2} />
                    
                    <Typography sx={{ fontWeight: 900, fontSize: '0.65rem', color: '#9ca3af', textTransform: 'uppercase', mt: 3, mb: 1 }}>Basear-se em (Duplicar)</Typography>
                    <TextField select fullWidth value={duplicarDeId} onChange={e => setDuplicarDeId(e.target.value)} SelectProps={{ native: true }}>
                        <option value="">Nível Vazio</option>
                        {niveis.map(n => <option key={n.id} value={n.id}>{n.nome} ({n.tipo})</option>)}
                    </TextField>
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setDialogNovoPerfilAberto(false)} sx={{ fontWeight: 900 }}>Cancelar</Button>
                    <Button variant="contained" color="warning" onClick={handleCriarPerfil} sx={{ fontWeight: 900, borderRadius: 3, px: 4 }}>Criar Perfil</Button>
                    </DialogActions>
                </Dialog>
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
                       </h4>
                       <div className="flex space-x-1">
                          <button onClick={() => setModalState({ open: true, type: activeTab === 'tasks_op' ? 'category_op' : 'category_month', editingItem: cat })} className="p-2 text-gray-400 hover:text-orange-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDeletePermanent(cat.id, activeTab === 'tasks_op' ? 'category_op' : 'category_month', cat)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                       </div>
                    </div>
                    <div className="space-y-2">
                       {filteredTasks.filter(t => (t.visivel !== false) && t.categoriaId === cat.id).map(task => (
                         <div key={task.id} className="bg-white p-3 rounded-xl border border-gray-100 flex justify-between items-center group shadow-sm transition-all hover:border-orange-100">
                            <span className="text-xs font-bold text-gray-600 truncate">{task.nome}</span>
                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button onClick={() => setModalState({ open: true, type: 'task_modal', editingItem: task })} className="p-1.5 text-gray-400 hover:text-orange-600 bg-gray-50 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
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
          availableLevels={niveis}
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

interface UsuariosTableProps {
  users: any[];
  bases: Base[];
  onEdit: (user: any) => void;
  onDelete: (userId: string) => void;
}

const formatJornada = (val: number) => minutesToHhmmss((val || 6) * 60);

const UsersTable: React.FC<UsuariosTableProps> = ({ users, bases, onEdit, onDelete }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    return users.filter(user => 
      user.nome.toLowerCase().includes(lowerSearch) ||
      user.email.toLowerCase().includes(lowerSearch)
    );
  }, [users, searchTerm]);

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Search className="text-gray-400 w-5 h-5 mr-3" />
        <TextField 
          fullWidth 
          variant="standard" 
          placeholder="Pesquisar usuários..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: '1rem', boxShadow: 'none', border: '1px solid #f3f4f6', overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f9fafb' }}>
              <TableCell sx={{ fontWeight: 900 }}>NOME</TableCell>
              <TableCell sx={{ fontWeight: 900 }}>E-MAIL</TableCell>
              <TableCell sx={{ fontWeight: 900 }}>ACESSO</TableCell>
              <TableCell sx={{ fontWeight: 900 }}>UNIDADES</TableCell>
              <TableCell sx={{ fontWeight: 900 }}>STATUS</TableCell>
              <TableCell align="right" sx={{ fontWeight: 900 }}>AÇÕES</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell sx={{ fontWeight: 800 }}>{user.nome}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip label={user.permissao} size="small" sx={{ fontWeight: 900, fontSize: '0.6rem' }} />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {user.bases.map((bId: string) => (
                        <Chip key={bId} label={bases.find(b => b.id === bId)?.sigla || bId} size="small" sx={{ height: 20, fontSize: '0.6rem' }} />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={user.status} color={user.status === 'Ativo' ? 'success' : 'default'} size="small" sx={{ fontWeight: 900, fontSize: '0.6rem' }} />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => onEdit(user)}><Edit2 size={16}/></IconButton>
                    <IconButton size="small" color="error" onClick={() => onDelete(user.id)}><Trash2 size={16}/></IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredUsers.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
      />
    </Box>
  );
};

export default ManagementPage;
