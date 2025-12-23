
import React, { useState, useMemo, useEffect } from 'react';
import { 
  CheckCircle, Trash2, Info, Users, Clock, AlertTriangle, ClipboardList,
  X, TrendingUp, Timer, MapPin, Box, Truck, FlaskConical, AlertOctagon, Plane, Settings,
  Calendar, UserCheck, Activity, BarChart3, MessageSquare
} from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { 
  MeasureType, OutraAtividade, Control, 
  LocationRow, TransitRow, ShelfLifeRow, CriticalRow, AlertConfig, ManagedItem,
  User, Task, Category, ConditionConfig
} from '../types';
import { DatePickerField, TimeInput, hhmmssToMinutes, minutesToHhmmss, ConfirmModal } from '../modals';

// Utilitários de Data
const parseDate = (str: any): Date | null => {
  if (!str || typeof str !== 'string') return null;
  const parts = str.split('/');
  if (parts.length !== 3) return null;
  const d = parseInt(parts[0]);
  const m = parseInt(parts[1]) - 1;
  const y = parseInt(parts[2]);
  const date = new Date(y, m, d);
  return isNaN(date.getTime()) ? null : date;
};

const getDaysDiff = (dateStr: any): number => {
  const date = parseDate(dateStr);
  if (!date) return 0;
  const today = new Date();
  today.setHours(0,0,0,0);
  date.setHours(0,0,0,0);
  return Math.abs(Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)));
};

