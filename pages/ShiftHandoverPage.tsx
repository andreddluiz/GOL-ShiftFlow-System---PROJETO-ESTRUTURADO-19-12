
import React, { useState, useMemo, useEffect } from 'react';
import { 
  CheckCircle, Trash2, Info, Users, Clock, AlertTriangle, ClipboardList,
  X, TrendingUp, Timer, MapPin, Box, Truck, FlaskConical, AlertOctagon, Plane, Settings,
  Calendar, UserCheck, Activity, BarChart3
} from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { 
  MeasureType, OutraAtividade, Control, 
  LocationRow, TransitRow, ShelfLifeRow, CriticalRow, AlertConfig, ManagedItem,
  User, Task, Category, ConditionConfig
} from '../types';
import { DatePickerField, TimeInput, hhmmssToMinutes, minutesToHhmmss, ConfirmModal } from '../modals';

// Utilitários de Data
const parseDate = (str: string): Date | null => {
  if (!str) return null;
  const parts = str.split('/');
  if (parts.length !== 3) return null;
  const d = parseInt(parts[0]);
  const m = parseInt(parts[1]) - 1;
  const y = parseInt(parts[2]);
  const date = new Date(y, m, d);
  return isNaN(date.getTime()) ? null : date;
};

const getDaysDiff = (dateStr: string): number => {
  const date = parseDate(dateStr);
  if (!date) return 0;
  const today = new Date();
  today.setHours(0,0,0,0);
  date.setHours(0,0,0,0);
  return Math.abs(Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)));
};

