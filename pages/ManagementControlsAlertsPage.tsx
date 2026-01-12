import React, { useState, useMemo, useEffect } from 'react';
import { 
  Box, Truck, AlertOctagon, FlaskConical, Plus, Trash2, Edit2, Globe, MapPin, 
  Search, Info, AlertCircle, CheckCircle, ChevronRight, Settings, Bell, Palette, Layers, RotateCcw, Archive, ShieldCheck
} from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { ShelfLifeItem, DefaultLocationItem, DefaultTransitItem, DefaultCriticalItem, CustomControlType, CustomControlItem, Control } from '../types';
import { CustomControlTypeModal, ControlItemSettingsModal, ConfirmModal, ControlItemModal } from '../modals';

type ControlTab = 'shelf' | 'loc' | 'trans' | 'crit' | string;

const ManagementControlsAlertsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ControlTab>('shelf');
  const [contextFilter, setContextFilter] = useState<'global' | string>('global');
  const [showArchived, setShowArchived] = useState(false);
  
  const { 
    bases, defaultShelfLifes, defaultLocations, defaultTransits, defaultCriticals,
    customControlTypes, customControlItems, controls: allControls,
    saveDefaultItem, deleteDefaultItem, saveCustomControlType, deleteCustomControlType,
    refreshData, getControlesCombinados
  } = useStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isEditingGlobalConfig, setIsEditingGlobalConfig] = useState(false);

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
    setTimeout(() => setSnackbar(p => ({ ...p, open: false })), 3000);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const tabToControlType: Record<string, string> = {
    'shelf': 'shelf_life',
    'loc': 'locations',
    'trans': 'transito',
    'crit': 'itens_criticos'
  };

  const currentItems = useMemo(() => {
    let list: any[] = [];
    if (activeTab === 'shelf') list = defaultShelfLifes;
    else if (activeTab === 'loc') list = defaultLocations;
    else if (activeTab === 'trans') list = defaultTransits;
    else if (activeTab === 'crit') list = defaultCriticals;
    else list = customControlItems.filter(i => i.tipoId === activeTab);

    return list.filter(item => {
      const matchContext = contextFilter === 'global' ? item.baseId === null : item.baseId === contextFilter;
      const matchStatus = showArchived ? true : (item.visivel !== false);
      return matchContext && matchStatus;
    });
  }, [activeTab, contextFilter, showArchived, defaultShelfLifes, defaultLocations, defaultTransits, defaultCriticals, customControlItems]);

  const handleSaveItem = async (data: any) => {
    try {
      const dataWithContext = {
        ...data,
        baseId: contextFilter === 'global' ? null : contextFilter
      };
      
      await saveDefaultItem(activeTab, dataWithContext);
      showSnackbar(`Item ${editingItem?.id ? 'atualizado' : 'criado'} com sucesso!`);
      setIsModalOpen(false);
      setEditingItem(null);
      await refreshData();
    } catch (e) {
      showSnackbar("Erro ao salvar o item", "error");
    }
  };

  const handleOpenGlobalConfig = () => {
    const controlType = tabToControlType[activeTab] || activeTab;
    const baseId = contextFilter === 'global' ? null : contextFilter;
    let config = allControls.find(c => c.tipo === controlType && c.baseId === baseId);
    
    if (!config) {
      config = {
        id: `global-${controlType}-${baseId || 'root'}`,
        baseId: baseId,
        nome: `Configuração Padrão ${activeTab.toUpperCase()}`,
        tipo: controlType,
        descricao: 'Regras de alerta padrão da categoria',
        unidade: 'unidade',
        status: 'Ativo',
        alertaConfig: { verde: 0, amarelo: 0, vermelho: 0, permitirPopupVerde: false, permitirPopupAmarelo: true, permitirPopupVermelho: true, mensagemVerde: '', mensagemAmarelo: '', mensagemVermelho: '' }
      } as Control;
    }

    setEditingItem(config);
    setIsEditingGlobalConfig(true);
    setIsSettingsModalOpen(true);
  };

  const handleSaveGlobalConfig = async (updatedConfig: any) => {
    try {
      const { controlService } = await import('../services');
      const existing = allControls.find(c => c.id === updatedConfig.id);
      if (existing) {
        await controlService.update(updatedConfig.id, updatedConfig);
      } else {
        await controlService.create(updatedConfig);
      }

      showSnackbar("Regras padrão da categoria atualizadas!");
      setIsSettingsModalOpen(false);
      setIsEditingGlobalConfig(false);
      await refreshData();
    } catch (e) {
      showSnackbar("Erro ao salvar regras padrão", "error");
    }
  };

  const handleArchive = (item: any) => {
    const label = item.partNumber || item.nomeLocation || item.nomeTransito || "este item";
    setConfirmModal({
      open: true,
      title: 'Arquivar Item',
      message: `Deseja ocultar/arquivar o item "${label}"?\nEle desaparecerá da Passagem de Turno, mas continuará disponível para reativação no painel de gerenciamento.`,
      type: 'warning',
      onConfirm: async () => {
        try {
          await saveDefaultItem(activeTab, { ...item, visivel: false });
          showSnackbar("Item ocultado com sucesso");
          await refreshData();
        } catch (e) {
          showSnackbar("Erro ao ocultar item", "error");
        }
      }
    });
  };

  const handleReactivate = async (item: any) => {
    try {
      await saveDefaultItem(activeTab, { ...item, visivel: true });
      showSnackbar("Item reativado com sucesso!");
      await refreshData();
    } catch (e) {
      showSnackbar("Erro ao reativar item", "error");
    }
  };

  const currentCustomType = useMemo(() => customControlTypes.find(t => t.id === activeTab), [activeTab, customControlTypes]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {snackbar.open && (
        <div className={`fixed top-6 right-6 z-[200] p-4 rounded-2xl shadow-2xl flex items-center space-x-3 border ${
          snackbar.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {snackbar.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-bold text-sm">{snackbar.message}</span>
        </div>
      )}

      <header className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="p-4 bg-orange-50 rounded-2xl">
            <Settings className="w-8 h-8 text-orange-600" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tight">Controles e Alertas</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Gerenciamento de itens e regras customizadas.</p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <button onClick={() => setIsTypeModalOpen(true)} className="flex items-center space-x-2 bg-gray-800 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all">
             <Layers className="w-4 h-4" /> <span>+ Novo Tipo de Controle</span>
          </button>
          <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-2xl">
            <button onClick={() => setContextFilter('global')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${contextFilter === 'global' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
              <Globe className="w-4 h-4 inline mr-2" /> Global
            </button>
            <select 
              value={contextFilter === 'global' ? '' : contextFilter} 
              onChange={e => setContextFilter(e.target.value || 'global')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase outline-none bg-transparent transition-all ${contextFilter !== 'global' ? 'text-orange-600 bg-white shadow-sm' : 'text-gray-400'}`}
            >
              <option value="">Base...</option>
              {bases.map(b => <option key={b.id} value={b.id}>{b.sigla}</option>)}
            </select>
          </div>
        </div>
      </header>

      <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
        <div className="flex bg-gray-50/50 border-b border-gray-100 overflow-x-auto scrollbar-hide">
          <TabBtn active={activeTab === 'shelf'} onClick={() => setActiveTab('shelf')} icon={<FlaskConical className="w-4 h-4" />} label="Shelf Life" />
          <TabBtn active={activeTab === 'loc'} onClick={() => setActiveTab('loc')} icon={<Box className="w-4 h-4" />} label="Locations" />
          <TabBtn active={activeTab === 'trans'} onClick={() => setActiveTab('trans')} icon={<Truck className="w-4 h-4" />} label="Trânsito" />
          <TabBtn active={activeTab === 'crit'} onClick={() => setActiveTab('crit')} icon={<AlertOctagon className="w-4 h-4" />} label="Saldo" />
          {customControlTypes.map(type => (
            <TabBtn key={type.id} active={activeTab === type.id} onClick={() => setActiveTab(type.id)} icon={<Settings className="w-4 h-4" />} label={type.nome} />
          ))}
        </div>

        <div className="p-8 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
               <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">{currentCustomType?.nome || activeTab.toUpperCase()} Items</h2>
               <label className="flex items-center space-x-2 cursor-pointer bg-gray-50 px-3 py-1 rounded-full group">
                  <input type="checkbox" className="w-3 h-3 accent-orange-500" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} />
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest group-hover:text-orange-600 transition-colors">Exibir Arquivados</span>
               </label>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={handleOpenGlobalConfig}
                className="bg-gray-100 text-gray-600 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-orange-50 hover:text-orange-600 transition-all flex items-center space-x-2 border border-transparent hover:border-orange-100 shadow-sm"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Regras Padrão da Categoria</span>
              </button>
              <button 
                onClick={() => { setEditingItem(null); setIsEditingGlobalConfig(false); setIsModalOpen(true); }}
                className="bg-orange-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-orange-100 hover:bg-orange-700 hover:scale-105 transition-all flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Item</span>
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-gray-100">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-5">Descrição do Item</th>
                  <th className="px-6 py-5">Contexto</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {currentItems.map(item => (
                  <tr key={item.id} className={`group hover:bg-orange-50/10 transition-all ${item.visivel === false ? 'bg-gray-100 opacity-60 border-dashed' : ''}`}>
                    <td className="px-6 py-5">
                      <div className="flex items-center space-x-3">
                        <div className={`p-3 bg-gray-50 rounded-xl group-hover:bg-white text-gray-400 group-hover:text-orange-500 transition-all shadow-sm group-hover:shadow-md ${item.visivel === false ? 'grayscale opacity-50' : ''}`}>
                          {activeTab === 'shelf' && <FlaskConical className="w-5 h-5" />}
                          {activeTab === 'loc' && <Box className="w-5 h-5" />}
                          {activeTab === 'trans' && <Truck className="w-5 h-5" />}
                          {activeTab === 'crit' && <AlertOctagon className="w-5 h-5" />}
                          {currentCustomType && <Settings className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className={`font-black uppercase tracking-tight ${item.visivel === false ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                            {activeTab === 'shelf' || activeTab === 'crit' ? item.partNumber : (activeTab === 'loc' ? item.nomeLocation : (activeTab === 'trans' ? item.nomeTransito : Object.values(item.valores || {})[0] || 'Item Customizado'))}
                          </p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">
                            {activeTab === 'shelf' ? `Venc: ${item.dataVencimento}` : (activeTab === 'trans' ? `TAT: ${item.diasPadrao} d` : 'Configurado')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                       {item.baseId ? (
                         <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                           <MapPin className="w-3 h-3 inline mr-1" />{bases.find(b => b.id === item.baseId)?.sigla}
                         </span>
                       ) : (
                         <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-lg">
                           <Globe className="w-3 h-3 inline mr-1" />Global
                         </span>
                       )}
                    </td>
                    <td className="px-6 py-5">
                       {item.visivel !== false ? (
                         <span className="px-2 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase rounded-md border border-green-100">Visível</span>
                       ) : (
                         <span className="px-2 py-1 bg-gray-200 text-gray-500 text-[10px] font-black uppercase rounded-md border border-gray-300">Arquivado</span>
                       )}
                    </td>
                    <td className="px-6 py-5 text-right space-x-1">
                       {item.visivel !== false ? (
                         <>
                            <button onClick={() => { setEditingItem(item); setIsEditingGlobalConfig(false); setIsModalOpen(true); }} className="p-2 text-gray-300 hover:text-orange-600 bg-gray-50 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-orange-100" title="Editar"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => { setEditingItem(item); setIsEditingGlobalConfig(false); setIsSettingsModalOpen(true); }} className="p-2 text-gray-300 hover:text-orange-600 bg-gray-50 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-orange-100" title="Cores e Pop-ups Personalizados"><Palette className="w-4 h-4" /></button>
                            <button onClick={() => handleArchive(item)} className="p-2 text-gray-300 hover:text-amber-600 bg-gray-50 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-amber-100" title="Arquivar"><Archive className="w-4 h-4" /></button>
                         </>
                       ) : (
                         <button onClick={() => handleReactivate(item)} className="p-2 text-orange-600 bg-orange-50 hover:bg-white rounded-lg transition-all shadow-sm border border-orange-100" title="Desarquivar"><RotateCcw className="w-4 h-4" /></button>
                       )}
                    </td>
                  </tr>
                ))}
                {currentItems.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-20 text-center text-gray-300 font-bold uppercase text-xs tracking-[0.3em]">
                       <Info className="w-12 h-12 mx-auto mb-4 opacity-10" />
                       Nenhum item encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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

      <CustomControlTypeModal 
        isOpen={isTypeModalOpen} 
        onClose={() => setIsTypeModalOpen(false)} 
        onSave={async (data) => {
          await saveCustomControlType(data);
          showSnackbar("Novo tipo criado!");
          setIsTypeModalOpen(false);
        }}
        title="Novo Tipo"
      />

      <ControlItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveItem}
        title={editingItem ? "Editar Item" : "Novo Item"}
        initialData={editingItem}
        activeTab={activeTab}
        customControlTypes={customControlTypes}
      />

      <ControlItemSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => { setIsSettingsModalOpen(false); setIsEditingGlobalConfig(false); }}
        item={editingItem}
        onSave={isEditingGlobalConfig ? handleSaveGlobalConfig : async (updatedItem) => {
          await saveDefaultItem(activeTab, updatedItem);
          showSnackbar("Configurações salvas!");
          setIsSettingsModalOpen(false);
          await refreshData();
        }}
      />
    </div>
  );
};

const TabBtn: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex items-center space-x-3 px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] border-b-4 transition-all whitespace-nowrap ${
    active ? 'border-orange-600 text-orange-600 bg-white' : 'border-transparent text-gray-400 hover:text-gray-600'
  }`}>
    {icon} <span>{label}</span>
  </button>
);

export default ManagementControlsAlertsPage;