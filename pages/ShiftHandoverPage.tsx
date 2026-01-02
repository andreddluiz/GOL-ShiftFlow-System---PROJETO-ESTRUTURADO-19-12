
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  CheckCircle, X, Plane, Save, RefreshCw, CloudCheck, Lock, 
  ChevronDown, Users, Clock, Activity, MessageSquare, BarChart3, Edit2
} from 'lucide-react';
import { Box, Typography, Chip, CircularProgress } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import { useAuth } from '../hooks/useAuth';
import { 
  MeasureType, OutraAtividade, 
  ShiftHandover
} from '../types';
import { DatePickerField, TimeInput, hhmmssToMinutes, minutesToHhmmss } from '../modals';
import { migrationService, saveDraft, loadSingleHandover } from '../services';

const ShiftHandoverPage: React.FC<{baseId?: string}> = ({ baseId }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('editId');
  
  const { user } = useAuth();
  const store = useStore();
  const pageContainerRef = useRef<HTMLDivElement>(null);

  const { 
    getControlesCombinados,
    bases, users, tasks: allTasks, categories: allCats, controls: allControls, 
    initialized, refreshData 
  } = store;
  
  const currentBase = useMemo(() => bases.find(b => b.id === baseId), [bases, baseId]);
  
  // Lista de usuários filtrada pela base atual
  const baseUsers = useMemo(() => {
    if (!baseId) return [];
    return users.filter(u => u.bases && u.bases.includes(baseId) && u.status === 'Ativo');
  }, [users, baseId]);
  
  const [status, setStatus] = useState<'Rascunho' | 'Finalizado'>('Rascunho');
  const [dataOperacional, setDataOperacional] = useState(new Date().toISOString().split('T')[0]);
  const [turnoAtivo, setTurnoAtivo] = useState('');
  const [colaboradoresIds, setColaboradoresIds] = useState<(string | null)[]>([null, null, null, null, null, null]);
  const [tarefasValores, setTarefasValores] = useState<Record<string, string>>({}); 
  const [obs, setObs] = useState('');
  const [nonRoutineTasks, setNonRoutineTasks] = useState<OutraAtividade[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [transit, setTransit] = useState<any[]>([]);
  const [shelfLife, setShelfLife] = useState<any[]>([]);
  const [critical, setCritical] = useState<any[]>([]);
  
  const [statusSalvamento, setStatusSalvamento] = useState<'idle' | 'salvando' | 'salvo'>('idle');

  // Carregar dados existentes do Firestore
  const loadExistingData = async () => {
    if (!baseId || !dataOperacional || !turnoAtivo) return;

    const shiftId = `${dataOperacional.replace(/\//g, '-')}_${turnoAtivo}`;
    try {
      const remoteData = await loadSingleHandover(baseId, shiftId) as any;
      
      if (remoteData) {
        setColaboradoresIds(remoteData.colaboradores || [null, null, null, null, null, null]);
        setTarefasValores(remoteData.tarefasExecutadas || remoteData.tarefas || {});
        setObs(remoteData.informacoesImportantes || remoteData.notas || "");
        setNonRoutineTasks(remoteData.nonRoutineTasks || []);
        
        if (remoteData.controles) {
          setShelfLife(remoteData.controles.shelfLife || []);
          setLocations(remoteData.controles.locations || []);
          setTransit(remoteData.controles.transit || []);
          setCritical(remoteData.controles.critical || []);
        }
        setStatus(remoteData.status || 'Rascunho');
      } else {
        resetCamposProducaoExceptTeam();
      }
    } catch (error) {
      console.error("[ShiftHandover Error] Erro ao carregar turno:", error);
    }
  };

  useEffect(() => {
    if (initialized && baseId && dataOperacional && turnoAtivo) {
      loadExistingData();
    }
  }, [baseId, dataOperacional, turnoAtivo, initialized]);

  const handleSave = async () => {
    if (!baseId || !dataOperacional || !turnoAtivo) {
      alert("Selecione Base, Data e Turno primeiro.");
      return;
    }

    const shiftId = `${dataOperacional.replace(/\//g, '-')}_${turnoAtivo}`;
    setStatusSalvamento('salvando');

    const shiftData: ShiftHandover = {
      id: shiftId,
      baseId,
      data: dataOperacional,
      turnoId: turnoAtivo,
      colaboradores: colaboradoresIds,
      tarefasExecutadas: tarefasValores,
      nonRoutineTasks,
      locationsData: locations,
      transitData: transit,
      shelfLifeData: shelfLife,
      criticalData: critical,
      informacoesImportantes: obs,
      status: 'Rascunho',
      performance: performance,
      CriadoEm: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await saveDraft(shiftData);
      setStatusSalvamento('salvo');
      setTimeout(() => setStatusSalvamento('idle'), 2000);
    } catch (error) {
      console.error("[Firestore Error]", error);
      setStatusSalvamento('idle');
      alert("Erro ao salvar rascunho.");
    }
  };

  const handleFinalize = async () => {
    if (!baseId || !dataOperacional || !turnoAtivo) return;
    if (!colaboradoresIds.some(id => id !== null)) {
      alert("Selecione a equipe do turno.");
      return;
    }
    if (!obs.trim()) {
      alert("As observações da base são obrigatórias.");
      return;
    }

    if (!window.confirm("Deseja FINALIZAR esta passagem?")) return;

    const shiftId = `${dataOperacional.replace(/\//g, '-')}_${turnoAtivo}`;
    const finalizedData: any = {
      id: shiftId,
      baseId,
      data: dataOperacional,
      turnoId: turnoAtivo,
      colaboradores: colaboradoresIds,
      tarefasExecutadas: tarefasValores,
      informacoesImportantes: obs,
      status: 'Finalizado',
      performance,
      finalizedAt: new Date().toISOString(),
      finalizedBy: user?.name || "Usuário Cloud",
      updatedAt: new Date().toISOString()
    };

    try {
      await saveDraft(finalizedData);
      await migrationService.processarMigracao(finalizedData, store, editId || undefined);
      alert("Passagem FINALIZADA com sucesso!");
      navigate('/reports');
    } catch (error) {
      alert("Erro ao finalizar.");
    }
  };

  const opCategories = useMemo(() => allCats.filter(c => c.tipo === 'operacional' && c.status === 'Ativa' && (!c.baseId || c.baseId === baseId)).sort((a,b) => a.ordem - b.ordem), [allCats, baseId]);
  const opTasks = useMemo(() => allTasks.filter(t => t.status === 'Ativa' && (!t.baseId || t.baseId === baseId)), [allTasks, baseId]);

  const { horasDisponiveis, horasProduzidas, performance } = useMemo(() => {
    const disp = colaboradoresIds.reduce((acc: number, id: string | null) => {
      if (!id) return acc;
      return acc + (users.find(u => u.id === id)?.jornadaPadrao || 6);
    }, 0);
    
    let prod = 0;
    Object.entries(tarefasValores).forEach(([taskId, val]) => {
      const task = opTasks.find(t => t.id === taskId);
      if (!task) return;
      prod += task.tipoMedida === MeasureType.TEMPO ? hhmmssToMinutes(val as string) / 60 : (parseFloat(val as string) || 0) * task.fatorMultiplicador / 60;
    });

    return { horasDisponiveis: disp, horasProduzidas: prod, performance: disp > 0 ? (prod / disp) * 100 : 0 };
  }, [colaboradoresIds, tarefasValores, users, opTasks]);

  const isFormLocked = !baseId || !dataOperacional || !turnoAtivo;
  const isViewOnly = status === 'Finalizado' && !editId;

  const resetCamposProducaoExceptTeam = () => {
    setTarefasValores({});
    setNonRoutineTasks([]);
    setObs('');
  };

  if (!user) return null;

  return (
    <div ref={pageContainerRef} className="max-w-full mx-auto space-y-8 animate-in fade-in pb-24 px-4">
      <header className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-6">
         <div className="flex items-center space-x-6">
            <div className="w-16 h-16 bg-orange-50 dark:bg-orange-950/30 rounded-2xl flex items-center justify-center text-orange-600 shadow-inner"><Plane className="w-8 h-8" /></div>
            <div>
               <h2 className="text-3xl font-black text-gray-800 dark:text-slate-100 tracking-tighter">Passagem de Serviço</h2>
               <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">{currentBase?.nome || 'Selecione uma Base'} — {dataOperacional}</p>
            </div>
         </div>
         <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
               {statusSalvamento === 'salvando' ? <RefreshCw className="w-3 h-3 animate-spin text-orange-500" /> : <CloudCheck className="w-3 h-3 text-green-500" />}
               <span>{statusSalvamento === 'salvando' ? 'Sincronizando...' : 'Cloud OK'}</span>
            </div>
            <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${status === 'Rascunho' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
              {status}
            </div>
         </div>
      </header>

      {!baseId ? (
        <Box sx={{ p: 10, textAlign: 'center', bgcolor: 'white', borderRadius: 8 }}>
          <Typography sx={{ fontWeight: 800, color: 'gray' }}>POR FAVOR, SELECIONE UMA BASE NO MENU LATERAL PARA CONTINUAR.</Typography>
        </Box>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <aside className="w-full lg:w-1/4 space-y-4 lg:sticky lg:top-6">
             <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-700 space-y-4">
                <h3 className="font-black text-gray-800 dark:text-slate-100 uppercase tracking-widest flex items-center space-x-2 text-[11px]"><BarChart3 size={14} className="text-orange-500" /> <span>Resumo Produtivo</span></h3>
                <div className="grid gap-2">
                   <div className="flex justify-between p-3 bg-gray-50 dark:bg-slate-900 rounded-xl">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Horas Disp.</span>
                      <span className="font-black text-sm">{minutesToHhmmss(horasDisponiveis * 60)}</span>
                   </div>
                   <div className="flex justify-between p-3 bg-gray-50 dark:bg-slate-900 rounded-xl">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Horas Prod.</span>
                      <span className="font-black text-sm text-orange-600">{minutesToHhmmss(horasProduzidas * 60)}</span>
                   </div>
                </div>
                <div className="pt-2">
                   <div className="flex justify-between items-center text-[9px] font-black uppercase text-gray-400 mb-1">
                     <span>Performance</span>
                     <span className="text-orange-600">{performance.toFixed(1)}%</span>
                   </div>
                   <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 transition-all duration-500" style={{ width: `${Math.min(performance, 100)}%` }} />
                   </div>
                </div>
             </div>

             <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-700 space-y-4">
                <h3 className="font-black text-gray-800 dark:text-slate-100 uppercase tracking-widest flex items-center space-x-2 text-[11px]"><MessageSquare size={14} className="text-orange-500" /> <span>Notas da Base</span></h3>
                <textarea 
                  disabled={isViewOnly || isFormLocked}
                  value={obs} 
                  onChange={e => setObs(e.target.value)}
                  placeholder="Relate intercorrências, AOGs ou pendências..."
                  className="w-full min-h-[150px] p-4 bg-gray-50 dark:bg-slate-900 border-none rounded-xl text-sm font-medium resize-none focus:ring-2 focus:ring-orange-100 outline-none"
                />
             </div>
          </aside>

          <div className="w-full lg:w-3/4 space-y-8">
             <section className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <DatePickerField label="Data do Turno" value={dataOperacional} onChange={setDataOperacional} disabled={isViewOnly} />
                  <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Turno Ativo</label>
                      <select disabled={isViewOnly} value={turnoAtivo} onChange={e => setTurnoAtivo(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-orange-100">
                         <option value="">Selecionar...</option>
                         {currentBase?.turnos.map(t => <option key={t.id} value={t.id}>Turno {t.numero} ({t.horaInicio}-{t.horaFim})</option>)}
                      </select>
                  </div>
                </div>
             </section>

             <section className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-slate-700 space-y-6">
                <h3 className="font-black text-gray-800 dark:text-slate-100 uppercase tracking-widest flex items-center space-x-2 text-sm"><Users size={16} className="text-orange-500" /> <span>Equipe Escalada</span></h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {colaboradoresIds.map((id, idx) => (
                      <select key={idx} disabled={isViewOnly || isFormLocked} value={id || ''} onChange={e => { const n = [...colaboradoresIds]; n[idx] = e.target.value || null; setColaboradoresIds(n); }} className="w-full p-4 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-2xl font-bold text-xs outline-none">
                         <option value="">Colaborador {idx+1}...</option>
                         {baseUsers.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                      </select>
                   ))}
                </div>
             </section>

             <div className={`space-y-8 transition-all ${isFormLocked ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                {opCategories.map(cat => (
                  <div key={cat.id} className="space-y-4">
                     <h3 className="px-4 text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center space-x-2"><ChevronDown size={14}/><span>{cat.nome}</span></h3>
                     <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden divide-y divide-gray-50 dark:divide-slate-700">
                        {opTasks.filter(t => t.categoriaId === cat.id).map(task => (
                          <div key={task.id} className="p-6 flex items-center justify-between hover:bg-orange-50/10 transition-colors">
                            <span className="text-sm font-black uppercase text-gray-700 dark:text-slate-200">{task.nome}</span>
                            {task.tipoMedida === MeasureType.TEMPO ? (
                              <TimeInput disabled={isViewOnly} value={tarefasValores[task.id] || ''} onChange={v => setTarefasValores({...tarefasValores, [task.id]: v})} className="w-32 p-3 bg-gray-50 dark:bg-slate-900 border-2 border-transparent rounded-xl font-black text-orange-600" />
                            ) : (
                              <input type="number" min="0" disabled={isViewOnly} value={tarefasValores[task.id] || ''} onChange={e => setTarefasValores({...tarefasValores, [task.id]: e.target.value})} placeholder="0" className="w-24 p-3 bg-gray-50 dark:bg-slate-900 border-2 border-transparent rounded-xl font-black text-center dark:text-white" />
                            )}
                          </div>
                        ))}
                     </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-8 right-8 z-50 flex items-center space-x-4">
        {!isViewOnly && (
          <>
            <button onClick={handleSave} className="bg-gray-800 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-black transition-all flex items-center space-x-3">
              {statusSalvamento === 'salvando' ? <RefreshCw className="animate-spin w-4 h-4" /> : <Save size={18} />}
              <span>Salvar</span>
            </button>
            <button onClick={handleFinalize} className="bg-[#FF5A00] text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center space-x-3">
              <CheckCircle size={18} />
              <span>Finalizar</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ShiftHandoverPage;