const getDaysRemaining = (dateStr: string): number => {
  const date = parseDate(dateStr);
  if (!date) return 0;
  const today = new Date();
  today.setHours(0,0,0,0);
  date.setHours(0,0,0,0);
  return Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const ShiftHandoverPage: React.FC<{baseId?: string}> = ({ baseId }) => {
  const { 
    getControlesCombinados, getDefaultLocations, getDefaultTransits, getDefaultCriticals, getDefaultShelfLifes,
    customControlTypes, getCustomControlItems,
    bases, users, tasks: allTasks, categories: allCats, controls: allControls, 
    defaultLocations: storeLocs, defaultTransits: storeTrans, defaultCriticals: storeCrit, defaultShelfLifes: storeShelf,
    initialized, refreshData 
  } = useStore();
  
  const currentBase = useMemo(() => bases.find(b => b.id === baseId), [bases, baseId]);
  const baseUsers = useMemo(() => users.filter(u => u.bases.includes(baseId || '') && u.status === 'Ativo'), [users, baseId]);
  
  useEffect(() => {
    refreshData(false);
  }, [baseId]);

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

  // Problema 1: Sincronização Imediata usando flag 'visivel'
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
      if (toAdd.length === 0 && filtered.length === prev.length) return prev;
      return [...filtered, ...toAdd.map(i => ({ id: i.id, partNumber: i.partNumber, lote: i.lote || '', dataVencimento: i.dataVencimento || '', isPadrao: true, config: i }))];
    });
  }, [baseId, initialized, storeLocs, storeTrans, storeCrit, storeShelf]);

  // Lógica de Categorias e Tarefas Operacionais
  const opCategories = useMemo(() => {
    return allCats.filter(c => c.tipo === 'operacional' && c.status === 'Ativa' && (c.visivel !== false) && (!c.baseId || c.baseId === baseId)).sort((a,b) => a.ordem - b.ordem);
  }, [allCats, baseId]);

  const opTasks = useMemo(() => {
    return allTasks.filter(t => t.status === 'Ativa' && (t.visivel !== false) && (!t.baseId || t.baseId === baseId));
  }, [allTasks, baseId]);

  // Cálculos de Produtividade
  const { horasDisponiveis, horasProduzidas, performance } = useMemo(() => {
    const disp = colaboradoresIds.reduce((acc, id) => {
      if (!id) return acc;
      const user = baseUsers.find(u => u.id === String(id));
      return acc + (user?.jornadaPadrao || 0);
    }, 0);

    let prod = 0;
    Object.entries(tarefasValores).forEach(([taskId, val]) => {
      const task = opTasks.find(t => t.id === taskId);
      if (!task) return;
      const numericVal = parseFloat(String(val)) || 0;
      prod += (numericVal * task.fatorMultiplicador) / 60;
    });

    const perf = disp > 0 ? (prod / disp) * 100 : 0;
    return { horasDisponiveis: disp, horasProduzidas: prod, performance: perf };
  }, [colaboradoresIds, tarefasValores, baseUsers, opTasks]);

  const handleTaskChange = (taskId: string, value: string) => {
    setTarefasValores(prev => ({ ...prev, [taskId]: value }));
  };

  const handleColaboradorChange = (idx: number, id: string | null) => {
    if (id && colaboradoresIds.includes(id)) {
      setActiveAlert({
        titulo: "Colaborador Duplicado",
        mensagem: "Este colaborador já foi selecionado para este turno. Por favor, escolha outro.",
        color: "bg-orange-600"
      });
      return;
    }
    const newIds = [...colaboradoresIds];
    newIds[idx] = id;
    setColaboradoresIds(newIds);
  };

  // Avaliação de Alerta Integrada
  const evaluateAlert = (item: any, value: any, controlType: string) => {
    const config = item.config || activeControls.find((c: any) => c.tipo === controlType);
    if (!config) return;

    console.debug(`[Pop-up Evaluation] Avaliando: ${controlType}, valor: ${value}`);

    const checkCondition = (rule: ConditionConfig, val: number) => {
      const ref = Number(rule.valor);
      const op = rule.operador;
      if (op === '>') return val > ref;
      if (op === '<') return val < ref;
      if (op === '=') return val === ref;
      if (op === '>=') return val >= ref;
      if (op === '<=') return val <= ref;
      return false;
    };

    if (config.cores && config.popups) {
      const val = Number(value);
      if (checkCondition(config.cores.vermelho, val)) {
        setActiveAlert({ 
          titulo: config.popups.vermelho.titulo || 'ALERTA CRÍTICO', 
          mensagem: config.popups.vermelho.mensagem.replace('X', String(val)), 
          color: 'bg-red-600' 
        });
      } else if (checkCondition(config.cores.amarelo, val)) {
        setActiveAlert({ 
          titulo: config.popups.amarelo.titulo || 'ATENÇÃO', 
          mensagem: config.popups.amarelo.mensagem.replace('X', String(val)), 
          color: 'bg-yellow-600' 
        });
      } else if (checkCondition(config.cores.verde, val)) {
        setActiveAlert({ 
          titulo: config.popups.verde.titulo || 'STATUS OK', 
          mensagem: config.popups.verde.mensagem.replace('X', String(val)), 
          color: 'bg-green-600' 
        });
      }
    }
  };

  const updateRow = (list: any[], setList: Function, id: string, field: string, value: any) => {
    setList(list.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  // Problema 3: Trigger do evaluateAlert disparado no fechamento do calendário
  const handleBlur = (item: any, controlType: string, value: any) => {
     if (value === '' || value === undefined) return;
     let calcVal = Number(value);
     if (['locations', 'transito'].includes(controlType) && typeof value === 'string' && value !== '') calcVal = getDaysDiff(value);
     if (controlType === 'shelf_life' && typeof value === 'string' && value !== '') calcVal = getDaysRemaining(value);
     if (controlType === 'itens_criticos') {
        const row = critical.find(c => c.id === item.id);
        calcVal = Math.abs((row?.saldoSistema || 0) - (row?.saldoFisico || 0));
     }
     
     console.debug("[Problema 3] Disparando avaliação de pop-up para valor:", calcVal);
     evaluateAlert(item, calcVal, controlType);
  };

  const isViewOnly = status === 'Finalizado';

  const getItemStatusColor = (item: any, val: number, controlType: string) => {
    const config = item.config || activeControls.find((c: any) => c.tipo === controlType);
    if (!config || !config.cores) return 'text-gray-400';

    const checkCondition = (rule: ConditionConfig, v: number) => {
      const ref = Number(rule.valor);
      const op = rule.operador;
      if (op === '>') return v > ref;
      if (op === '<') return v < ref;
      if (op === '=') return v === ref;
      if (op === '>=') return v >= ref;
      if (op === '<=') return v <= ref;
      return false;
    };

    if (checkCondition(config.cores.vermelho, val)) return 'text-red-600 font-black';
    if (checkCondition(config.cores.amarelo, val)) return 'text-yellow-600 font-black';
    if (checkCondition(config.cores.verde, val)) return 'text-green-600 font-black';
    return 'text-gray-400';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-32 animate-in fade-in relative">
      {/* Pop-up de Alerta Centralizado */}
      {activeAlert && (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${activeAlert.color} text-white p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full animate-in zoom-in-95 border-4 border-white/20`}>
            <div className="flex justify-between items-start mb-4">
               <AlertTriangle className="w-12 h-12 animate-pulse" />
               <button onClick={() => setActiveAlert(null)} className="p-1 hover:bg-black/10 rounded-full transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <h4 className="text-2xl font-black uppercase tracking-tight mb-2">{activeAlert.titulo}</h4>
            <p className="font-bold opacity-90 leading-relaxed">{activeAlert.mensagem}</p>
            <button onClick={() => setActiveAlert(null)} className="mt-8 w-full bg-white text-gray-800 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-gray-50 transition-all">Entendido</button>
          </div>
        </div>
      )}

      {/* Confirmação de Finalização */}
      <ConfirmModal 
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ ...confirmModal, open: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />

      {/* HEADER */}
      <header className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
         <div className="flex items-center space-x-6">
            <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 shadow-inner">
               <Plane className="w-8 h-8" />
            </div>
            <div>
               <h2 className="text-3xl font-black text-gray-800 tracking-tighter">Passagem de Turno</h2>
               <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">{currentBase?.nome} - {dataOperacional}</p>
            </div>
         </div>
         <div className="flex space-x-2">
            <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${status === 'Rascunho' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
               Status: {status}
            </div>
         </div>
      </header>

      {/* PRODUTIVIDADE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-8">
            <div className="flex justify-between items-center">
               <h3 className="font-black text-gray-800 uppercase tracking-widest flex items-center space-x-2 text-sm">
                 <BarChart3 className="w-4 h-4 text-orange-500" /> <span>Produtividade</span>
               </h3>
               <TrendingUp className="w-5 h-5 text-gray-200" />
            </div>
            <div className="grid grid-cols-3 gap-4">
               <KpiItem label="Disponível" value={minutesToHhmmss(horasDisponiveis * 60)} icon={<Clock className="w-4 h-4" />} />
               <KpiItem label="Produzido" value={minutesToHhmmss(horasProduzidas * 60)} icon={<Activity className="w-4 h-4" />} />
               <div className="bg-orange-600 text-white p-6 rounded-3xl shadow-xl shadow-orange-100 flex flex-col items-center justify-center space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Performance</span>
                  <span className="text-3xl font-black">{performance.toFixed(1)}%</span>
               </div>
            </div>
            <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
               <div className="absolute inset-y-0 left-0 bg-orange-500 transition-all duration-1000" style={{ width: `${Math.min(performance, 100)}%` }}></div>
            </div>
         </div>

         <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
            <h3 className="font-black text-gray-800 uppercase tracking-widest flex items-center space-x-2 text-sm">
              <Calendar className="w-4 h-4 text-orange-500" /> <span>Dados Operacionais</span>
            </h3>
            <div className="space-y-4">
               <DatePickerField label="Data Operacional" value={dataOperacional} onChange={setDataOperacional} disabled={isViewOnly} />
               <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Turno</label>
                  <select disabled={isViewOnly} value={turnoAtivo} onChange={e => setTurnoAtivo(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-orange-100 transition-all text-sm">
                     <option value="">Selecionar Turno...</option>
                     {currentBase?.turnos.map(t => <option key={t.id} value={t.id}>Turno {t.numero} ({t.horaInicio} - {t.horaFim})</option>)}
                  </select>
               </div>
            </div>
         </div>
      </div>

      {/* EQUIPE */}
      <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-8">
         <div className="flex justify-between items-center">
            <h3 className="font-black text-gray-800 uppercase tracking-widest flex items-center space-x-2 text-sm">
               <Users className="w-4 h-4 text-orange-500" /> <span>Equipe no Turno</span>
            </h3>
            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Até 6 Colaboradores</span>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {colaboradoresIds.map((colId, idx) => (
               <div key={idx} className="relative group">
                  <div className="absolute -top-2 -left-2 w-6 h-6 bg-orange-600 text-white rounded-lg flex items-center justify-center text-[10px] font-black shadow-lg z-10">{idx + 1}</div>
                  <select 
                    disabled={isViewOnly}
                    value={colId || ''} 
                    onChange={e => handleColaboradorChange(idx, e.target.value || null)}
                    className={`w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none transition-all text-xs ${colId ? 'text-gray-800 bg-white shadow-sm border-orange-100' : 'text-gray-400'}`}
                  >
                     <option value="">Livre...</option>
                     {baseUsers.map(u => {
                        const baseSigla = bases.find(b => u.bases.includes(b.id))?.sigla || '?';
                        return (
                          <option key={u.id} value={u.id}>
                            {u.nome} - {baseSigla} - {u.jornadaPadrao}h
                          </option>
                        );
                     })}
                  </select>
               </div>
            ))}
         </div>
      </section>

      {/* TAREFAS */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12">
         {opCategories.map(cat => (
            <div key={cat.id} className="space-y-6">
               <div className="flex items-center space-x-4 px-2">
                  <div className="w-10 h-10 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-orange-500 transition-colors">
                     <Activity className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">{cat.nome}</h3>
               </div>
               <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
                  {opTasks.filter(t => t.categoriaId === cat.id).map(task => (
                     <div key={task.id} className="p-6 flex items-center justify-between hover:bg-orange-50/10 transition-colors group">
                        <div className="flex flex-col">
                           <span className="text-sm font-black text-gray-700 uppercase tracking-tight group-hover:text-orange-600 transition-colors">{task.nome}</span>
                           <span className="text-[10px] font-bold text-gray-300 uppercase">{task.tipoMedida} • Fator {minutesToHhmmss(task.fatorMultiplicador)}</span>
                        </div>
                        <input 
                          type="number"
                          disabled={isViewOnly}
                          value={tarefasValores[task.id] || ''}
                          onChange={e => handleTaskChange(task.id, e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Tab') handleBlur({id: task.id}, 'tarefa', tarefasValores[task.id]); }}
                          onBlur={() => handleBlur({id: task.id}, 'tarefa', tarefasValores[task.id])}
                          placeholder="0"
                          className="w-24 p-4 bg-gray-50 border border-transparent rounded-2xl font-black text-center focus:bg-white focus:border-orange-200 transition-all outline-none text-gray-800"
                        />
                     </div>
                  ))}
               </div>
            </div>
         ))}
      </section>

      {/* PAINÉIS DE CONTROLE */}
      <section className="grid grid-cols-1 gap-12">
        <PanelContainer title="Locations" icon={<Box className="w-4 h-4 text-orange-500" />} onAdd={() => setLocations([...locations, { id: Date.now().toString(), nomeLocation: '', quantidade: 0, dataMaisAntigo: '' }])} isViewOnly={isViewOnly}>
          <table className="w-full text-left">
            <thead><tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest"><th className="px-8 py-4">Location</th><th className="px-8 py-4">Quant.</th><th className="px-8 py-4">Dias (Auto)</th></tr></thead>
            <tbody>
              {locations.map(row => {
                const days = row.dataMaisAntigo ? getDaysDiff(row.dataMaisAntigo) : 0;
                return (
                  <tr key={row.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-4 font-bold"><input disabled={isViewOnly || row.isPadrao} className="bg-transparent w-full outline-none uppercase" value={row.nomeLocation} onChange={e => updateRow(locations, setLocations, row.id, 'nomeLocation', e.target.value)} /></td>
                    <td className="px-8 py-4"><input type="number" disabled={isViewOnly} className="w-20 bg-gray-50 p-2 rounded-xl font-black text-center" value={row.quantidade} onChange={e => updateRow(locations, setLocations, row.id, 'quantidade', e.target.value)} /></td>
                    <td className="px-8 py-4 flex items-center space-x-4">
                      <DatePickerField value={row.dataMaisAntigo} onChange={v => updateRow(locations, setLocations, row.id, 'dataMaisAntigo', v)} onKeyDown={e => { if (e.key === 'Enter') handleBlur(row, 'locations', row.dataMaisAntigo); }} onBlur={() => handleBlur(row, 'locations', row.dataMaisAntigo)} />
                      {row.dataMaisAntigo && <span className={`text-xs ${getItemStatusColor(row, days, 'locations')}`}>{days}d</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </PanelContainer>

        <PanelContainer title="Trânsito" icon={<Truck className="w-4 h-4 text-orange-500" />} onAdd={() => setTransit([...transit, { id: Date.now().toString(), nomeTransito: '', diasPadrao: 0, quantidade: 0, dataSaida: '' }])} isViewOnly={isViewOnly}>
          <table className="w-full text-left">
            <thead><tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest"><th className="px-8 py-4">Tipo</th><th className="px-8 py-4">Quant.</th><th className="px-8 py-4">Dias (Auto)</th></tr></thead>
            <tbody>
              {transit.map(row => {
                const days = row.dataSaida ? getDaysDiff(row.dataSaida) : 0;
                return (
                  <tr key={row.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-4 font-bold"><input disabled={isViewOnly || row.isPadrao} className="bg-transparent w-full outline-none uppercase" value={row.nomeTransito} onChange={e => updateRow(transit, setTransit, row.id, 'nomeTransito', e.target.value)} /></td>
                    <td className="px-8 py-4"><input type="number" disabled={isViewOnly} className="w-20 bg-gray-50 p-2 rounded-xl font-black text-center" value={row.quantidade} onChange={e => updateRow(transit, setTransit, row.id, 'quantidade', e.target.value)} /></td>
                    <td className="px-8 py-4 flex items-center space-x-4">
                      <DatePickerField value={row.dataSaida} onChange={v => updateRow(transit, setTransit, row.id, 'dataSaida', v)} onKeyDown={e => { if (e.key === 'Enter') handleBlur(row, 'transito', row.dataSaida); }} onBlur={() => handleBlur(row, 'transito', row.dataSaida)} />
                      {row.dataSaida && <span className={`text-xs ${getItemStatusColor(row, days, 'transito')}`}>{days}d</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </PanelContainer>

        <PanelContainer title="Shelf Life" icon={<FlaskConical className="w-4 h-4 text-orange-500" />} onAdd={() => setShelfLife([...shelfLife, { id: Date.now().toString(), partNumber: '', lote: '', dataVencimento: '' }])} isViewOnly={isViewOnly}>
          <table className="w-full text-left">
            <thead><tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest"><th className="px-8 py-4">P/N</th><th className="px-8 py-4">Lote</th><th className="px-8 py-4">Vencimento (Auto)</th></tr></thead>
            <tbody>
              {shelfLife.map(row => {
                const days = row.dataVencimento ? getDaysRemaining(row.dataVencimento) : 0;
                return (
                  <tr key={row.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-4 font-bold"><input disabled={isViewOnly || row.isPadrao} className="bg-transparent w-full outline-none uppercase" value={row.partNumber} onChange={e => updateRow(shelfLife, setShelfLife, row.id, 'partNumber', e.target.value)} /></td>
                    <td className="px-8 py-4"><input disabled={isViewOnly} className="w-full bg-gray-50 p-2 rounded-xl font-black" value={row.lote} onChange={e => updateRow(shelfLife, setShelfLife, row.id, 'lote', e.target.value)} /></td>
                    <td className="px-8 py-4 flex items-center space-x-4">
                      <DatePickerField value={row.dataVencimento} onChange={v => updateRow(shelfLife, setShelfLife, row.id, 'dataVencimento', v)} onKeyDown={e => { if (e.key === 'Enter') handleBlur(row, 'shelf_life', row.dataVencimento); }} onBlur={() => handleBlur(row, 'shelf_life', row.dataVencimento)} />
                      {row.dataVencimento && <span className={`text-xs ${getItemStatusColor(row, days, 'shelf_life')}`}>{days}d</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </PanelContainer>

        <PanelContainer title="Itens Críticos" icon={<AlertOctagon className="w-4 h-4 text-orange-500" />} onAdd={() => setCritical([...critical, { id: Date.now().toString(), partNumber: '', lote: '', saldoSistema: 0, saldoFisico: 0 }])} isViewOnly={isViewOnly}>
          <table className="w-full text-left">
            <thead><tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest"><th className="px-8 py-4">P/N</th><th className="px-8 py-4">Sis.</th><th className="px-8 py-4">Fís.</th><th className="px-8 py-4">Dif.</th></tr></thead>
            <tbody>
              {critical.map(row => {
                const diff = (row.saldoSistema || 0) - (row.saldoFisico || 0);
                return (
                  <tr key={row.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-4 font-bold"><input disabled={isViewOnly || row.isPadrao} className="bg-transparent w-full outline-none uppercase" value={row.partNumber} onChange={e => updateRow(critical, setCritical, row.id, 'partNumber', e.target.value)} /></td>
                    <td className="px-8 py-4"><input type="number" disabled={isViewOnly} className="w-16 bg-gray-50 p-2 rounded-xl font-black text-center" value={row.saldoSistema} onChange={e => updateRow(critical, setCritical, row.id, 'saldoSistema', e.target.value)} /></td>
                    <td className="px-8 py-4"><input type="number" disabled={isViewOnly} className="w-16 bg-gray-50 p-2 rounded-xl font-black text-center" value={row.saldoFisico} onChange={e => updateRow(critical, setCritical, row.id, 'saldoFisico', e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleBlur(row, 'itens_criticos', diff); }} onBlur={() => handleBlur(row, 'itens_criticos', diff)} /></td>
                    <td className={`px-8 py-4 font-black ${getItemStatusColor(row, Math.abs(diff), 'itens_criticos')}`}>
                       {diff}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </PanelContainer>
      </section>

      {/* ÁREA DE OBSERVAÇÕES */}
      <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-4">
         <h3 className="font-black text-gray-800 uppercase tracking-widest flex items-center space-x-2 text-sm">
            <ClipboardList className="w-4 h-4 text-orange-500" /> <span>Observações do Turno</span>
         </h3>
         <textarea 
           disabled={isViewOnly}
           value={obs}
           onChange={e => setObs(e.target.value)}
           placeholder="Descreva aqui intercorrências, pendências ou informações relevantes para o próximo turno..."
           className="w-full min-h-[200px] p-6 bg-gray-50 rounded-[2rem] border border-transparent focus:bg-white focus:border-orange-100 transition-all outline-none font-medium leading-relaxed"
         />
      </section>

      {/* BOTÃO DE FINALIZAÇÃO */}
      {!isViewOnly && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
          <button 
            onClick={() => {
               setConfirmModal({
                 open: true,
                 title: 'Finalizar Turno',
                 message: 'Deseja finalizar esta passagem de serviço? Os dados serão arquivados e travados para edição posterior.',
                 type: 'warning',
                 onConfirm: () => {
                   setStatus('Finalizado');
                   window.scrollTo({ top: 0, behavior: 'smooth' });
                 }
               });
            }} 
            className="bg-orange-600 text-white px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-orange-200 hover:scale-105 transition-all flex items-center space-x-3"
          >
            <CheckCircle className="w-5 h-5" />
            <span>Finalizar Turno</span>
          </button>
        </div>
      )}
    </div>
  );
};

// Componentes Auxiliares
const KpiItem: React.FC<{label: string, value: string, icon: React.ReactNode}> = ({label, value, icon}) => (
  <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex flex-col items-center justify-center space-y-1">
     <div className="flex items-center space-x-2 text-gray-400">
        {icon} <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
     </div>
     <span className="text-xl font-black text-gray-800">{value}</span>
  </div>
);

const PanelContainer: React.FC<{title: string, icon: any, children: any, onAdd: any, isViewOnly: boolean}> = ({ title, icon, children, onAdd, isViewOnly }) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center px-4">
      <h3 className="font-black text-gray-800 uppercase tracking-widest flex items-center space-x-3 text-sm">
         <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">{icon}</div>
         <span>{title}</span>
      </h3>
      {!isViewOnly && <button onClick={onAdd} className="text-[10px] font-black text-orange-600 bg-orange-50 px-5 py-2.5 rounded-2xl uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all shadow-sm">+ Adicionar</button>}
    </div>
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
       {children}
    </div>
  </div>
);

export default ShiftHandoverPage;
