
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

// Utilitários de Data com checagem de tipo para evitar erro de split
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

// Funções auxiliares de comparação de critérios corrigidas para incluir 'Diferente de' (!=)
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
  
  // CORREÇÃO: Implementação explícita do Diferente de (!=)
  if (op === '!=') {
     const res = dias !== valor;
     console.debug(`[Regra Vermelho] Comparando Diferente: ${dias} !== ${valor}? ${res}`);
     return res;
  }
  
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
    defaultLocations: storeLocs, 
    defaultTransits: storeTrans, 
    defaultCriticals: storeCrit, 
    defaultShelfLifes: storeShelf,
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

  // Sincronização e Preenchimento Mínimo
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
      
      let newList = [...filtered, ...toAdd.map(i => ({ 
        id: i.id, 
        partNumber: i.partNumber, 
        lote: i.lote || '', 
        dataVencimento: i.dataVencimento || '', 
        isPadrao: true, 
        config: i 
      }))];

      // GARANTIR MÍNIMO DE 3 LINHAS TOTAIS
      while (newList.length < 3) {
        newList.push({ 
          id: `manual-${Date.now()}-${newList.length}`, 
          partNumber: '', 
          lote: '', 
          dataVencimento: '', 
          isPadrao: false 
        });
      }

      return newList;
    });
  }, [baseId, initialized, storeLocs, storeTrans, storeCrit, storeShelf, getDefaultLocations, getDefaultTransits, getDefaultCriticals, getDefaultShelfLifes]);

  // Lógica de Categorias e Tarefas Operacionais
  const opCategories = useMemo(() => {
    return allCats.filter(c => c.tipo === 'operacional' && c.status === 'Ativa' && (c.visivel !== false) && (!c.baseId || c.baseId === baseId)).sort((a,b) => a.ordem - b.ordem);
  }, [allCats, baseId]);

  const opTasks = useMemo(() => {
    return allTasks.filter(t => t.status === 'Ativa' && (t.visivel !== false) && (!t.baseId || t.baseId === baseId));
  }, [allTasks, baseId]);

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

  /**
   * CORREÇÃO CRÍTICA: Lógica de buscar e exibir o pop-up correto baseado na cor determinada.
   * Suporte completo para o operador 'Diferente de' (!=).
   */
  const evaluateAlert = (item: any, value: any, controlType: string) => {
    if (value === undefined || value === null || value === '') return;

    const categoryConfig = activeControls.find((c: any) => c.tipo === controlType);
    const itemConfig = item.config;

    // Prioridade de Dados: Item Personalizado > Categoria Padrão
    const cores = (itemConfig?.cores && itemConfig.cores.vermelho) ? itemConfig.cores : categoryConfig?.cores;
    const popups = (itemConfig?.popups && itemConfig.popups.vermelho) ? itemConfig.popups : categoryConfig?.popups;

    if (!cores || !popups) return;

    const dias = Number(value);
    console.debug(`[Alerta Debug] Avaliando ${controlType} com valor ${dias}.`);
    
    // Pequeno atraso para garantir que o UI de seleção de data fechou (se for o caso)
    setTimeout(() => {
        // 1. VERIFICA VERDE
        if (atendeCriterioVerde(cores.verde, dias)) {
           console.log(`Cor determinada: VERDE para o valor ${dias} (Operador: ${cores.verde.operador}, Alvo: ${cores.verde.valor})`);
           if (popups.verde.habilitado !== false) {
              setActiveAlert({ 
                titulo: popups.verde.titulo || 'Tudo OK', 
                mensagem: popups.verde.mensagem.replace('X', String(dias)), 
                color: 'bg-green-600' 
              });
           }
           return;
        }
        
        // 2. VERIFICA AMARELO
        if (atendeCriterioAmarelo(cores.amarelo, dias)) {
           console.log(`Cor determinada: AMARELO para o valor ${dias} (Operador: ${cores.amarelo.operador}, Alvo: ${cores.amarelo.valor})`);
           if (popups.amarelo.habilitado !== false) {
              setActiveAlert({ 
                titulo: popups.amarelo.titulo || 'Atenção', 
                mensagem: popups.amarelo.mensagem.replace('X', String(dias)), 
                color: 'bg-yellow-600' 
              });
           }
           return;
        }
        
        // 3. VERIFICA VERMELHO
        if (atendeCriterioVermelho(cores.vermelho, dias)) {
           console.log(`Cor determinada: VERMELHO para o valor ${dias} (Operador: ${cores.vermelho.operador}, Alvo: ${cores.vermelho.valor})`);
           if (popups.vermelho.habilitado !== false) {
              setActiveAlert({ 
                titulo: popups.vermelho.titulo || 'Critical', 
                mensagem: popups.vermelho.mensagem.replace('X', String(dias)), 
                color: 'bg-red-600' 
              });
           }
           return;
        }
    }, 150);
  };

  const updateRow = (list: any[], setList: Function, id: string, field: string, value: any) => {
    setList(list.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleTaskChange = (taskId: string, value: string) => {
    setTarefasValores(prev => ({ ...prev, [taskId]: value }));
  };

  const handleBlur = (item: any, controlType: string, value: any) => {
     if (value === '' || value === undefined || value === null) return;
     
     let calcVal = value;
     
     // Cálculos automáticos baseados no tipo de controle
     if (controlType === 'locations' || controlType === 'transito') {
        calcVal = getDaysDiff(value);
     } else if (controlType === 'shelf_life') {
        calcVal = getDaysRemaining(value);
     } else if (controlType === 'itens_criticos') {
        const row = critical.find(c => c.id === item.id);
        calcVal = Math.abs((row?.saldoSistema || 0) - (row?.saldoFisico || 0));
     } else if (controlType === 'tarefa' && typeof value === 'string') {
        calcVal = Number(value);
     }
     
     evaluateAlert(item, calcVal, controlType);
  };

  const getItemStatusColor = (item: any, val: number, controlType: string) => {
    // Para linhas manuais sem dados, não aplica cor
    if (!item.isPadrao && !item.partNumber && !item.dataVencimento && !item.nomeLocation && !item.nomeTransito) return 'text-gray-400';
    if (val === undefined || val === null || isNaN(val)) return 'text-gray-400';

    const categoryConfig = activeControls.find((c: any) => c.tipo === controlType);
    const itemConfig = item.config;
    
    // Prioridade de Dados: Item Personalizado > Categoria Padrão
    const effectiveCores = (itemConfig?.cores && itemConfig.cores.vermelho) ? itemConfig.cores : categoryConfig?.cores;

    if (!effectiveCores) return 'text-gray-400';

    // A cor da tabela mantém a prioridade de gravidade para sinalização visual
    // ORDEM DE PRIORIDADE VISUAL: VERMELHO -> AMARELO -> VERDE
    if (atendeCriterioVermelho(effectiveCores.vermelho, val)) return 'text-red-600 font-black';
    if (atendeCriterioAmarelo(effectiveCores.amarelo, val)) return 'text-yellow-600 font-black';
    if (atendeCriterioVerde(effectiveCores.verde, val)) return 'text-green-600 font-black';
    return 'text-gray-400';
  };

  const isViewOnly = status === 'Finalizado';

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-32 animate-in fade-in relative">
      {activeAlert && (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${activeAlert.color} text-white p-8 rounded-[2.5rem] shadow-2xl max-sm w-full animate-in zoom-in-95 border-4 border-white/20`}>
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

      <ConfirmModal 
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ ...confirmModal, open: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />

      <header className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
         <div className="flex items-center space-x-6">
            <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 shadow-inner">
               <Plane className="w-8 h-8" />
            </div>
            <div>
               <h2 className="text-3xl font-black text-gray-800 tracking-tighter">Passagem de Serviço</h2>
               <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">{currentBase?.nome} - {dataOperacional}</p>
            </div>
         </div>
         <div className="flex space-x-2">
            <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${status === 'Rascunho' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
               Status: {status}
            </div>
         </div>
      </header>

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
                    onChange={e => {
                      const id = e.target.value || null;
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
                    }}
                    className={`w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none transition-all text-xs ${colId ? 'text-gray-800 bg-white shadow-sm border-orange-100' : 'text-gray-400'}`}
                  >
                     <option value="">Livre...</option>
                     {baseUsers.map(u => {
                        const baseSigla = bases.find(b => u.bases.includes(b.id))?.sigla || '?';
                        return <option key={u.id} value={u.id}>{u.nome} - {baseSigla} - {u.jornadaPadrao}h</option>;
                     })}
                  </select>
               </div>
            ))}
         </div>
      </section>

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

      <section className="grid grid-cols-1 gap-12">
        <PanelContainer title="Locations" icon={<Box className="w-4 h-4 text-orange-500" />} onAdd={() => setLocations([...locations, { id: `manual-${Date.now()}`, nomeLocation: '', quantidade: 0, dataMaisAntigo: '' }])} isViewOnly={isViewOnly}>
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
                      <DatePickerField 
                        value={row.dataMaisAntigo} 
                        onChange={v => {
                          updateRow(locations, setLocations, row.id, 'dataMaisAntigo', v);
                          handleBlur(row, 'locations', v); // Disparo imediato no onChange
                        }} 
                      />
                      {row.dataMaisAntigo && <span className={`text-xs ${getItemStatusColor(row, days, 'locations')}`}>{days}d</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </PanelContainer>

        <PanelContainer title="Trânsito" icon={<Truck className="w-4 h-4 text-orange-500" />} onAdd={() => setTransit([...transit, { id: `manual-${Date.now()}`, nomeTransito: '', diasPadrao: 0, quantidade: 0, dataSaida: '' }])} isViewOnly={isViewOnly}>
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
                      <DatePickerField 
                        value={row.dataSaida} 
                        onChange={v => {
                          updateRow(transit, setTransit, row.id, 'dataSaida', v);
                          handleBlur(row, 'transito', v); // Disparo imediato no onChange
                        }} 
                      />
                      {row.dataSaida && <span className={`text-xs ${getItemStatusColor(row, days, 'transito')}`}>{days}d</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </PanelContainer>

        <PanelContainer title="Shelf Life" icon={<FlaskConical className="w-4 h-4 text-orange-500" />} onAdd={() => setShelfLife([...shelfLife, { id: `manual-${Date.now()}`, partNumber: '', lote: '', dataVencimento: '', isPadrao: false }])} isViewOnly={isViewOnly}>
          <table className="w-full text-left">
            <thead><tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest"><th className="px-8 py-4">P/N</th><th className="px-8 py-4">Lote</th><th className="px-8 py-4">Vencimento (Auto)</th></tr></thead>
            <tbody>
              {shelfLife.map(row => {
                const days = row.dataVencimento ? getDaysRemaining(row.dataVencimento) : 0;
                return (
                  <tr key={row.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-4 font-bold">
                      <input disabled={isViewOnly || row.isPadrao} className="bg-transparent w-full outline-none uppercase placeholder:text-gray-200" placeholder="P/N..." value={row.partNumber} onChange={e => updateRow(shelfLife, setShelfLife, row.id, 'partNumber', e.target.value)} />
                    </td>
                    <td className="px-8 py-4">
                      <input disabled={isViewOnly} className="w-full bg-gray-50 p-2 rounded-xl font-black placeholder:text-gray-300" placeholder="Lote..." value={row.lote} onChange={e => updateRow(shelfLife, setShelfLife, row.id, 'lote', e.target.value)} />
                    </td>
                    <td className="px-8 py-4 flex items-center space-x-4">
                      <DatePickerField 
                        value={row.dataVencimento} 
                        onChange={v => {
                          updateRow(shelfLife, setShelfLife, row.id, 'dataVencimento', v);
                          handleBlur(row, 'shelf_life', v); // Disparo imediato no onChange
                        }} 
                      />
                      {(row.dataVencimento || row.partNumber) && <span className={`text-xs ${getItemStatusColor(row, days, 'shelf_life')}`}>{days}d</span>}
                      {!row.isPadrao && !isViewOnly && <button onClick={() => setShelfLife(shelfLife.filter(r => r.id !== row.id))} className="p-1 text-gray-200 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </PanelContainer>

        <PanelContainer title="Itens Críticos" icon={<AlertOctagon className="w-4 h-4 text-orange-500" />} onAdd={() => setCritical([...critical, { id: `manual-${Date.now()}`, partNumber: '', lote: '', saldoSistema: 0, saldoFisico: 0 }])} isViewOnly={isViewOnly}>
          <table className="w-full text-left">
            <thead><tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest"><th className="px-8 py-4">P/N</th><th className="px-8 py-4">Sis.</th><th className="px-8 py-4">Fís.</th><th className="px-8 py-4">Dif.</th></tr></thead>
            <tbody>
              {critical.map(row => {
                const diff = (row.saldoSistema || 0) - (row.saldoFisico || 0);
                const absDiff = Math.abs(diff);
                return (
                  <tr key={row.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-4 font-bold"><input disabled={isViewOnly || row.isPadrao} className="bg-transparent w-full outline-none uppercase" value={row.partNumber} onChange={e => updateRow(critical, setCritical, row.id, 'partNumber', e.target.value)} /></td>
                    <td className="px-8 py-4"><input type="number" disabled={isViewOnly} className="w-16 bg-gray-50 p-2 rounded-xl font-black text-center" value={row.saldoSistema} onChange={e => updateRow(critical, setCritical, row.id, 'saldoSistema', e.target.value)} /></td>
                    <td className="px-8 py-4"><input type="number" disabled={isViewOnly} className="w-16 bg-gray-50 p-2 rounded-xl font-black text-center" value={row.saldoFisico} onChange={e => updateRow(critical, setCritical, row.id, 'saldoFisico', e.target.value)} onBlur={() => handleBlur(row, 'itens_criticos', absDiff)} /></td>
                    <td className={`px-8 py-4 font-black ${getItemStatusColor(row, absDiff, 'itens_criticos')}`}>{diff}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </PanelContainer>
      </section>

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

      {!isViewOnly && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
          <button onClick={() => setConfirmModal({ open: true, title: 'Finalizar Turno', message: 'Deseja finalizar esta passagem de serviço? Os dados serão arquivados e travados para edição posterior.', type: 'warning', onConfirm: () => { setStatus('Finalizado'); window.scrollTo({ top: 0, behavior: 'smooth' }); } })} className="bg-orange-600 text-white px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-orange-200 hover:scale-105 transition-all flex items-center space-x-3">
            <CheckCircle className="w-5 h-5" />
            <span>Finalizar Turno</span>
          </button>
        </div>
      )}
    </div>
  );
};

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
