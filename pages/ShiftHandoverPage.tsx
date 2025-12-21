
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Save, CheckCircle, Plus, Trash2, Info, Users, Clock, AlertTriangle, ClipboardList,
  Calendar, X, TrendingUp, Timer, AlertCircle, MapPin, Box, Truck, FlaskConical, AlertOctagon,
  Plane
} from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { 
  MeasureType, User, OutraAtividade, Control, 
  LocationRow, TransitRow, ShelfLifeRow, CriticalRow, AlertConfig 
} from '../types';
import { DatePickerField, TimeInput, hhmmssToMinutes, minutesToHhmmss } from '../modals';

/**
 * Utilitários de Data e Tempo Robustos
 */
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
  const diff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  return isNaN(diff) ? 0 : diff;
};

const getDaysRemaining = (dateStr: string): number => {
  const date = parseDate(dateStr);
  if (!date) return 0;
  const today = new Date();
  today.setHours(0,0,0,0);
  date.setHours(0,0,0,0);
  const diff = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return isNaN(diff) ? 0 : diff;
};

const ShiftHandoverPage: React.FC<{baseId?: string}> = ({ baseId }) => {
  const { 
    getControlesCombinados,
    getDefaultLocations,
    getDefaultTransits,
    getDefaultCriticals,
    bases, users, tasks: allTasks, categories: allCats, controls: allControls, initialized, refreshData 
  } = useStore();
  
  const currentBase = useMemo(() => bases.find(b => b.id === baseId), [bases, baseId]);
  const baseUsers = useMemo(() => users.filter(u => u.bases.includes(baseId || '') && u.status === 'Ativo'), [users, baseId]);
  
  useEffect(() => {
    console.debug("[DEBUG ShiftHandover] Inicializando página para base:", baseId);
    refreshData(false);
  }, [baseId]);

  const opCategories = useMemo(() => {
    return allCats.filter(c => 
      c.tipo === 'operacional' && 
      c.status === 'Ativa' && 
      (!c.baseId || c.baseId === baseId)
    ).sort((a,b) => a.ordem - b.ordem);
  }, [allCats, baseId]);

  // Filtro de Tarefas Ativas (Para novas passagens, ignoramos inativas)
  const opTasks = useMemo(() => {
    return allTasks.filter(t => 
      t.status === 'Ativa' && 
      (!t.baseId || t.baseId === baseId)
    );
  }, [allTasks, baseId]);

  const activeControls = useMemo(() => getControlesCombinados(baseId || ''), [getControlesCombinados, baseId, allControls]);

  // Estados do formulário
  const [status, setStatus] = useState<'Rascunho' | 'Finalizado'>('Rascunho');
  const [dataOperacional, setDataOperacional] = useState(new Date().toLocaleDateString('pt-BR'));
  const [turnoAtivo, setTurnoAtivo] = useState('');
  const [colaboradoresIds, setColaboradoresIds] = useState<(string | null)[]>([null, null, null, null, null, null]);
  const [tarefasValores, setTarefasValores] = useState<Record<string, string>>({}); 
  const [outrasAtividades, setOutrasAtividades] = useState<OutraAtividade[]>([]);
  const [obs, setObs] = useState('');

  // Estados dos Painéis de Controle
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [transit, setTransit] = useState<TransitRow[]>([]);
  const [shelfLife, setShelfLife] = useState<ShelfLifeRow[]>([]);
  const [critical, setCritical] = useState<CriticalRow[]>([]);

  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [isPanelVisible, setIsPanelVisible] = useState(true);
  const [activeAlert, setActiveAlert] = useState<{message: string, color: string} | null>(null);
  const hideTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (baseId && initialized) {
      console.debug("[DEBUG ShiftHandover] Carregando itens padrão para os painéis...");
      const defLocs = getDefaultLocations(baseId).map(i => ({ 
        id: i.id, nomeLocation: i.nomeLocation, quantidade: 0, dataMaisAntigo: '', isPadrao: true 
      }));
      const defTrans = getDefaultTransits(baseId).map(i => ({ 
        id: i.id, nomeTransito: i.nomeTransito, diasPadrao: i.diasPadrao, quantidade: 0, dataSaida: '', isPadrao: true 
      }));
      const defCrit = getDefaultCriticals(baseId).map(i => ({ 
        id: i.id, partNumber: i.partNumber, lote: '', saldoSistema: 0, saldoFisico: 0, isPadrao: true 
      }));

      setLocations(defLocs);
      setTransit(defTrans);
      setCritical(defCrit);
      setShelfLife([{ id: Date.now().toString(), partNumber: '', lote: '', dataVencimento: '' }]);
    }
  }, [baseId, initialized]);

  // CÁLCULO DE PERFORMANCE
  const horasDisponiveis = useMemo(() => {
    const total = colaboradoresIds.reduce((acc, userId) => {
      if (!userId) return acc;
      const user = baseUsers.find(u => u.id === userId);
      return acc + (Number(user?.jornadaPadrao) || 0);
    }, 0);
    return isNaN(total) ? 0 : total;
  }, [colaboradoresIds, baseUsers]);

  const horasProduzidas = useMemo(() => {
    let totalMinutos = 0;
    Object.entries(tarefasValores).forEach(([taskId, val]) => {
      const task = opTasks.find(t => t.id === taskId);
      if (!task || !val) return;
      if (task.tipoMedida === MeasureType.QTD) {
        totalMinutos += (parseFloat(String(val)) || 0) * (Number(task.fatorMultiplicador) || 0);
      } else {
        totalMinutos += hhmmssToMinutes(String(val));
      }
    });
    outrasAtividades.forEach(atv => totalMinutos += (parseFloat(String(atv.tempo)) || 0));
    return totalMinutos / 60;
  }, [tarefasValores, opTasks, outrasAtividades]);

  const performance = useMemo(() => {
    if (horasDisponiveis <= 0) return 0;
    return (horasProduzidas / horasDisponiveis) * 100;
  }, [horasProduzidas, horasDisponiveis]);

  useEffect(() => {
    const handleScroll = () => {
      setShowStickyHeader(window.scrollY > 200);
      setIsPanelVisible(true);
      if (hideTimeoutRef.current) window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = window.setTimeout(() => setIsPanelVisible(false), 3000);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const triggerPanel = () => {
    setIsPanelVisible(true);
    if (hideTimeoutRef.current) window.clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = window.setTimeout(() => setIsPanelVisible(false), 3000);
  };

  const checkAlert = (value: number, config: AlertConfig, logic: 'direta' | 'inversa' | 'critica') => {
    let level: 'verde' | 'amarelo' | 'vermelho' = 'verde';
    if (logic === 'direta') {
       if (value > config.vermelho) level = 'vermelho';
       else if (value > config.amarelo) level = 'amarelo';
    } else if (logic === 'inversa') {
       if (value < config.vermelho) level = 'vermelho'; // No inverso, se for menor que o limite vermelho, alerta
       else if (value < config.amarelo) level = 'amarelo';
    } else if (logic === 'critica') {
       level = value !== 0 ? 'vermelho' : 'verde';
    }

    if (level === 'vermelho' && config.permitirPopupVermelho) {
      setActiveAlert({ message: config.mensagemVermelho || 'Atenção Crítica!', color: 'bg-red-600' });
    } else if (level === 'verde' && config.permitirPopupVerde) {
      setActiveAlert({ message: config.mensagemVerde || 'OK!', color: 'bg-green-600' });
    }
  };

  const updateRow = (list: any[], setList: Function, id: string, field: string, value: any, controlType: string, triggerAlert = false) => {
    const newList = list.map(item => item.id === id ? { ...item, [field]: value } : item);
    setList(newList);
    triggerPanel();
    
    if (triggerAlert) {
      const control = activeControls.find(c => c.tipo === controlType);
      if (!control) return;
      
      let calcValue = 0;
      if (field === 'dataMaisAntigo' || field === 'dataSaida' || field === 'dataVencimento') {
        const valStr = String(value);
        if (controlType === 'locations' || controlType === 'transito') calcValue = getDaysDiff(valStr);
        if (controlType === 'shelf_life') calcValue = getDaysRemaining(valStr);
        checkAlert(calcValue, control.alertaConfig, controlType === 'shelf_life' ? 'inversa' : 'direta');
      } else if (field === 'saldoFisico' || field === 'saldoSistema') {
         // Lógica de saldo crítico (diferença)
         const row = newList.find(r => r.id === id);
         calcValue = Math.abs((Number(row.saldoSistema) || 0) - (Number(row.saldoFisico) || 0));
         checkAlert(calcValue, control.alertaConfig, 'critica');
      }
    }
  };

  const isViewOnly = status === 'Finalizado';

  // Renderizador de cores para as células
  const getCellColor = (value: number, config: AlertConfig, logic: 'direta' | 'inversa' | 'critica') => {
    if (logic === 'direta') {
      if (value > config.vermelho) return 'bg-red-50 text-red-600 border-red-200';
      if (value > config.amarelo) return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      return 'bg-green-50 text-green-600 border-green-200';
    }
    if (logic === 'inversa') {
      if (value < config.vermelho) return 'bg-red-50 text-red-600 border-red-200';
      if (value < config.amarelo) return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      return 'bg-green-50 text-green-600 border-green-200';
    }
    if (logic === 'critica') {
      return value !== 0 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-600 border-green-200';
    }
    return 'bg-gray-50';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-32 animate-in fade-in relative">
      {activeAlert && (
        <div className="fixed inset-x-0 top-10 z-[200] flex justify-center animate-in slide-in-from-top-10">
          <div className={`${activeAlert.color} text-white px-8 py-4 rounded-full shadow-2xl flex items-center space-x-4 border-4 border-white`}>
            <AlertTriangle className="w-8 h-8 animate-pulse" />
            <span className="font-black text-lg uppercase tracking-tight">{activeAlert.message}</span>
            <button onClick={() => setActiveAlert(null)} className="p-1 hover:bg-black/20 rounded-full transition-colors"><X className="w-6 h-6" /></button>
          </div>
        </div>
      )}

      {/* 1º: PAINEL DE PRODUTIVIDADE */}
      <div className={`${showStickyHeader ? 'fixed top-0 left-0 right-0 z-[100] transition-all' : 'relative z-30'} ${showStickyHeader && !isPanelVisible ? '-translate-y-full opacity-0' : 'translate-y-0'}`}>
        <div className={`${showStickyHeader ? 'max-w-6xl mx-auto p-4' : 'p-0'}`}>
          <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl shadow-orange-200/20 border border-orange-50 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none"><TrendingUp className="w-32 h-32 text-orange-600" /></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 relative z-10">
              <KPICard label="Disponível" value={minutesToHHMMSS(horasDisponiveis * 60)} icon={<Clock className="text-blue-500 w-5 h-5" />} subtext="Horas de Escala" />
              <KPICard label="Produzido" value={minutesToHHMMSS(horasProduzidas * 60)} icon={<Timer className="text-orange-500 w-5 h-5" />} subtext="Total de Atividades" />
              <KPICard label="Performance" value={`${performance.toFixed(1)}%`} icon={<TrendingUp className="w-5 h-5" />} subtext="Eficiência do Turno" />
            </div>
            <div className="h-4 w-full bg-gray-100 rounded-full p-1 shadow-inner overflow-hidden">
               <div className={`h-full rounded-full transition-all duration-1000 ${performance >= 70 ? 'bg-green-500' : performance >= 40 ? 'bg-yellow-500' : 'bg-red-600'}`} style={{ width: `${Math.min(performance, 100)}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* 2º: DADOS OPERACIONAIS & EQUIPE */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DatePickerField label="Data Operacional" value={dataOperacional} onChange={setDataOperacional} disabled={isViewOnly} />
            <InfoItem label="Base" value={currentBase?.nome || '...'} icon={<MapPin className="w-4 h-4" />} />
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Turno</label>
              <select disabled={isViewOnly} value={turnoAtivo} onChange={e => setTurnoAtivo(e.target.value)} className="w-full bg-gray-50 p-3 rounded-xl text-sm font-bold text-gray-700 border border-transparent focus:border-orange-200 outline-none">
                <option value="">Selecione o Turno...</option>
                {currentBase?.turnos.map(t => <option key={t.id} value={t.id}>Turno {t.numero} ({t.horaInicio}-{t.horaFim})</option>)}
              </select>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-50">
            <h3 className="font-black text-gray-800 uppercase tracking-widest flex items-center space-x-2 text-xs mb-4"><Users className="w-4 h-4 text-orange-500" /><span>Equipe do Turno</span></h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {colaboradoresIds.map((id, idx) => (
                <div key={idx} className="bg-gray-50 p-4 rounded-2xl flex items-center space-x-3 group hover:bg-white hover:shadow-sm border border-transparent hover:border-orange-100 transition-all">
                  <span className="w-6 h-6 rounded-lg bg-white flex items-center justify-center font-black text-[10px] text-gray-300 shadow-sm">{idx+1}</span>
                  <select disabled={isViewOnly} value={id || ""} onChange={e => {
                    const newIds = [...colaboradoresIds];
                    newIds[idx] = e.target.value || null;
                    setColaboradoresIds(newIds);
                    triggerPanel();
                  }} className="flex-1 bg-transparent border-none text-xs font-black text-gray-700 outline-none cursor-pointer">
                    <option value="">Vago...</option>
                    {baseUsers.map(u => {
                       const isSelected = colaboradoresIds.includes(u.id) && id !== u.id;
                       return <option key={u.id} value={u.id} disabled={isSelected}>{u.nome} ({u.jornadaPadrao}h) {isSelected ? '• Já selecionado' : ''}</option>
                    })}
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-orange-600 p-8 rounded-3xl text-white shadow-xl shadow-orange-100 flex flex-col justify-between overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Plane className="w-24 h-24 rotate-12" /></div>
          <div>
            <h4 className="font-black uppercase tracking-tighter text-2xl mb-1">Status</h4>
            <div className="flex items-center space-x-2">
               <span className="w-3 h-3 rounded-full bg-white animate-pulse"></span>
               <span className="font-bold text-orange-100 uppercase text-xs tracking-widest">{status}</span>
            </div>
          </div>
          <p className="text-xs font-medium text-orange-200 leading-relaxed mt-4">Certifique-se de validar todos os painéis de controle antes de finalizar o turno.</p>
        </div>
      </div>

      {/* 3º: ATIVIDADES OPERACIONAIS */}
      <section className="space-y-6">
        <h3 className="font-black text-gray-800 uppercase tracking-widest flex items-center space-x-2 text-sm px-2"><ClipboardList className="w-4 h-4 text-orange-500" /><span>Atividades do Turno</span></h3>
        {opCategories.map(cat => {
          const tasksInCategory = opTasks.filter(t => t.categoriaId === cat.id);
          if (tasksInCategory.length === 0) return null;
          return (
            <div key={cat.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
              <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                <h4 className="font-black text-gray-800 uppercase tracking-tight text-lg">{cat.nome}</h4>
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Sessão Operacional</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tasksInCategory.map(task => (
                  <div key={task.id} className="bg-gray-50 p-5 rounded-2xl flex items-center justify-between group hover:bg-white hover:shadow-lg hover:shadow-orange-100/10 border border-transparent hover:border-orange-50 transition-all">
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="font-black text-gray-700 text-sm truncate uppercase tracking-tight">{task.nome}</p>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                        {task.tipoMedida === MeasureType.QTD ? `Quantitativo • Fator ${minutesToHhmmss(task.fatorMultiplicador)}` : 'Duração Direta'}
                      </p>
                    </div>
                    {task.tipoMedida === MeasureType.QTD ? (
                      <input 
                        disabled={isViewOnly} type="number" value={tarefasValores[task.id] || ''} 
                        onChange={e => {setTarefasValores({...tarefasValores, [task.id]: e.target.value}); triggerPanel();}} 
                        className="w-24 bg-white p-3 rounded-xl text-center font-black text-orange-600 border border-gray-100 focus:border-orange-200 outline-none" placeholder="0" 
                      />
                    ) : (
                      <div className="w-32 bg-white p-1 rounded-xl border border-gray-100 focus-within:border-orange-200 transition-all">
                        <TimeInput disabled={isViewOnly} value={tarefasValores[task.id] || ''} onChange={val => {setTarefasValores({...tarefasValores, [task.id]: val}); triggerPanel();}} className="w-full bg-transparent p-2 text-orange-600 text-sm" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* 4º: PAINÉIS DE CONTROLE RESTAURADOS */}
      <section className="grid grid-cols-1 gap-12 pt-8">
        
        {/* LOCATIONS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-black text-gray-800 uppercase tracking-widest flex items-center space-x-2 text-sm"><Box className="w-4 h-4 text-orange-500" /><span>Controle de Locations</span></h3>
            {!isViewOnly && (
              <button onClick={() => setLocations([...locations, { id: Date.now().toString(), nomeLocation: '', quantidade: 0, dataMaisAntigo: '' }])} className="text-[10px] font-black text-orange-600 bg-orange-50 px-4 py-2 rounded-full uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all">
                + Nova Location
              </button>
            )}
          </div>
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b">
                  <th className="px-8 py-5">Location</th>
                  <th className="px-8 py-5 text-center">Quant.</th>
                  <th className="px-8 py-5">Data Mais Antigo</th>
                  <th className="px-8 py-5 text-center">Dias</th>
                  <th className="px-8 py-5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {locations.map(row => {
                  const days = getDaysDiff(row.dataMaisAntigo);
                  const colorClass = getCellColor(days, activeControls.find(c => c.tipo === 'locations')!.alertaConfig, 'direta');
                  return (
                    <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-5 font-bold text-gray-700">
                         <input disabled={isViewOnly || row.isPadrao} value={row.nomeLocation} onChange={e => updateRow(locations, setLocations, row.id, 'nomeLocation', e.target.value, 'locations')} className="bg-transparent border-none outline-none w-full" placeholder="Ex: GOL-01" />
                      </td>
                      <td className="px-8 py-5 text-center">
                        <input disabled={isViewOnly} type="number" value={row.quantidade} onChange={e => updateRow(locations, setLocations, row.id, 'quantidade', e.target.value, 'locations')} className="w-16 bg-gray-100 p-2 rounded-lg text-center font-bold" />
                      </td>
                      <td className="px-8 py-5">
                        <DatePickerField value={row.dataMaisAntigo} onChange={val => updateRow(locations, setLocations, row.id, 'dataMaisAntigo', val, 'locations', true)} disabled={isViewOnly} />
                      </td>
                      <td className="px-8 py-5 text-center">
                         <span className={`px-4 py-1.5 rounded-full font-black text-[10px] border ${colorClass}`}>{days} dias</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                         {!isViewOnly && !row.isPadrao && <button onClick={() => setLocations(locations.filter(i => i.id !== row.id))} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* TRÂNSITO */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-black text-gray-800 uppercase tracking-widest flex items-center space-x-2 text-sm"><Truck className="w-4 h-4 text-orange-500" /><span>Controle de Trânsito</span></h3>
            {!isViewOnly && (
              <button onClick={() => setTransit([...transit, { id: Date.now().toString(), nomeTransito: '', diasPadrao: 0, quantidade: 0, dataSaida: '' }])} className="text-[10px] font-black text-orange-600 bg-orange-50 px-4 py-2 rounded-full uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all">
                + Novo Trânsito
              </button>
            )}
          </div>
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b">
                  <th className="px-8 py-5">Tipo/Destino</th>
                  <th className="px-8 py-5 text-center">Quant.</th>
                  <th className="px-8 py-5">Data Saída</th>
                  <th className="px-8 py-5 text-center">TAT</th>
                  <th className="px-8 py-5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transit.map(row => {
                  const days = getDaysDiff(row.dataSaida);
                  const colorClass = getCellColor(days, activeControls.find(c => c.tipo === 'transito')!.alertaConfig, 'direta');
                  return (
                    <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-5 font-bold text-gray-700">
                         <input disabled={isViewOnly || row.isPadrao} value={row.nomeTransito} onChange={e => updateRow(transit, setTransit, row.id, 'nomeTransito', e.target.value, 'transito')} className="bg-transparent border-none outline-none w-full" placeholder="Ex: POA-GRU" />
                      </td>
                      <td className="px-8 py-5 text-center">
                        <input disabled={isViewOnly} type="number" value={row.quantidade} onChange={e => updateRow(transit, setTransit, row.id, 'quantidade', e.target.value, 'transito')} className="w-16 bg-gray-100 p-2 rounded-lg text-center font-bold" />
                      </td>
                      <td className="px-8 py-5">
                        <DatePickerField value={row.dataSaida} onChange={val => updateRow(transit, setTransit, row.id, 'dataSaida', val, 'transito', true)} disabled={isViewOnly} />
                      </td>
                      <td className="px-8 py-5 text-center">
                         <span className={`px-4 py-1.5 rounded-full font-black text-[10px] border ${colorClass}`}>{days} / {row.diasPadrao} d</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                         {!isViewOnly && !row.isPadrao && <button onClick={() => setTransit(transit.filter(i => i.id !== row.id))} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* SHELF LIFE */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-black text-gray-800 uppercase tracking-widest flex items-center space-x-2 text-sm"><FlaskConical className="w-4 h-4 text-orange-500" /><span>Shelf Life (Vencimentos)</span></h3>
            {!isViewOnly && (
              <button onClick={() => setShelfLife([...shelfLife, { id: Date.now().toString(), partNumber: '', lote: '', dataVencimento: '' }])} className="text-[10px] font-black text-orange-600 bg-orange-50 px-4 py-2 rounded-full uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all">
                + Novo Item
              </button>
            )}
          </div>
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b">
                  <th className="px-8 py-5">Part Number</th>
                  <th className="px-8 py-5">Lote</th>
                  <th className="px-8 py-5">Vencimento</th>
                  <th className="px-8 py-5 text-center">Restante</th>
                  <th className="px-8 py-5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {shelfLife.map(row => {
                  const days = getDaysRemaining(row.dataVencimento);
                  const colorClass = getCellColor(days, activeControls.find(c => c.tipo === 'shelf_life')!.alertaConfig, 'inversa');
                  return (
                    <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-5 font-bold text-gray-700 uppercase">
                         <input disabled={isViewOnly} value={row.partNumber} onChange={e => updateRow(shelfLife, setShelfLife, row.id, 'partNumber', e.target.value.toUpperCase(), 'shelf_life')} className="bg-transparent border-none outline-none w-full" placeholder="P/N..." />
                      </td>
                      <td className="px-8 py-5 font-bold text-gray-400">
                        <input disabled={isViewOnly} value={row.lote} onChange={e => updateRow(shelfLife, setShelfLife, row.id, 'lote', e.target.value, 'shelf_life')} className="bg-transparent border-none outline-none w-full text-xs" placeholder="Lote..." />
                      </td>
                      <td className="px-8 py-5">
                        <DatePickerField value={row.dataVencimento} onChange={val => updateRow(shelfLife, setShelfLife, row.id, 'dataVencimento', val, 'shelf_life', true)} disabled={isViewOnly} />
                      </td>
                      <td className="px-8 py-5 text-center">
                         <span className={`px-4 py-1.5 rounded-full font-black text-[10px] border ${colorClass}`}>{days} dias</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                         {!isViewOnly && <button onClick={() => setShelfLife(shelfLife.filter(i => i.id !== row.id))} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ITENS CRÍTICOS (SALDO) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-black text-gray-800 uppercase tracking-widest flex items-center space-x-2 text-sm"><AlertOctagon className="w-4 h-4 text-orange-500" /><span>Inventário de Críticos / Saldo</span></h3>
            {!isViewOnly && (
              <button onClick={() => setCritical([...critical, { id: Date.now().toString(), partNumber: '', lote: '', saldoSistema: 0, saldoFisico: 0 }])} className="text-[10px] font-black text-orange-600 bg-orange-50 px-4 py-2 rounded-full uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all">
                + Novo Saldo
              </button>
            )}
          </div>
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b">
                  <th className="px-8 py-5">P/N</th>
                  <th className="px-8 py-5">Lote</th>
                  <th className="px-8 py-5 text-center">Sistema</th>
                  <th className="px-8 py-5 text-center">Físico</th>
                  <th className="px-8 py-5 text-center">Diferença</th>
                  <th className="px-8 py-5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {critical.map(row => {
                  const diff = (Number(row.saldoSistema) || 0) - (Number(row.saldoFisico) || 0);
                  const colorClass = getCellColor(Math.abs(diff), activeControls.find(c => c.tipo === 'itens_criticos')!.alertaConfig, 'critica');
                  return (
                    <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-5 font-bold text-gray-700 uppercase">
                         <input disabled={isViewOnly || row.isPadrao} value={row.partNumber} onChange={e => updateRow(critical, setCritical, row.id, 'partNumber', e.target.value.toUpperCase(), 'itens_criticos')} className="bg-transparent border-none outline-none w-full" />
                      </td>
                      <td className="px-8 py-5">
                        <input disabled={isViewOnly} value={row.lote} onChange={e => updateRow(critical, setCritical, row.id, 'lote', e.target.value, 'itens_criticos')} className="bg-transparent border-none outline-none w-full text-xs font-bold" />
                      </td>
                      <td className="px-8 py-5 text-center">
                        <input disabled={isViewOnly} type="number" value={row.saldoSistema} onChange={e => updateRow(critical, setCritical, row.id, 'saldoSistema', e.target.value, 'itens_criticos', true)} className="w-16 bg-gray-100 p-2 rounded-lg text-center font-bold" />
                      </td>
                      <td className="px-8 py-5 text-center">
                        <input disabled={isViewOnly} type="number" value={row.saldoFisico} onChange={e => updateRow(critical, setCritical, row.id, 'saldoFisico', e.target.value, 'itens_criticos', true)} className="w-16 bg-gray-100 p-2 rounded-lg text-center font-bold" />
                      </td>
                      <td className="px-8 py-5 text-center">
                         <span className={`px-4 py-1.5 rounded-full font-black text-[10px] border ${colorClass}`}>{diff === 0 ? 'OK' : diff}</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                         {!isViewOnly && !row.isPadrao && <button onClick={() => setCritical(critical.filter(i => i.id !== row.id))} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 5º: EXTRAS E DIVERSOS */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h3 className="font-black text-gray-800 uppercase tracking-widest flex items-center space-x-2 text-sm"><Plus className="w-4 h-4 text-orange-500" /><span>Extras e Atividades Adicionais</span></h3>
          {!isViewOnly && <button onClick={() => setOutrasAtividades([...outrasAtividades, { id: Date.now().toString(), descricao: '', tempo: 0 }])} className="text-[10px] font-black text-orange-600 border border-orange-200 px-3 py-1 rounded-full uppercase hover:bg-orange-50">+ Adicionar</button>}
        </div>
        <div className="space-y-3">
          {outrasAtividades.map(atv => (
            <div key={atv.id} className="bg-white p-4 rounded-2xl border flex items-center space-x-4">
              <input disabled={isViewOnly} placeholder="Descreva a atividade..." value={atv.descricao} onChange={e => setOutrasAtividades(outrasAtividades.map(i => i.id === atv.id ? {...i, descricao: e.target.value} : i))} className="flex-1 text-sm font-bold text-gray-700 bg-transparent outline-none" />
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black text-gray-300 uppercase">Minutos:</span>
                <input disabled={isViewOnly} type="number" value={atv.tempo || ''} onChange={e => setOutrasAtividades(outrasAtividades.map(i => i.id === atv.id ? {...i, tempo: parseFloat(e.target.value) || 0} : i))} className="w-20 bg-gray-50 p-2 rounded-xl text-center font-black text-orange-600" />
              </div>
              {!isViewOnly && <button onClick={() => setOutrasAtividades(outrasAtividades.filter(i => i.id !== atv.id))} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>}
            </div>
          ))}
        </div>
      </section>

      {/* 6º: OBSERVAÇÕES */}
      <section className="space-y-4">
        <h3 className="font-black text-gray-800 uppercase tracking-widest flex items-center space-x-2 text-sm px-2"><Info className="w-4 h-4 text-orange-500" /><span>Informações Importantes / Observações</span></h3>
        <textarea 
          disabled={isViewOnly} value={obs} onChange={e => setObs(e.target.value)}
          className="w-full bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 min-h-[150px] font-medium text-gray-600 outline-none focus:border-orange-200 transition-all resize-none" 
          placeholder="Registre aqui ocorrências, atrasos, problemas técnicos ou qualquer informação relevante para o próximo turno..."
        />
      </section>

      {/* RODAPÉ E FINALIZAR */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center space-x-4 z-40">
        {!isViewOnly && (
          <button onClick={() => {
            if(confirm("Deseja finalizar esta passagem de serviço? Os dados não poderão mais ser alterados.")) setStatus('Finalizado');
          }} className="gol-orange text-white px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center space-x-3 border-2 border-orange-400">
            <CheckCircle className="w-6 h-6" /><span>Finalizar Passagem</span>
          </button>
        )}
      </div>
    </div>
  );
};

const KPICard: React.FC<{label: string, value: string, icon: any, subtext: string}> = ({ label, value, icon, subtext }) => (
  <div className="p-3 bg-gray-50/50 rounded-xl flex items-center space-x-3 border border-white hover:bg-white transition-all shadow-sm">
    <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-50">{icon}</div>
    <div className="min-w-0">
      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
      <h3 className="text-lg font-black text-gray-800 tracking-tight">{value}</h3>
      <p className="text-[7px] font-bold text-gray-400 uppercase truncate">{subtext}</p>
    </div>
  </div>
);

const InfoItem: React.FC<{label: string, value: string, icon: any}> = ({ label, value, icon }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{label}</label>
    <div className="flex items-center space-x-2 text-sm font-bold text-gray-800 bg-gray-50 p-3 rounded-xl">
      <div className="text-orange-500">{icon}</div><span>{value}</span>
    </div>
  </div>
);

const minutesToHHMMSS = (totalMinutes: number): string => {
  if (isNaN(totalMinutes) || totalMinutes < 0) return "00:00:00";
  const totalSeconds = Math.round(totalMinutes * 60);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

export default ShiftHandoverPage;
