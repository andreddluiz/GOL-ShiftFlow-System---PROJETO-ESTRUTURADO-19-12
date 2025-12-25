
import React, { useState, useMemo, useEffect } from 'react';
import { 
  CheckCircle, Trash2, Info, Users, Clock, AlertTriangle, ClipboardList,
  X, TrendingUp, Timer, MapPin, Box, Truck, FlaskConical, AlertOctagon, Plane, Settings,
  Calendar, UserCheck, Activity, BarChart3, MessageSquare, PlusCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import { 
  MeasureType, OutraAtividade, Control, 
  LocationRow, TransitRow, ShelfLifeRow, CriticalRow, AlertConfig, ManagedItem,
  User, Task, Category, ConditionConfig, ShiftHandover
} from '../types';
import { DatePickerField, TimeInput, hhmmssToMinutes, minutesToHhmmss, ConfirmModal } from '../modals';
import { validationService, migrationService } from '../services';

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
  return false;
};

const atendeCriterioVermelho = (vermelho: any, dias: number): boolean => {
  if (!vermelho || vermelho.habilitado === false) return false;
  const valor = Number(vermelho.valor);
  const op = vermelho.operador;
  if (op === '!=') return dias !== valor;
  if (op === '>=') return dias >= valor;
  if (op === '>') return dias > valor;
  if (op === '<=') return dias <= valor;
  return false;
};