const getDaysRemaining = (dateStr: any): number => {
  const date = parseDate(dateStr);
  if (!date) return 0;
  const today = new Date();
  today.setHours(0,0,0,0);
  date.setHours(0,0,0,0);
  return Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const atendeCriterioVerde = (verde: any, dias: number): boolean => {
  if (!verde || verde.habilitado === false) return false;
  const valor = Number(verde.valor);
  const op = verde.operador;
  if (op === '<=') return dias <= valor;
  if (op === '>=') return dias >= valor;
  if (op === '=') return dias === valor;
  if (op === '!=') return dias !== valor;
  if (op === '<') return dias < valor;
  if (op === '>') return dias > valor;
  return false;
};

const atendeCriterioAmarelo = (amarelo: any, dias: number): boolean => {
  if (!amarelo || amarelo.habilitado === false) return false;
  const valor = Number(amarelo.valor);
  const op = amarelo.operador;
  if (op === 'entre') {
    const valorMax = Number(amarelo.valorMax);
    return dias >= valor && dias <= valorMax;
  }
  if (op === '<=') return dias <= valor;
  if (op === '>=') return dias >= valor;
  if (op === '=') return dias === valor;
  if (op === '!=') return dias !== valor;
  return false;
};

const atendeCriterioVermelho = (vermelho: any, dias: number): boolean => {
  if (!vermelho || vermelho.habilitado === false) return false;
  const valor = Number(vermelho.valor);
  const op = vermelho.operador;
  if (op === '!=') return dias !== valor;
  if (op === '>=') return dias >= valor;
  if (op === '>') return dias > valor;
  if (op === '=') return dias === valor;
  if (op === '<=') return dias <= valor;
  if (op === '<') return dias < valor;
  return false;
};

const ShiftHandoverPage: React.FC<{baseId?: string}> = ({ baseId }) => {
  const { 
    getControlesCombinados, getDefaultLocations, getDefaultTransits, getDefaultCriticals, getDefaultShelfLifes,
    bases, users, tasks: allTasks, categories: allCats, controls: allControls, 
    initialized, refreshData 
  } = useStore();
  
  const currentBase = useMemo(() => bases.find(b => b.id === baseId), [bases, baseId]);
  const baseUsers = useMemo(() => users.filter(u => u.bases.includes(baseId || '') && u.status === 'Ativo'), [users, baseId]);
  
  useEffect(() => {
    refreshData(false);
  }, [baseId, refreshData]);

  const activeControls = useMemo(() => getControlesCombinados(baseId || ''), [getControlesCombinados, baseId, allControls]);

  // Estados da Passagem de Serviço
  const [status, setStatus] = useState<'Rascunho' | 'Finalizado'>('Rascunho');
  const [dataOperacional, setDataOperacional] = useState(new Date().toLocaleDateString('pt-BR'));
  const [turnoAtivo, setTurnoAtivo] = useState('');
  const [colaboradoresIds, setColaboradoresIds] = useState<(string | null)[]>([null, null, null, null, null, null]);
  const [tarefasValores, setTarefasValores] = useState<Record<string, string>>({}); 
  const [obs, setObs] = useState('');

  // Estados dos Painéis de Controle
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [transit, setTransit] = useState<TransitRow[]>([]);
  const [shelfLife, setShelfLife] = useState<ShelfLifeRow[]>([]);
  const [critical, setCritical] = useState<CriticalRow[]>([]);
  
  const [activeAlert, setActiveAlert] = useState<{titulo: string, mensagem: string, color: string} | null>(null);
  
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

  // Sincronização de Itens Padrão
  useEffect(() => {
    if (!initialized || !baseId) return;

    setLocations(prev => {
      const activeStoreItems = getDefaultLocations(baseId);
      const activeStoreIds = activeStoreItems.map(i => i.id);
      const filtered = prev.filter(p => !p.isPadrao || activeStoreIds.includes(p.id));
      const toAdd = activeStoreItems.filter(i => !prev.some(p => p.id === i.id));
      if (toAdd.length === 0 && filtered.length === prev.length) return prev;
      return [...filtered, ...toAdd.map(i => ({ id: i.id, nomeLocation: i.nomeLocation, quantidade: 0, dataMaisAntigo: '', isPadrao: true, config: i }))];
    });

    setTransit(prev => {
      const activeStoreItems = getDefaultTransits(baseId);
      const activeStoreIds = activeStoreItems.map(i => i.id);
      const filtered = prev.filter(p => !p.isPadrao || activeStoreIds.includes(p.id));
      const toAdd = activeStoreItems.filter(i => !prev.some(p => p.id === i.id));
      if (toAdd.length === 0 && filtered.length === prev.length) return prev;
      return [...filtered, ...toAdd.map(i => ({ id: i.id, nomeTransito: i.nomeTransito, diasPadrao: i.diasPadrao, quantidade: 0, dataSaida: '', isPadrao: true, config: i }))];
    });

    setCritical(prev => {
      const activeStoreItems = getDefaultCriticals(baseId);
      const activeStoreIds = activeStoreItems.map(i => i.id);
      const filtered = prev.filter(p => !p.isPadrao || activeStoreIds.includes(p.id));
      const toAdd = activeStoreItems.filter(i => !prev.some(p => p.id === i.id));
      if (toAdd.length === 0 && filtered.length === prev.length) return prev;
      return [...filtered, ...toAdd.map(i => ({ id: i.id, partNumber: i.partNumber, lote: '', saldoSistema: 0, saldoFisico: 0, isPadrao: true, config: i }))];
    });

    setShelfLife(prev => {
      const activeStoreItems = getDefaultShelfLifes(baseId);
      const activeStoreIds = activeStoreItems.map(i => i.id);
      const filtered = prev.filter(p => !p.isPadrao || activeStoreIds.includes(p.id));
      const toAdd = activeStoreItems.filter(i => !prev.some(p => p.id === i.id));
      let newList = [...filtered, ...toAdd.map(i => ({ id: i.id, partNumber: i.partNumber, lote: i.lote || '', dataVencimento: i.dataVencimento || '', isPadrao: true, config: i }))];
      while (newList.length < 3) {
        newList.push({ id: `manual-${Date.now()}-${newList.length}`, partNumber: '', lote: '', dataVencimento: '', isPadrao: false });
      }
      return newList;
    });
  }, [baseId, initialized, getDefaultLocations, getDefaultTransits, getDefaultCriticals, getDefaultShelfLifes]);

  const opCategories = useMemo(() => {
    return allCats.filter(c => c.tipo === 'operacional' && c.status === 'Ativa' && (c.visivel !== false) && (!c.baseId || c.baseId === baseId)).sort((a,b) => a.ordem - b.ordem);
  }, [allCats, baseId]);

  const opTasks = useMemo(() => {
    return allTasks.filter(t => t.status === 'Ativa' && (t.visivel !== false) && (!t.baseId || t.baseId === baseId));
  }, [allTasks, baseId]);

  const { horasDisponiveis, horasProduzidas, performance } = useMemo(() => {
    const disp = colaboradoresIds.reduce((acc: number, id: string | null) => {
      if (!id) return acc;
      const user = baseUsers.find((u: User) => u.id === id);
      return acc + (user?.jornadaPadrao || 0);
    }, 0);
    let prod = 0;
    Object.entries(tarefasValores).forEach(([taskId, val]: [string, string]) => {
      const task = opTasks.find(t => t.id === taskId);
      if (!task) return;
      
      if (task.tipoMedida === MeasureType.TEMPO) {
        prod += hhmmssToMinutes(val) / 60;
      } else {
        prod += (parseFloat(val) || 0) * task.fatorMultiplicador / 60;
      }
    });
    return { horasDisponiveis: disp, horasProduzidas: prod, performance: disp > 0 ? (prod / disp) * 100 : 0 };
  }, [colaboradoresIds, tarefasValores, baseUsers, opTasks]);

  const performanceColor = useMemo(() => {
    if (!currentBase) return 'text-orange-600';
    if (performance >= (currentBase.metaVerde || 80)) return 'text-green-600';
    if (performance >= (currentBase.metaAmarelo || 50)) return 'text-yellow-600';
    return 'text-red-600';
  }, [performance, currentBase]);

  const performanceBg = useMemo(() => {
    if (!currentBase) return 'bg-orange-500';
    if (performance >= (currentBase.metaVerde || 80)) return 'bg-green-500';
    if (performance >= (currentBase.metaAmarelo || 50)) return 'bg-yellow-500';
    return 'bg-red-500';
  }, [performance, currentBase]);

  const evaluateAlert = (item: any, value: any, controlType: string) => {
    if (value === undefined || value === null || value === '') return;
    const categoryConfig = activeControls.find(c => c.tipo === controlType);
    const itemConfig = item.config;
    const cores = (itemConfig?.cores?.vermelho) ? itemConfig.cores : categoryConfig?.cores;
    const popups = (itemConfig?.popups?.vermelho) ? itemConfig.popups : categoryConfig?.popups;
    if (!cores || !popups) return;
    const val = Number(value);
    setTimeout(() => {
        if (atendeCriterioVerde(cores.verde, val)) {
           if (popups.verde.habilitado !== false) setActiveAlert({ titulo: popups.verde.titulo || 'Tudo OK', mensagem: popups.verde.mensagem.replace('X', String(val)), color: 'bg-green-600' });
        } else if (atendeCriterioAmarelo(cores.amarelo, val)) {
           if (popups.amarelo.habilitado !== false) setActiveAlert({ titulo: popups.amarelo.titulo || 'Atenção', mensagem: popups.amarelo.mensagem.replace('X', String(val)), color: 'bg-yellow-600' });
        } else if (atendeCriterioVermelho(cores.vermelho, val)) {
           if (popups.vermelho.habilitado !== false) setActiveAlert({ titulo: popups.vermelho.titulo || 'Critical', mensagem: popups.vermelho.mensagem.replace('X', String(val)), color: 'bg-red-600' });
        }
    }, 150);
  };

  const getRowStatusClasses = (item: any, val: number, controlType: string) => {
    if (!item.isPadrao && !item.partNumber && !item.dataVencimento && !item.nomeLocation && !item.nomeTransito) return '';
    if (val === undefined || val === null || isNaN(val)) return '';
    const categoryConfig = activeControls.find(c => c.tipo === controlType);
    const itemConfig = item.config;
    const cores = (itemConfig?.cores?.vermelho) ? itemConfig.cores : categoryConfig?.cores;
    if (!cores) return '';

    if (atendeCriterioVermelho(cores.vermelho, val)) return 'bg-red-100 text-red-950 border-red-200 border-l-4 border-l-red-600 font-bold';
    if (atendeCriterioAmarelo(cores.amarelo, val)) return 'bg-yellow-100 text-yellow-950 border-yellow-200 border-l-4 border-l-yellow-500 font-bold';
    if (atendeCriterioVerde(cores.verde, val)) return 'bg-green-100 text-green-950 border-green-200 border-l-4 border-l-green-600 font-bold';
    return '';
  };

  const updateRow = (list: any[], setList: Function, id: string, field: string, value: any) => {
    setList(list.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const isViewOnly = status === 'Finalizado';

  return (
    <div className="max-w-full mx-auto space-y-8 animate-in fade-in relative px-4 md:px-8">
      {activeAlert && (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${activeAlert.color} text-white p-8 rounded-[2.5rem] shadow-2xl max-sm w-full animate-in zoom-in-95 border-4 border-white/20 text-center`}>
            <div className="flex justify-center mb-4"><AlertTriangle className="w-16 h-16 animate-pulse" /></div>
            <h4 className="text-2xl font-black uppercase tracking-tight mb-2">{activeAlert.titulo}</h4>
            <p className="font-bold opacity-90 leading-relaxed">{activeAlert.mensagem}</p>
            <button onClick={() => setActiveAlert(null)} className="mt-8 w-full bg-white text-gray-800 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-gray-50">Entendido</button>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmModal.open} onClose={() => setConfirmModal({ ...confirmModal, open: false })}
        onConfirm={confirmModal.onConfirm} title={confirmModal.title} message={confirmModal.message} type={confirmModal.type}
      />

      <header className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
         <div className="flex items-center space-x-6">
            <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 shadow-inner"><Plane className="w-8 h-8" /></div>
            <div>
               <h2 className="text-3xl font-black text-gray-800 tracking-tighter">Passagem de Serviço</h2>
               <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">{currentBase?.nome} - {dataOperacional}</p>
            </div>
         </div>
         <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${status === 'Rascunho' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
            Status: {status}
         </div>
      </header>

      {/* Main Grid: Sidebar (Left) and Content (Right) */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Lado Esquerdo: Produção e Observações (Sticky) */}
        <aside className="w-full lg:w-1/4 sticky top-6 z-20 self-start space-y-4">
           {/* Bloco de Produção (KPIs) - REDUZIDO PARA ~60% DO TAMANHO ORIGINAL */}
           <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 space-y-4">
              <h3 className="font-black text-gray-800 uppercase tracking-widest flex items-center space-x-2 text-[11px]">
                 <BarChart3 className="w-3.5 h-3.5 text-orange-500" /> 
                 <span>Produção do Turno</span>
              </h3>
              <div className="grid grid-cols-1 gap-2.5">
                 <KpiItem label="Horas Disponíveis" value={minutesToHhmmss(horasDisponiveis * 60)} icon={<Clock className="w-3.5 h-3.5" />} />
                 <KpiItem label="Horas Produzidas" value={minutesToHhmmss(horasProduzidas * 60)} icon={<Activity className="w-3.5 h-3.5" />} />
              </div>
              <div className="space-y-2 pt-1">
                 <div className="flex justify-between items-center px-1">
                    <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Performance</span>
                    <span className={`text-lg font-black transition-colors duration-500 ${performanceColor}`}>{performance.toFixed(1)}%</span>
                 </div>
                 <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-50 shadow-inner">
                    <div 
                       className={`h-full transition-all duration-1000 shadow-md ${performanceBg}`} 
                       style={{ width: `${Math.min(performance, 100)}%` }}
                    />
                 </div>
              </div>
           </div>

           {/* Bloco de Observações - MAIS VISÍVEL */}
           <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-4">
              <h3 className="font-black text-gray-800 uppercase tracking-widest flex items-center space-x-2 text-sm">
                 <MessageSquare className="w-4 h-4 text-orange-500" /> 
                 <span>Observações</span>
              </h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Anotações fixas do turno</p>
              <textarea 
                disabled={isViewOnly} 
                value={obs} 
                onChange={e => setObs(e.target.value)} 
                placeholder="Intercorrências, pendências ou informações relevantes para o próximo turno..." 
                className="w-full min-h-[350px] p-6 bg-gray-50 rounded-[2rem] border border-transparent focus:bg-white focus:border-orange-100 outline-none font-medium leading-relaxed text-sm resize-none" 
              />
              <div className="pt-2 border-t border-gray-50">
                <div className="flex items-center space-x-2 text-[10px] font-black text-orange-600 uppercase">
                  <div className="w-2 h-2 rounded-full bg-orange-600 animate-pulse" />
                  <span>Acompanhamento Ativo</span>
                </div>
              </div>
           </div>
        </aside>

        {/* Lado Direito: Fluxo de Preenchimento */}
        <div className="w-full lg:w-3/4 space-y-12">
           
           {/* 1. Configuração do Turno */}
           <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                <DatePickerField label="Data Operacional" value={dataOperacional} onChange={setDataOperacional} disabled={isViewOnly} />
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Turno Ativo</label>
                    <select disabled={isViewOnly} value={turnoAtivo} onChange={e => setTurnoAtivo(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-orange-100 transition-all">
                       <option value="">Selecionar Turno...</option>
                       {currentBase?.turnos.map(t => <option key={t.id} value={t.id}>Turno {t.numero} ({t.horaInicio} - {t.horaFim})</option>)}
                    </select>
                </div>
              </div>
           </section>

           {/* 2. Equipe no Turno */}
           <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-8">
              <h3 className="font-black text-gray-800 uppercase tracking-widest flex items-center space-x-2 text-sm"><Users className="w-4 h-4 text-orange-500" /> <span>Equipe no Turno</span></h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {colaboradoresIds.map((colId, idx) => (
                    <div key={idx} className="relative">
                       <div className="absolute -top-2 -left-2 w-6 h-6 bg-orange-600 text-white rounded-lg flex items-center justify-center text-[10px] font-black z-10">{idx + 1}</div>
                       <select disabled={isViewOnly} value={colId || ''} onChange={e => { const newIds = [...colaboradoresIds]; newIds[idx] = e.target.value || null; setColaboradoresIds(newIds); }}
                         className={`w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none transition-all text-xs ${colId ? 'bg-white shadow-sm border-orange-100' : ''}`}
                       >
                          <option value="">Selecione...</option>
                          {baseUsers.map(u => {
                             const isAlreadySelected = colaboradoresIds.some((selectedId, otherIdx) => otherIdx !== idx && selectedId === u.id);
                             return (
                                <option key={u.id} value={u.id} disabled={isAlreadySelected}>
                                   {u.nome} | {u.jornadaPadrao}h {isAlreadySelected ? '(Selecionado)' : ''}
                                </option>
                             );
                          })}
                       </select>
                    </div>
                 ))}
              </div>
           </section>

           {/* 3. Controles e Alertas (Locations, Trânsito, etc.) */}
           <section className="space-y-12">
              <h3 className="font-black text-gray-800 uppercase tracking-widest flex items-center space-x-2 text-sm">
                 <ShieldCheck className="w-4 h-4 text-orange-500" />
                 <span>Controles e Alertas de Estoque</span>
              </h3>
              
              <div className="grid grid-cols-1 gap-12">
                <PanelContainer title="Locations" icon={<Box className="w-4 h-4 text-orange-500" />} onAdd={() => setLocations([...locations, { id: `manual-${Date.now()}`, nomeLocation: '', quantidade: 0, dataMaisAntigo: '' }])} isViewOnly={isViewOnly}>
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest"><tr><th className="px-8 py-4">Location</th><th className="px-8 py-4">Quant.</th><th className="px-8 py-4">Dias (Auto)</th></tr></thead>
                    <tbody>
                      {locations.map(row => {
                        const days = row.dataMaisAntigo ? getDaysDiff(row.dataMaisAntigo) : 0;
                        const rowStyle = getRowStatusClasses(row, days, 'locations');
                        return (
                          <tr key={row.id} className={`border-t border-gray-50 transition-colors ${rowStyle || 'hover:bg-gray-50/50'}`}>
                            <td className="px-8 py-4 font-bold"><input disabled={isViewOnly || row.isPadrao} className="bg-transparent w-full outline-none uppercase" value={row.nomeLocation} onChange={e => updateRow(locations, setLocations, row.id, 'nomeLocation', e.target.value)} /></td>
                            <td className="px-8 py-4"><input type="number" disabled={isViewOnly} className={`w-20 p-2 rounded-xl font-black text-center ${rowStyle ? 'bg-white/40' : 'bg-gray-50'}`} value={row.quantidade} onChange={e => updateRow(locations, setLocations, row.id, 'quantidade', e.target.value)} /></td>
                            <td className="px-8 py-4 flex items-center space-x-4">
                              <DatePickerField value={row.dataMaisAntigo} onChange={v => { updateRow(locations, setLocations, row.id, 'dataMaisAntigo', v); evaluateAlert(row, getDaysDiff(v), 'locations'); }} />
                              {row.dataMaisAntigo && <span className="text-xs font-black">{days}d</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </PanelContainer>

                <PanelContainer title="Trânsito" icon={<Truck className="w-4 h-4 text-orange-500" />} onAdd={() => setTransit([...transit, { id: `manual-${Date.now()}`, nomeTransito: '', diasPadrao: 0, quantidade: 0, dataSaida: '' }])} isViewOnly={isViewOnly}>
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest"><tr><th className="px-8 py-4">Tipo</th><th className="px-8 py-4">Quant.</th><th className="px-8 py-4">Dias (Auto)</th></tr></thead>
                    <tbody>
                      {transit.map(row => {
                        const days = row.dataSaida ? getDaysDiff(row.dataSaida) : 0;
                        const rowStyle = getRowStatusClasses(row, days, 'transito');
                        return (
                          <tr key={row.id} className={`border-t border-gray-50 transition-colors ${rowStyle || 'hover:bg-gray-50/50'}`}>
                            <td className="px-8 py-4 font-bold"><input disabled={isViewOnly || row.isPadrao} className="bg-transparent w-full outline-none uppercase" value={row.nomeTransito} onChange={e => updateRow(transit, setTransit, row.id, 'nomeTransito', e.target.value)} /></td>
                            <td className="px-8 py-4"><input type="number" disabled={isViewOnly} className={`w-20 p-2 rounded-xl font-black text-center ${rowStyle ? 'bg-white/40' : 'bg-gray-50'}`} value={row.quantidade} onChange={e => updateRow(transit, setTransit, row.id, 'quantidade', e.target.value)} /></td>
                            <td className="px-8 py-4 flex items-center space-x-4">
                              <DatePickerField value={row.dataSaida} onChange={v => { updateRow(transit, setTransit, row.id, 'dataSaida', v); evaluateAlert(row, getDaysDiff(v), 'transito'); }} />
                              {row.dataSaida && <span className="text-xs font-black">{days}d</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </PanelContainer>

                <PanelContainer title="Shelf Life" icon={<FlaskConical className="w-4 h-4 text-orange-500" />} onAdd={() => setShelfLife([...shelfLife, { id: `manual-${Date.now()}`, partNumber: '', lote: '', dataVencimento: '', isPadrao: false }])} isViewOnly={isViewOnly}>
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest"><tr><th className="px-8 py-4">P/N</th><th className="px-8 py-4">Lote</th><th className="px-8 py-4">Vencimento (Auto)</th></tr></thead>
                    <tbody>
                      {shelfLife.map(row => {
                        const days = row.dataVencimento ? getDaysRemaining(row.dataVencimento) : 0;
                        const rowStyle = getRowStatusClasses(row, days, 'shelf_life');
                        return (
                          <tr key={row.id} className={`border-t border-gray-50 transition-colors ${rowStyle || 'hover:bg-gray-50/50'}`}>
                            <td className="px-8 py-4 font-bold"><input disabled={isViewOnly || row.isPadrao} className="bg-transparent w-full outline-none uppercase placeholder:text-gray-200" placeholder="P/N..." value={row.partNumber} onChange={e => updateRow(shelfLife, setShelfLife, row.id, 'partNumber', e.target.value)} /></td>
                            <td className="px-8 py-4"><input disabled={isViewOnly} className={`w-full p-2 rounded-xl font-black ${rowStyle ? 'bg-white/40' : 'bg-gray-50'}`} placeholder="Lote..." value={row.lote} onChange={e => updateRow(shelfLife, setShelfLife, row.id, 'lote', e.target.value)} /></td>
                            <td className="px-8 py-4 flex items-center space-x-4">
                              <DatePickerField value={row.dataVencimento} onChange={v => { updateRow(shelfLife, setShelfLife, row.id, 'dataVencimento', v); evaluateAlert(row, getDaysRemaining(v), 'shelf_life'); }} />
                              {(row.dataVencimento || row.partNumber) && <span className="text-xs font-black">{days}d</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </PanelContainer>

                <PanelContainer title="Saldo Crítico" icon={<AlertOctagon className="w-4 h-4 text-orange-500" />} onAdd={() => setCritical([...critical, { id: `manual-${Date.now()}`, partNumber: '', lote: '', saldoSistema: 0, saldoFisico: 0 }])} isViewOnly={isViewOnly}>
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest"><tr><th className="px-8 py-4">P/N</th><th className="px-8 py-4">Lote</th><th className="px-8 py-4 text-center">Sis.</th><th className="px-8 py-4 text-center">Fís.</th><th className="px-8 py-4 text-center">Dif.</th></tr></thead>
                    <tbody>
                      {critical.map(row => {
                        const diff = (row.saldoSistema || 0) - (row.saldoFisico || 0);
                        const absDiff = Math.abs(diff);
                        const rowStyle = getRowStatusClasses(row, absDiff, 'itens_criticos');
                        return (
                          <tr key={row.id} className={`border-t border-gray-50 transition-colors ${rowStyle || 'hover:bg-gray-50/50'}`}>
                            <td className="px-8 py-4 font-bold"><input disabled={isViewOnly || row.isPadrao} className="bg-transparent w-full outline-none uppercase placeholder:text-gray-300" placeholder="P/N..." value={row.partNumber} onChange={e => updateRow(critical, setCritical, row.id, 'partNumber', e.target.value)} /></td>
                            <td className="px-8 py-4"><input disabled={isViewOnly} className={`w-full p-2 rounded-xl font-bold bg-gray-50/50 outline-none ${rowStyle ? 'bg-white/40' : ''}`} placeholder="Lote..." value={row.lote} onChange={e => updateRow(critical, setCritical, row.id, 'lote', e.target.value)} /></td>
                            <td className="px-8 py-4 text-center"><input type="number" disabled={isViewOnly} className={`w-16 p-2 rounded-xl font-black text-center ${rowStyle ? 'bg-white/40' : 'bg-gray-50'}`} value={row.saldoSistema} onChange={e => updateRow(critical, setCritical, row.id, 'saldoSistema', e.target.value)} /></td>
                            <td className="px-8 py-4 text-center"><input type="number" disabled={isViewOnly} className={`w-16 p-2 rounded-xl font-black text-center ${rowStyle ? 'bg-white/40' : 'bg-gray-50'}`} value={row.saldoFisico} onChange={e => { updateRow(critical, setCritical, row.id, 'saldoFisico', e.target.value); evaluateAlert(row, Math.abs((row.saldoSistema || 0) - Number(e.target.value)), 'itens_criticos'); }} /></td>
                            <td className="px-8 py-4 text-center font-black">{diff}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </PanelContainer>
              </div>
           </section>

           {/* 4. Tarefas Operacionais (Final da Produção) */}
           <section className="space-y-12 pb-12">
              <h3 className="font-black text-gray-800 uppercase tracking-widest flex items-center space-x-2 text-sm">
                 <Activity className="w-4 h-4 text-orange-500" />
                 <span>Processos Operacionais</span>
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                 {opCategories.map(cat => (
                    <div key={cat.id} className="space-y-6">
                       <h3 className="px-4 text-xl font-black text-gray-800 uppercase tracking-tight flex items-center space-x-3">
                         <div className="w-1.5 h-6 bg-orange-600 rounded-full" />
                         <span>{cat.nome}</span>
                       </h3>
                       <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
                          {opTasks.filter(t => t.categoriaId === cat.id).map(task => (
                             <div key={task.id} className="p-6 flex items-center justify-between hover:bg-orange-50/10 transition-colors group">
                                <div className="flex flex-col">
                                   <span className="text-sm font-black text-gray-700 uppercase tracking-tight group-hover:text-orange-600 transition-colors">{task.nome}</span>
                                   <div className="flex items-center space-x-2">
                                      <span className="text-[10px] font-bold text-gray-300 uppercase">{task.tipoMedida}</span>
                                      {task.tipoMedida === MeasureType.QTD && (
                                        <span className="text-[9px] font-black text-orange-400 uppercase tracking-tighter">Fator: {minutesToHhmmss(task.fatorMultiplicador)}</span>
                                      )}
                                   </div>
                                </div>
                                {task.tipoMedida === MeasureType.TEMPO ? (
                                  <TimeInput 
                                    disabled={isViewOnly} 
                                    value={tarefasValores[task.id] || ''} 
                                    onChange={v => setTarefasValores({...tarefasValores, [task.id]: v})} 
                                    className="w-32 p-4 bg-gray-50 border border-transparent rounded-2xl font-black text-center focus:bg-white focus:border-orange-200 outline-none transition-all text-orange-600" 
                                  />
                                ) : (
                                  <input 
                                    type="number" 
                                    disabled={isViewOnly} 
                                    value={tarefasValores[task.id] || ''} 
                                    onChange={e => setTarefasValores({...tarefasValores, [task.id]: e.target.value})} 
                                    placeholder="0" 
                                    className="w-24 p-4 bg-gray-50 border border-transparent rounded-2xl font-black text-center focus:bg-white focus:border-orange-200 outline-none transition-all" 
                                  />
                                )}
                             </div>
                          ))}
                       </div>
                    </div>
                 ))}
              </div>
           </section>
        </div>
      </div>

      {!isViewOnly && (
        <div className="fixed bottom-8 right-8 z-40">
          <button onClick={() => setConfirmModal({ open: true, title: 'Finalizar Turno', message: 'Deseja finalizar esta passagem de serviço? Os dados serão arquivados.', type: 'warning', onConfirm: () => { setStatus('Finalizado'); window.scrollTo({ top: 0, behavior: 'smooth' }); } })} className="bg-orange-600 text-white px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-105 hover:bg-orange-700 transition-all flex items-center space-x-3 border-4 border-white">
            <CheckCircle className="w-5 h-5" /><span>Finalizar Turno</span>
          </button>
        </div>
      )}
    </div>
  );
};

const KpiItem: React.FC<{label: string, value: string, icon: React.ReactNode}> = ({label, value, icon}) => (
  <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 flex flex-col items-center justify-center space-y-0.5 hover:bg-white hover:shadow-sm transition-all border-l-4 border-l-transparent hover:border-l-orange-500">
     <div className="flex items-center space-x-2 text-gray-400">{icon} <span className="text-[9px] font-black uppercase tracking-widest">{label}</span></div>
     <span className="text-base font-black text-gray-800">{value}</span>
  </div>
);

const PanelContainer: React.FC<{title: string, icon: any, children: any, onAdd: any, isViewOnly: boolean}> = ({ title, icon, children, onAdd, isViewOnly }) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center px-4">
      <h3 className="font-black text-gray-800 uppercase tracking-widest flex items-center space-x-3 text-sm">
         <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">{icon}</div><span>{title}</span>
      </h3>
      {!isViewOnly && <button onClick={onAdd} className="text-[10px] font-black text-orange-600 bg-orange-50 px-5 py-2.5 rounded-2xl uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all shadow-sm">+ Adicionar</button>}
    </div>
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">{children}</div>
  </div>
);

const ShieldCheck: React.FC<any> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
);

export default ShiftHandoverPage;