const ShiftHandoverPage: React.FC<{baseId?: string}> = ({ baseId }) => {
  const store = useStore();
  const navigate = useNavigate();
  const { 
    getControlesCombinados, getDefaultLocations, getDefaultTransits, getDefaultCriticals, getDefaultShelfLifes,
    bases, users, tasks: allTasks, categories: allCats, controls: allControls, 
    initialized, refreshData 
  } = store;
  
  const currentBase = useMemo(() => bases.find(b => b.id === baseId), [bases, baseId]);
  const baseUsers = useMemo(() => users.filter(u => u.bases.includes(baseId || '') && u.status === 'Ativo'), [users, baseId]);
  
  useEffect(() => { refreshData(false); }, [baseId, refreshData]);

  const activeControls = useMemo(() => getControlesCombinados(baseId || ''), [getControlesCombinados, baseId, allControls]);

  // Estados da Passagem de Serviço
  const [status, setStatus] = useState<'Rascunho' | 'Finalizado'>('Rascunho');
  const [dataOperacional, setDataOperacional] = useState(new Date().toLocaleDateString('pt-BR'));
  const [turnoAtivo, setTurnoAtivo] = useState('');
  const [colaboradoresIds, setColaboradoresIds] = useState<(string | null)[]>([null, null, null, null, null, null]);
  const [tarefasValores, setTarefasValores] = useState<Record<string, string>>({}); 
  const [obs, setObs] = useState('');
  const [errosValidacao, setErrosValidacao] = useState<string[]>([]);
  
  const [outrasTarefas, setOutrasTarefas] = useState<OutraAtividade[]>([
    { id: 'nr1', nome: '', tempo: '' }, 
    { id: 'nr2', nome: '', tempo: '' }, 
    { id: 'nr3', nome: '', tempo: '' }
  ]);
  
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [transit, setTransit] = useState<TransitRow[]>([]);
  const [shelfLife, setShelfLife] = useState<ShelfLifeRow[]>([]);
  const [critical, setCritical] = useState<CriticalRow[]>([]);
  
  const [activeAlert, setActiveAlert] = useState<{titulo: string, mensagem: string, color: string} | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ open: boolean, title: string, message: string, onConfirm: () => void, onCancel?: () => void, type?: 'danger' | 'warning' | 'info', confirmLabel?: string, cancelLabel?: string }>({ open: false, title: '', message: '', onConfirm: () => {} });

  // Sincronização de Itens Padrão
  useEffect(() => {
    if (!initialized || !baseId) return;

    setLocations(prev => {
      const activeStoreItems = getDefaultLocations(baseId);
      const filtered = prev.filter(p => !p.isPadrao || activeStoreItems.some(i => i.id === p.id));
      const toAdd = activeStoreItems.filter(i => !prev.some(p => p.id === i.id));
      return [...filtered, ...toAdd.map(i => ({ id: i.id, nomeLocation: i.nomeLocation, quantidade: null, dataMaisAntigo: '', isPadrao: true, config: i }))];
    });

    setTransit(prev => {
      const activeStoreItems = getDefaultTransits(baseId);
      const filtered = prev.filter(p => !p.isPadrao || activeStoreItems.some(i => i.id === p.id));
      const toAdd = activeStoreItems.filter(i => !prev.some(p => p.id === i.id));
      return [...filtered, ...toAdd.map(i => ({ id: i.id, nomeTransito: i.nomeTransito, diasPadrao: i.diasPadrao, quantidade: null, dataSaida: '', isPadrao: true, config: i }))];
    });

    setCritical(prev => {
      const activeStoreItems = getDefaultCriticals(baseId);
      const filtered = prev.filter(p => !p.isPadrao || activeStoreItems.some(i => i.id === p.id));
      const toAdd = activeStoreItems.filter(i => !prev.some(p => p.id === i.id));
      return [...filtered, ...toAdd.map(i => ({ id: i.id, partNumber: i.partNumber, lote: '', saldoSistema: null, saldoFisico: null, isPadrao: true, config: i }))];
    });

    setShelfLife(prev => {
      const activeStoreItems = getDefaultShelfLifes(baseId);
      const filtered = prev.filter(p => !p.isPadrao || activeStoreItems.some(i => i.id === p.id));
      const toAdd = activeStoreItems.filter(i => !prev.some(p => p.id === i.id));
      return [...filtered, ...toAdd.map(i => ({ id: i.id, partNumber: i.partNumber, lote: '', dataVencimento: '', isPadrao: true, config: i }))];
    });
  }, [baseId, initialized, getDefaultLocations, getDefaultTransits, getDefaultCriticals, getDefaultShelfLifes]);

  const opCategories = useMemo(() => allCats.filter(c => c.tipo === 'operacional' && c.status === 'Ativa' && c.visivel !== false && (!c.baseId || c.baseId === baseId)).sort((a,b) => a.ordem - b.ordem), [allCats, baseId]);
  const opTasks = useMemo(() => allTasks.filter(t => t.status === 'Ativa' && t.visivel !== false && (!t.baseId || t.baseId === baseId)), [allTasks, baseId]);

  const { horasDisponiveis, horasProduzidas, performance } = useMemo(() => {
    const disp = colaboradoresIds.reduce((acc: number, id: string | null) => {
      if (!id) return acc;
      return acc + (baseUsers.find(u => u.id === id)?.jornadaPadrao || 0);
    }, 0);
    let prod = 0;
    Object.entries(tarefasValores).forEach(([taskId, val]) => {
      const task = opTasks.find(t => t.id === taskId);
      if (!task) return;
      prod += task.tipoMedida === MeasureType.TEMPO ? hhmmssToMinutes(val as string) / 60 : (parseFloat(val as string) || 0) * task.fatorMultiplicador / 60;
    });
    outrasTarefas.forEach(nr => { if (nr.tempo) prod += hhmmssToMinutes(nr.tempo) / 60; });
    return { horasDisponiveis: disp, horasProduzidas: prod, performance: disp > 0 ? (prod / disp) * 100 : 0 };
  }, [colaboradoresIds, tarefasValores, outrasTarefas, baseUsers, opTasks]);

  const performanceColor = useMemo(() => {
    const v = currentBase?.metaVerde || 80; const a = currentBase?.metaAmarelo || 50;
    if (performance >= v) return 'text-green-600';
    if (performance >= a) return 'text-yellow-600';
    return 'text-red-600';
  }, [performance, currentBase]);

  const performanceBg = useMemo(() => {
    const v = currentBase?.metaVerde || 80; const a = currentBase?.metaAmarelo || 50;
    if (performance >= v) return 'bg-green-500';
    if (performance >= a) return 'bg-yellow-500';
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
    
    if (atendeCriterioVerde(cores.verde, val)) {
       if (popups.verde.habilitado !== false) setActiveAlert({ titulo: popups.verde.titulo || 'OK', mensagem: popups.verde.mensagem.replace('X', String(val)), color: 'bg-green-600' });
    } else if (atendeCriterioAmarelo(cores.amarelo, val)) {
       if (popups.amarelo.habilitado !== false) setActiveAlert({ titulo: popups.amarelo.titulo || 'Atenção', mensagem: popups.amarelo.mensagem.replace('X', String(val)), color: 'bg-yellow-600' });
    } else if (atendeCriterioVermelho(cores.vermelho, val)) {
       if (popups.vermelho.habilitado !== false) setActiveAlert({ titulo: popups.vermelho.titulo || 'Crítico', mensagem: popups.vermelho.mensagem.replace('X', String(val)), color: 'bg-red-600' });
    }
  };

  const getRowStatusClasses = (item: any, val: number, controlType: string) => {
    const categoryConfig = activeControls.find(c => c.tipo === controlType);
    const itemConfig = item.config;
    const cores = (itemConfig?.cores?.vermelho) ? itemConfig.cores : categoryConfig?.cores;
    if (!cores) return '';
    if (atendeCriterioVermelho(cores.vermelho, val)) return 'bg-red-100 text-red-950 border-l-4 border-l-red-600 font-bold';
    if (atendeCriterioAmarelo(cores.amarelo, val)) return 'bg-yellow-100 text-yellow-950 border-l-4 border-l-yellow-500 font-bold';
    if (atendeCriterioVerde(cores.verde, val)) return 'bg-green-100 text-green-950 border-l-4 border-l-green-600 font-bold';
    return '';
  };

  const hasErr = (keyword: string) => errosValidacao.some(err => err.includes(keyword));

  const handleColaboradorChange = (idx: number, id: string | null) => {
    if (id && colaboradoresIds.some((cid, i) => cid === id && i !== idx)) {
      const nome = baseUsers.find(u => u.id === id)?.nome || 'Selecionado';
      setActiveAlert({
        titulo: 'COLABORADOR JÁ REGISTRADO',
        mensagem: `O colaborador '${nome}' já está registrado neste turno do dia ${dataOperacional}.`,
        color: 'bg-red-600'
      });
      return;
    }
    const n = [...colaboradoresIds];
    n[idx] = id;
    setColaboradoresIds(n);
  };

  /**
   * CORREÇÃO: Função de Limpeza Seletiva
   * Limpa apenas dados de produção, preservando controles e observações.
   */
  const resetCamposProducao = () => {
    console.debug("[Limpeza Seletiva] Iniciando limpeza de produtividade...");
    
    // 1. Limpar Equipe
    setColaboradoresIds([null, null, null, null, null, null]);
    
    // 2. Limpar Horas Produzidas
    setTarefasValores({});
    
    // 3. Reinicializar Outras Tarefas para 3 linhas vazias
    setOutrasTarefas([
      { id: 'nr1', nome: '', tempo: '' }, 
      { id: 'nr2', nome: '', tempo: '' }, 
      { id: 'nr3', nome: '', tempo: '' }
    ]);

    // 4. Voltar status e limpar erros
    setStatus('Rascunho');
    setErrosValidacao([]);

    // 5. Logs de Auditoria
    console.debug("[Limpeza Seletiva] Equipe, Atividades e Outras Tarefas limpas.");
    console.debug("[Limpeza Seletiva] PRESERVADOS: Observações e Controles Diários para continuidade operacional.");
  };

  const handleFinalize = async () => {
    const errosOutras: string[] = [];
    outrasTarefas.forEach(t => {
       if (t.nome.trim() !== '' && (!t.tempo || t.tempo === '00:00:00')) {
          errosOutras.push(`Outras Tarefas: O tempo para "${t.nome}" é obrigatório.`);
       }
    });

    const handoverData: ShiftHandover = {
      id: `sh_${Date.now()}`,
      baseId: baseId || '',
      data: dataOperacional,
      turnoId: turnoAtivo,
      colaboradores: colaboradoresIds,
      tarefasExecutadas: tarefasValores,
      nonRoutineTasks: outrasTarefas,
      locationsData: locations,
      transitData: transit,
      shelfLifeData: shelfLife,
      criticalData: critical,
      informacoesImportantes: obs,
      status: 'Finalizado',
      performance: performance,
      CriadoEm: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const validacao = validationService.validarPassagem(handoverData, opTasks);
    const todosErros = [...validacao.camposPendentes, ...errosOutras];

    if (todosErros.length > 0) {
      setErrosValidacao(todosErros);
      setActiveAlert({
        titulo: "Campos Pendentes",
        mensagem: "Existem campos obrigatórios não preenchidos:\n\n" + todosErros.join("\n"),
        color: "bg-red-600"
      });
      return;
    }

    const jaFinalizada = validationService.validarPassagemDuplicada(dataOperacional, turnoAtivo, baseId || '');
    if (jaFinalizada) {
      const turnoNum = currentBase?.turnos.find(t => t.id === turnoAtivo)?.numero || turnoAtivo;
      setActiveAlert({
        titulo: "PASSAGEM JÁ FINALIZADA",
        mensagem: `Já existe uma Passagem de Serviço finalizada para o dia ${dataOperacional} no Turno ${turnoNum}. Não é possível finalizar 2 vezes a mesma passagem.`,
        color: "bg-red-600"
      });
      return;
    }

    const duplicadosNoDia = validationService.verificarColaboradoresEmOutrosTurnos(dataOperacional, turnoAtivo, baseId || '', colaboradoresIds, baseUsers);
    if (duplicadosNoDia.length > 0) {
      setConfirmModal({
        open: true,
        title: 'ATENÇÃO - COLABORADOR DUPLICADO',
        message: `Os colaboradores '${duplicadosNoDia.join(', ')}' já estão registrados em outro turno do dia ${dataOperacional}. Tem certeza que quer considerar o mesmo colaborador em 2 turnos diferentes no mesmo dia?`,
        type: 'warning',
        onConfirm: () => proceedToMigrate(handoverData),
        confirmLabel: 'Sim, Continuar',
        cancelLabel: 'Não, Cancelar'
      });
      return;
    }

    proceedToMigrate(handoverData);
  };

  const proceedToMigrate = async (data: ShiftHandover) => {
    try {
      console.debug("[Finalização] Iniciando finalização da passagem");
      console.debug("[Finalização] Migrando dados para histórico...");
      await migrationService.processarMigracao(data, store);
      console.debug("[Finalização] Passagem salva com sucesso");
      
      setConfirmModal({
        open: true,
        title: 'Passagem Finalizada com Sucesso!',
        message: 'Seus dados foram migrados para Relatórios com sucesso.',
        type: 'info',
        confirmLabel: 'Retornar ao Início',
        cancelLabel: undefined, // Remove o segundo botão conforme solicitado
        onConfirm: () => {
          console.debug("[Finalização] Usuário clicou 'Retornar ao Início'");
          resetCamposProducao();
          setConfirmModal(prev => ({ ...prev, open: false }));
          console.debug("[Finalização] Passagem retornou ao status rascunho");
        }
      });
    } catch (error) {
      console.error("[Finalização] Erro ao finalizar:", error);
      setActiveAlert({ titulo: "Erro ao Finalizar", mensagem: "Ocorreu um erro ao finalizar a passagem. Tente novamente.", color: "bg-red-700" });
    }
  };

  const isViewOnly = status === 'Finalizado';

  return (
    <div className="max-w-full mx-auto space-y-8 animate-in fade-in relative px-4 md:px-8">
      {activeAlert && (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${activeAlert.color} text-white p-8 rounded-[2.5rem] shadow-2xl max-w-lg w-full border-4 border-white/20 text-center`}>
            <h4 className="text-2xl font-black uppercase mb-4">{activeAlert.titulo}</h4>
            <p className="font-bold mb-6 whitespace-pre-wrap">{activeAlert.mensagem}</p>
            <button onClick={() => setActiveAlert(null)} className="w-full bg-white text-gray-800 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-50">Fechar</button>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmModal.open} 
        onClose={() => { if(confirmModal.onCancel) confirmModal.onCancel(); setConfirmModal({ ...confirmModal, open: false }); }} 
        onConfirm={confirmModal.onConfirm} 
        title={confirmModal.title} 
        message={confirmModal.message} 
        type={confirmModal.type} 
        confirmLabel={confirmModal.confirmLabel}
        cancelLabel={confirmModal.cancelLabel}
      />

      <header className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
         <div className="flex items-center space-x-6">
            <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 shadow-inner"><Plane className="w-8 h-8" /></div>
            <div>
               <h2 className="text-3xl font-black text-gray-800 tracking-tighter">Passagem de Serviço</h2>
               <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">{currentBase?.nome} - {dataOperacional}</p>
            </div>
         </div>
         <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${status === 'Rascunho' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-green-50 text-green-600 border-green-100'}`}>Status: {status}</div>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <aside className="w-full lg:w-1/4 sticky top-6 z-20 space-y-4">
           <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 space-y-4">
              <h3 className="font-black text-gray-800 uppercase tracking-widest flex items-center space-x-2 text-[11px]"><BarChart3 size={14} className="text-orange-500" /> <span>Produção do Turno</span></h3>
              <div className="grid gap-2.5">
                 <KpiItem label="Horas Disp." value={minutesToHhmmss(horasDisponiveis * 60)} icon={<Clock size={14}/>} />
                 <KpiItem label="Horas Prod." value={minutesToHhmmss(horasProduzidas * 60)} icon={<Activity size={14}/>} />
              </div>
              <div className="pt-1">
                 <div className="flex justify-between items-center text-[9px] font-black uppercase text-gray-400 mb-1"><span>Performance</span><span className={performanceColor}>{performance.toFixed(1)}%</span></div>
                 <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-50 shadow-inner">
                    <div className={`h-full transition-all duration-1000 ${performanceBg}`} style={{ width: `${Math.min(performance, 100)}%` }} />
                 </div>
              </div>
           </div>
           <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-4">
              <h3 className="font-black text-gray-800 uppercase tracking-widest flex items-center space-x-2 text-sm"><MessageSquare size={16} className="text-orange-500" /> <span>Observações</span></h3>
              <textarea disabled={isViewOnly} value={obs} onChange={e => setObs(e.target.value)} placeholder="Intercorrências importantes..." className="w-full min-h-[250px] p-5 bg-gray-50 rounded-[2rem] border-transparent focus:bg-white focus:border-orange-100 outline-none font-medium text-sm resize-none" />
           </div>
        </aside>

        <div className="w-full lg:w-3/4 space-y-12">
           <section className={`bg-white p-8 rounded-[2.5rem] shadow-sm border transition-all ${hasErr('Configuração') ? 'border-red-500 bg-red-50' : 'border-gray-100'}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                <DatePickerField label="Data Operacional" value={dataOperacional} onChange={setDataOperacional} disabled={isViewOnly} />
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Turno</label>
                    <select disabled={isViewOnly} value={turnoAtivo} onChange={e => setTurnoAtivo(e.target.value)} className="w-full p-4 bg-gray-50 border-gray-100 border rounded-2xl font-bold text-sm focus:ring-2 focus:ring-orange-100 outline-none transition-all">
                       <option value="">Selecionar Turno...</option>
                       {currentBase?.turnos.map(t => <option key={t.id} value={t.id}>Turno {t.numero} ({t.horaInicio}-{t.horaFim})</option>)}
                    </select>
                </div>
              </div>
           </section>

           <section className={`bg-white p-8 rounded-[2.5rem] shadow-sm border transition-all space-y-6 ${hasErr('Equipe') ? 'border-red-500 bg-red-50' : 'border-gray-100'}`}>
              <h3 className="font-black text-gray-800 uppercase tracking-widest flex items-center space-x-2 text-sm"><Users size={16} className="text-orange-500" /> <span>Equipe no Turno</span></h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {colaboradoresIds.map((id, idx) => (
                    <select key={idx} disabled={isViewOnly} value={id || ''} onChange={e => handleColaboradorChange(idx, e.target.value || null)} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-xs">
                       <option value="">Colaborador {idx+1}...</option>
                       {baseUsers.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                    </select>
                 ))}
              </div>
           </section>

           <section className="space-y-12">
              <div className="px-4">
                <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">Controles Diários</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Gestão de itens críticos e conformidade técnica.</p>
              </div>

              <PanelContainer title="Shelf Life" icon={<FlaskConical size={16} className="text-orange-500" />} onAdd={() => setShelfLife([...shelfLife, { id: `m-${Date.now()}`, partNumber: '', lote: '', dataVencimento: '' }])} isViewOnly={isViewOnly}>
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest"><tr><th className="px-6 py-4">Part Number</th><th className="px-6 py-4">Lote</th><th className="px-6 py-4">Vencimento</th></tr></thead>
                  <tbody>
                    {shelfLife.map(row => (
                      <tr key={row.id} className={`border-t border-gray-50 ${getRowStatusClasses(row, getDaysRemaining(row.dataVencimento), 'shelf_life')} ${hasErr(row.partNumber) ? 'bg-red-50' : ''}`}>
                        <td className="px-6 py-4 font-bold uppercase"><input disabled={isViewOnly || row.isPadrao} className="bg-transparent w-full outline-none" value={row.partNumber} onChange={e => setShelfLife(shelfLife.map(l => l.id === row.id ? {...l, partNumber: e.target.value} : l))} /></td>
                        <td className="px-6 py-4 font-bold"><input disabled={isViewOnly} className="bg-transparent w-full outline-none" value={row.lote} onChange={e => setShelfLife(shelfLife.map(l => l.id === row.id ? {...l, lote: e.target.value} : l))} /></td>
                        <td className="px-6 py-4"><DatePickerField value={row.dataVencimento} onChange={v => { setShelfLife(shelfLife.map(l => l.id === row.id ? {...l, dataVencimento: v} : l)); evaluateAlert(row, getDaysRemaining(v), 'shelf_life'); }} disabled={isViewOnly} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </PanelContainer>

              <PanelContainer title="Locations" icon={<Box size={16} className="text-orange-500" />} onAdd={() => setLocations([...locations, { id: `m-${Date.now()}`, nomeLocation: '', quantidade: null, dataMaisAntigo: '' }])} isViewOnly={isViewOnly}>
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest"><tr><th className="px-6 py-4">Location</th><th className="px-6 py-4">Quantidade</th><th className="px-6 py-4">Mais Antigo</th></tr></thead>
                  <tbody>
                    {locations.map(row => (
                      <tr key={row.id} className={`border-t border-gray-50 ${getRowStatusClasses(row, getDaysDiff(row.dataMaisAntigo), 'locations')} ${hasErr(row.nomeLocation) ? 'bg-red-50' : ''}`}>
                        <td className="px-6 py-4 font-bold uppercase"><input disabled={isViewOnly || row.isPadrao} className="bg-transparent w-full outline-none" value={row.nomeLocation} onChange={e => setLocations(locations.map(l => l.id === row.id ? {...l, nomeLocation: e.target.value} : l))} /></td>
                        <td className="px-6 py-4"><input type="number" disabled={isViewOnly} className="w-20 p-2 rounded-xl font-black text-center bg-gray-50" value={row.quantidade ?? ''} onChange={e => setLocations(locations.map(l => l.id === row.id ? {...l, quantidade: e.target.value === '' ? null : Number(e.target.value)} : l))} /></td>
                        <td className="px-6 py-4"><DatePickerField disabled={isViewOnly || row.quantidade === 0 || row.quantidade === null} value={row.dataMaisAntigo} onChange={v => { setLocations(locations.map(l => l.id === row.id ? {...l, dataMaisAntigo: v} : l)); evaluateAlert(row, getDaysDiff(v), 'locations'); }} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </PanelContainer>

              <PanelContainer title="Trânsito" icon={<Truck size={16} className="text-orange-500" />} onAdd={() => setTransit([...transit, { id: `m-${Date.now()}`, nomeTransito: '', diasPadrao: 0, quantidade: null, dataSaida: '' }])} isViewOnly={isViewOnly}>
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest"><tr><th className="px-6 py-4">Tipo</th><th className="px-6 py-4">Quantidade</th><th className="px-6 py-4">Data Saída</th></tr></thead>
                  <tbody>
                    {transit.map(row => (
                      <tr key={row.id} className={`border-t border-gray-50 ${getRowStatusClasses(row, getDaysDiff(row.dataSaida), 'transito')} ${hasErr(row.nomeTransito) ? 'bg-red-50' : ''}`}>
                        <td className="px-6 py-4 font-bold uppercase"><input disabled={isViewOnly || row.isPadrao} className="bg-transparent w-full outline-none" value={row.nomeTransito} onChange={e => setTransit(transit.map(l => l.id === row.id ? {...l, nomeTransito: e.target.value} : l))} /></td>
                        <td className="px-6 py-4"><input type="number" disabled={isViewOnly} className="w-20 p-2 rounded-xl font-black text-center bg-gray-50" value={row.quantidade ?? ''} onChange={e => setTransit(transit.map(l => l.id === row.id ? {...l, quantidade: e.target.value === '' ? null : Number(e.target.value)} : l))} /></td>
                        <td className="px-6 py-4"><DatePickerField disabled={isViewOnly || row.quantidade === 0 || row.quantidade === null} value={row.dataSaida} onChange={v => { setTransit(transit.map(l => l.id === row.id ? {...l, dataSaida: v} : l)); evaluateAlert(row, getDaysDiff(v), 'transito'); }} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </PanelContainer>

              <PanelContainer title="Saldo Crítico" icon={<AlertOctagon size={16} className="text-orange-500" />} onAdd={() => setCritical([...critical, { id: `m-${Date.now()}`, partNumber: '', lote: '', saldoSistema: null, saldoFisico: null }])} isViewOnly={isViewOnly}>
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest"><tr><th className="px-6 py-4">PN</th><th className="px-6 py-4 text-center">Sistema</th><th className="px-6 py-4 text-center">Físico</th><th className="px-6 py-4 text-center">Diferença</th></tr></thead>
                  <tbody>
                    {critical.map(row => {
                      const diff = Math.abs((row.saldoSistema||0) - (row.saldoFisico||0));
                      return (
                        <tr key={row.id} className={`border-t border-gray-50 ${getRowStatusClasses(row, diff, 'itens_criticos')} ${hasErr(row.partNumber) ? 'bg-red-50' : ''}`}>
                          <td className="px-6 py-4 font-bold uppercase"><input disabled={isViewOnly || row.isPadrao} className="bg-transparent w-full outline-none" value={row.partNumber} onChange={e => setCritical(critical.map(c => c.id === row.id ? {...c, partNumber: e.target.value} : c))} /></td>
                          <td className="px-6 py-4 text-center"><input type="number" disabled={isViewOnly} className="w-16 p-2 rounded-xl font-black text-center bg-white/50" value={row.saldoSistema ?? ''} onChange={e => setCritical(critical.map(c => c.id === row.id ? {...c, saldoSistema: e.target.value === '' ? null : Number(e.target.value)} : c))} /></td>
                          <td className="px-6 py-4 text-center">
                            <input 
                              type="number" 
                              disabled={isViewOnly} 
                              className="w-16 p-2 rounded-xl font-black text-center bg-white/50" 
                              value={row.saldoFisico ?? ''} 
                              onChange={e => setCritical(critical.map(c => c.id === row.id ? {...c, saldoFisico: e.target.value === '' ? null : Number(e.target.value)} : c))}
                              onBlur={() => evaluateAlert(row, Math.abs((row.saldoSistema||0) - (row.saldoFisico||0)), 'itens_criticos')}
                            />
                          </td>
                          <td className="px-6 py-4 text-center font-black">{(row.saldoSistema||0) - (row.saldoFisico||0)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </PanelContainer>
           </section>

           <section className="space-y-6 pb-12">
              <h3 className="font-black text-gray-800 uppercase tracking-widest flex items-center space-x-2 text-sm"><Activity size={16} className="text-orange-500" /> <span>Processos Operacionais</span></h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                 {opCategories.map(cat => (
                    <div key={cat.id} className="space-y-6">
                       <h3 className="px-4 text-xl font-black text-gray-800 uppercase tracking-tight flex items-center space-x-3"><div className="w-1.5 h-6 bg-orange-600 rounded-full" /><span>{cat.nome}</span></h3>
                       <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
                          {opTasks.filter(t => t.categoriaId === cat.id).map(task => (
                             <div key={task.id} className={`p-6 flex items-center justify-between hover:bg-orange-50/10 transition-colors ${hasErr(task.nome) ? 'bg-red-50' : ''}`}>
                                <div className="flex flex-col"><span className="text-sm font-black text-gray-700 uppercase">{task.nome}</span><span className="text-[10px] font-bold text-gray-300 uppercase">{task.tipoMedida}</span></div>
                                {task.tipoMedida === MeasureType.TEMPO ? (
                                  <TimeInput disabled={isViewOnly} value={tarefasValores[task.id] || ''} onChange={v => setTarefasValores({...tarefasValores, [task.id]: v})} className="w-32 p-4 bg-gray-50 border-transparent rounded-2xl font-black text-center text-orange-600" />
                                ) : (
                                  <input type="number" disabled={isViewOnly} value={tarefasValores[task.id] || ''} onChange={e => setTarefasValores({...tarefasValores, [task.id]: e.target.value})} placeholder="0" className="w-24 p-4 bg-gray-50 border-transparent rounded-2xl font-black text-center" />
                                )}
                             </div>
                          ))}
                       </div>
                    </div>
                 ))}

                 <div className="space-y-6 lg:col-span-2">
                    <h3 className="px-4 text-xl font-black text-gray-800 uppercase tracking-tight flex items-center space-x-3"><div className="w-1.5 h-6 bg-orange-600 rounded-full" /><span>Outras Tarefas</span></h3>
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
                        {outrasTarefas.map((nr, idx) => {
                           const isTempoVisivel = nr.nome.trim() !== '';
                           const isTempoPendente = isTempoVisivel && (!nr.tempo || nr.tempo === '00:00:00');
                           
                           return (
                             <div key={nr.id} className={`p-6 flex flex-col md:flex-row items-center gap-4 hover:bg-gray-50/50 transition-colors ${isTempoPendente ? 'bg-red-50/30' : ''}`}>
                                <div className="flex-1 w-full">
                                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Nome da Atividade Customizada</label>
                                  <input 
                                    disabled={isViewOnly}
                                    value={nr.nome}
                                    onChange={e => setOutrasTarefas(outrasTarefas.map(item => item.id === nr.id ? {...item, nome: e.target.value} : item))}
                                    placeholder="Descreva a atividade..."
                                    className="w-full p-4 bg-gray-50 border-transparent rounded-2xl font-bold text-sm outline-none focus:bg-white focus:border-orange-100 transition-all"
                                  />
                                </div>
                                
                                {isTempoVisivel && (
                                  <div className="w-full md:w-auto animate-in fade-in slide-in-from-right-2">
                                    <label className={`text-[9px] font-black uppercase tracking-widest mb-1 block ${isTempoPendente ? 'text-red-500' : 'text-gray-400'}`}>
                                      Tempo HH:MM:SS {isTempoPendente && '(Obrigatório)'}
                                    </label>
                                    <TimeInput 
                                      disabled={isViewOnly}
                                      value={nr.tempo}
                                      onChange={v => setOutrasTarefas(outrasTarefas.map(item => item.id === nr.id ? {...item, tempo: v} : item))}
                                      className={`w-40 p-4 rounded-2xl font-black text-center transition-all ${isTempoPendente ? 'bg-red-50 border-2 border-red-500 text-red-600' : 'bg-gray-50 border-transparent text-orange-600'}`}
                                    />
                                  </div>
                                )}
                                
                                {!isViewOnly && idx >= 3 && (
                                  <button onClick={() => setOutrasTarefas(outrasTarefas.filter(item => item.id !== nr.id))} className="mt-5 p-3 text-gray-300 hover:text-red-500 bg-gray-100 rounded-xl"><Trash2 size={18}/></button>
                                )}
                             </div>
                           );
                        })}
                        {!isViewOnly && (
                          <div className="p-4 bg-gray-50/30 flex justify-center">
                            <button 
                              onClick={() => setOutrasTarefas([...outrasTarefas, { id: `nr-${Date.now()}`, nome: '', tempo: '' }])}
                              className="flex items-center space-x-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-orange-600 transition-colors"
                            >
                              <PlusCircle size={16} /> <span>Adicionar Linha</span>
                            </button>
                          </div>
                        )}
                    </div>
                 </div>
              </div>
           </section>
        </div>
      </div>

      {!isViewOnly && (
        <div className="fixed bottom-8 right-8 z-40">
          <button onClick={handleFinalize} className="bg-orange-600 text-white px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center space-x-3 border-4 border-white"><CheckCircle size={20} /><span>Finalizar Passagem de Serviço</span></button>
        </div>
      )}
    </div>
  );
};

const KpiItem: React.FC<{label: string, value: string, icon: any}> = ({label, value, icon}) => (
  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col items-center">
     <div className="flex items-center space-x-2 text-gray-400">{icon}<span className="text-[9px] font-black uppercase tracking-widest">{label}</span></div>
     <span className="text-base font-black text-gray-800">{value}</span>
  </div>
);

const PanelContainer: React.FC<{title: string, icon: any, children: any, onAdd: any, isViewOnly: boolean}> = ({ title, icon, children, onAdd, isViewOnly }) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center px-4">
      <h3 className="font-black text-gray-800 uppercase tracking-widest flex items-center space-x-3 text-sm"><div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">{icon}</div><span>{title}</span></h3>
      {!isViewOnly && <button onClick={onAdd} className="text-[10px] font-black text-orange-600 bg-orange-50 px-5 py-2.5 rounded-2xl uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all">+ Adicionar</button>}
    </div>
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">{children}</div>
  </div>
);

export default ShiftHandoverPage;
