
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  CheckCircle, Trash2, Info, Users, Clock, AlertTriangle, ClipboardList,
  X, TrendingUp, Timer, MapPin, Box as BoxIcon, Truck, FlaskConical, AlertOctagon, Plane, Settings,
  Calendar, UserCheck, Activity, BarChart3, MessageSquare, PlusCircle,
  Edit2, Hash, ChevronDown, CloudCheck, RefreshCw, Save, Lock
} from 'lucide-react';
import { Box, Typography, Chip, CircularProgress } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import { 
  MeasureType, OutraAtividade, Control, 
  LocationRow, TransitRow, ShelfLifeRow, CriticalRow, AlertConfig, ManagedItem,
  User, Task, Category, ConditionConfig, ShiftHandover
} from '../types';
import { DatePickerField, TimeInput, hhmmssToMinutes, minutesToHhmmss, ConfirmModal } from '../modals';
import { validationService, migrationService, sharedDraftService, baseStatusService } from '../services';

// Utilitário de Debounce
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: any;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

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
  const diffTime = today.getTime() - date.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

const getDaysRemaining = (dateStr: any): number => {
  const date = parseDate(dateStr);
  if (!date) return 0;
  const today = new Date();
  today.setHours(0,0,0,0);
  date.setHours(0,0,0,0);
  const diffTime = date.getTime() - today.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

const getShelfLifeDisplayText = (dateStr: string) => {
  if (!dateStr) return '';
  const dias = getDaysRemaining(dateStr);
  if (dias < 0) return 'Vencido';
  if (dias === 0) return 'Vence Hoje';
  if (dias === 1) return '1 Dia';
  return `${dias} Dias`;
};

const getEnvioDisplayText = (dateStr: string) => {
  if (!dateStr) return '';
  const dias = getDaysDiff(dateStr);
  if (dias <= 0) return 'Hoje';
  if (dias === 1) return '1 Dia';
  return `${dias} Dias`;
};

function obterCorDoBackgroundShelfLife(item: any): string {
  const corBackground = item.corBackground || 'verde';
  if (corBackground === 'vermelho') return '#d32f2f'; 
  if (corBackground === 'amarelo') return '#f57c00'; 
  return '#388e3c'; 
}

function obterCorDoBackgroundEnvio(item: any): string {
  const corBackground = item.corBackground || 'verde';
  if (corBackground === 'vermelho') return '#d32f2f'; 
  if (corBackground === 'amarelo') return '#f57c00'; 
  return '#388e3c'; 
}

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
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('editId');
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const prevBaseIdRef = useRef<string | undefined>(baseId);

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
  const [dataOperacional, setDataOperacional] = useState(new Date().toISOString().split('T')[0]);
  const [turnoAtivo, setTurnoAtivo] = useState('');
  const [colaboradoresIds, setColaboradoresIds] = useState<(string | null)[]>([null, null, null, null, null, null]);
  const [tarefasValores, setTarefasValores] = useState<Record<string, string>>({}); 
  const [obs, setObs] = useState('');
  const [errosValidacao, setErrosValidacao] = useState<string[]>([]);
  
  const [nonRoutineTasks, setNonRoutineTasks] = useState<OutraAtividade[]>([]);
  
  const [locations, setLocations] = useState<any[]>([]);
  const [transit, setTransit] = useState<any[]>([]);
  const [shelfLife, setShelfLife] = useState<any[]>([]);
  const [critical, setCritical] = useState<any[]>([]);
  
  const [activeAlert, setActiveAlert] = useState<{titulo: string, mensagem: string, color: string} | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ open: boolean, title: string, message: string, onConfirm: () => void, onCancel?: () => void, type?: 'danger' | 'warning' | 'info' | 'success', confirmLabel?: string, cancelLabel?: string }>({ open: false, title: '', message: '', onConfirm: () => {} });
  
  // Controle de Sincronia Multi-usuário e Auto-save
  const [lastLocalUpdate, setLastLocalUpdate] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [statusSalvamento, setStatusSalvamento] = useState<'idle' | 'salvando' | 'salvo'>('idle');

  const isViewOnly = status === 'Finalizado' && !editId;

  // Categorias e Tarefas Operacionais
  const opCategories = useMemo(() => allCats.filter(c => c.tipo === 'operacional' && c.status === 'Ativa' && c.visivel !== false && (!c.baseId || c.baseId === baseId)).sort((a,b) => a.ordem - b.ordem), [allCats, baseId]);
  const opTasks = useMemo(() => allTasks.filter(t => t.status === 'Ativa' && t.visivel !== false && (!t.baseId || t.baseId === baseId)), [allTasks, baseId]);

  // Bloqueio de campos
  const isFormLocked = useMemo(() => {
    return !dataOperacional || !turnoAtivo || !colaboradoresIds.some(id => id !== null);
  }, [dataOperacional, turnoAtivo, colaboradoresIds]);

  // Listener de teclado para fechar popups
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (activeAlert && (e.key === 'Enter' || e.key === 'Tab' || e.key === 'Escape')) {
        e.preventDefault();
        setActiveAlert(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeAlert]);

  // Avançar campos com Enter/Tab
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLElement;
      if (target.tagName === 'TEXTAREA') return;
      
      e.preventDefault();
      const form = pageContainerRef.current;
      if (form) {
        const focusable = form.querySelectorAll('input, select, textarea, button:not([disabled])');
        const index = Array.prototype.indexOf.call(focusable, target);
        if (index > -1 && index < focusable.length - 1) {
          (focusable[index + 1] as HTMLElement).focus();
        }
      }
    }
  };

  // Carregar dados quando Data ou Turno mudam ou Base muda
  useEffect(() => {
    if (!baseId || editId) return;

    const loadSharedDraft = async () => {
      console.debug(`[ShiftHandover] Carregando dados: Base=${baseId}`);
      
      // PERSISTÊNCIA DE SESSÃO: Tentar recuperar data/turno salvos localmente para esta base
      const sessionKey = `gol_active_session_${baseId}`;
      const savedSession = localStorage.getItem(sessionKey);
      let targetData = dataOperacional;
      let targetTurno = turnoAtivo;

      if (savedSession && !turnoAtivo) {
        const parsed = JSON.parse(savedSession);
        targetData = parsed.data;
        targetTurno = parsed.turno;
        setDataOperacional(targetData);
        setTurnoAtivo(targetTurno);
      }

      if (!targetData || !targetTurno) return;

      const remote = await sharedDraftService.getDraft(baseId, targetData, targetTurno);
      const isBaseChange = prevBaseIdRef.current !== baseId;
      prevBaseIdRef.current = baseId;

      if (remote) {
        console.debug(`[ShiftHandover] Rascunho de turno encontrado.`);
        setColaboradoresIds(remote.colaboradoresIds);
        setTarefasValores(remote.tarefasValores);
        setObs(remote.obs);
        setNonRoutineTasks(remote.nonRoutineTasks);
        setLocations(remote.locations);
        setTransit(remote.transit);
        setShelfLife(remote.shelfLife);
        setCritical(remote.critical);
        setLastLocalUpdate(remote.updatedAt);
      } else {
        console.debug(`[ShiftHandover] Turno limpo. Buscando dados persistentes da base.`);
        const bStatus = await baseStatusService.getBaseStatus(baseId);
        
        // MANUTENÇÃO DE DADOS PERSISTENTES (Notas e Controles)
        if (bStatus) {
           setObs(bStatus.obs || '');
           setLocations(bStatus.locations || []);
           setTransit(bStatus.transit || []);
           setShelfLife(bStatus.shelfLife || []);
           setCritical(bStatus.critical || []);
           console.debug(`[ShiftHandover] Observações mantidas: ${bStatus.obs?.length > 0}`);
        }

        if (isBaseChange) {
           resetCamposProducaoExceptTeam();
        } else {
           // Apenas limpa a produção se for o mesmo dia/base mas turno novo
           setTarefasValores({});
           setNonRoutineTasks([]);
           setColaboradoresIds([null, null, null, null, null, null]);
        }
      }
    };
    loadSharedDraft();
  }, [baseId, dataOperacional, turnoAtivo, editId]);

  // Salvar sessão ativa localmente para retorno rápido
  useEffect(() => {
    if (baseId && dataOperacional && turnoAtivo && !editId) {
      localStorage.setItem(`gol_active_session_${baseId}`, JSON.stringify({ data: dataOperacional, turno: turnoAtivo }));
    }
  }, [baseId, dataOperacional, turnoAtivo, editId]);

  // Carregamento específico para Edição vindo do relatório
  useEffect(() => {
    if (editId) {
       const raw = localStorage.getItem('gol_rep_detalhamento');
       const registros = raw ? JSON.parse(raw) : [];
       const registro = registros.find((r: any) => r.id === editId);
       if (registro) {
          let dataFormatada = registro.data;
          // Se a data do registro estiver no formato DD/MM/AAAA, converter para AAAA-MM-DD para o input HTML
          if (dataFormatada.includes('/')) {
             const [d, m, y] = dataFormatada.split('/');
             dataFormatada = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
          }
          setDataOperacional(dataFormatada);
          setTurnoAtivo(registro.turnoId);
          setColaboradoresIds(registro.colaboradoresIds || [null, null, null, null, null, null]);
          setTarefasValores(registro.tarefasExecutadas || {});
          setObs(registro.informacoesImportantes || registro.observacoes || '');
          setNonRoutineTasks(registro.nonRoutineTasks || registro.outrasTarefas || []);
          setShelfLife(registro.shelfLifeData || registro.shelfLifeItems || []);
          setLocations(registro.locationsData || registro.locationItems || []);
          setTransit(registro.transitData || registro.transitItems || []);
          setCritical(registro.criticalData || registro.criticosItems || []);
          setStatus('Rascunho');
       }
    }
  }, [editId]);

  // Função para salvar dados manualmente ou via auto-save
  const salvarDadosInternal = useCallback(async () => {
    if (!baseId || !dataOperacional || !turnoAtivo || editId || status === 'Finalizado') return;
    
    setStatusSalvamento('salvando');
    const now = new Date().getTime();
    const content = { dataOperacional, turnoAtivo, colaboradoresIds, tarefasValores, obs, nonRoutineTasks, locations, transit, shelfLife, critical, status };
    
    try {
      await sharedDraftService.saveDraft(baseId, dataOperacional, turnoAtivo, content);
      // Salva o snapshot da base para persistência entre turnos e usuários
      await baseStatusService.saveBaseStatus(baseId, { obs, locations, transit, shelfLife, critical });
      setLastLocalUpdate(now);
      setStatusSalvamento('salvo');
      setTimeout(() => setStatusSalvamento('idle'), 2000);
    } catch (error) {
      setStatusSalvamento('idle');
    }
  }, [baseId, dataOperacional, turnoAtivo, colaboradoresIds, tarefasValores, obs, nonRoutineTasks, locations, transit, shelfLife, critical, status, editId]);

  const autoSalvarComDebounce = useMemo(() => debounce(salvarDadosInternal, 2000), [salvarDadosInternal]);

  useEffect(() => {
    if (initialized) autoSalvarComDebounce();
  }, [colaboradoresIds, tarefasValores, obs, nonRoutineTasks, locations, transit, shelfLife, critical, initialized]);

  // Polling de sincronização
  useEffect(() => {
    if (!baseId || !dataOperacional || !turnoAtivo || editId || status === 'Finalizado') return;

    const syncWithRemote = async () => {
      setIsSyncing(true);
      const remote = await sharedDraftService.getDraft(baseId, dataOperacional, turnoAtivo);
      if (remote && remote.updatedAt > lastLocalUpdate) {
         setColaboradoresIds(remote.colaboradoresIds);
         setTarefasValores(remote.tarefasValores);
         setObs(remote.obs);
         setNonRoutineTasks(remote.nonRoutineTasks);
         setLocations(remote.locations);
         setTransit(remote.transit);
         setShelfLife(remote.shelfLife);
         setCritical(remote.critical);
         setLastLocalUpdate(remote.updatedAt);
      }
      setTimeout(() => setIsSyncing(false), 500);
    };

    const interval = setInterval(syncWithRemote, 5000);
    return () => clearInterval(interval);
  }, [baseId, dataOperacional, turnoAtivo, lastLocalUpdate, editId, status]);

  // Inicialização de tarefas dinâmicas - Ajustado conforme solicitação 3 para persistência em edição
  useEffect(() => {
    if (!initialized || !opCategories.length || isViewOnly) return;
    
    setNonRoutineTasks(prev => {
      const newState = [...prev];
      let changed = false;
      
      opCategories.forEach(cat => {
        if (cat.exibicao === 'suspensa') {
          // Conta quantas linhas já existem para esta categoria (carregadas por editId ou já presentes)
          const currentRowsForCat = newState.filter(t => t.categoriaId === cat.id);
          
          // Se tiver menos de 3 linhas, adiciona linhas vazias até completar o mínimo, garantindo persistência das existentes
          if (currentRowsForCat.length < 3) {
            changed = true;
            const needed = 3 - currentRowsForCat.length;
            for (let i = 0; i < needed; i++) {
              newState.push({ 
                id: `dyn-${cat.id}-${Date.now()}-${newState.length}`, 
                nome: '', 
                tempo: '', 
                categoriaId: cat.id, 
                tipoMedida: MeasureType.TEMPO 
              });
            }
          }
        }
      });
      
      return changed ? newState : prev;
    });
  }, [initialized, opCategories, isViewOnly]);

  // GARANTIA DE ITENS PRÉ-CADASTRADOS SEMPRE VISÍVEIS
  useEffect(() => {
    if (!initialized || !baseId) return;
    
    setLocations(prev => {
      const activeStoreItems = getDefaultLocations(baseId);
      const filtered = prev.filter(p => !p.isPadrao || activeStoreItems.some(i => i.id === p.id));
      const toAdd = activeStoreItems.filter(i => !prev.some(p => p.id === i.id));
      return [...filtered, ...toAdd.map(i => ({ id: i.id, nomeLocation: i.nomeLocation, quantidade: null, dataMaisAntigo: '', isPadrao: true, config: i, corBackground: 'verde' }))];
    });

    setTransit(prev => {
      const activeStoreItems = getDefaultTransits(baseId);
      const filtered = prev.filter(p => !p.isPadrao || activeStoreItems.some(i => i.id === p.id));
      const toAdd = activeStoreItems.filter(i => !prev.some(p => p.id === i.id));
      return [...filtered, ...toAdd.map(i => ({ id: i.id, nomeTransito: i.nomeTransito, diasPadrao: i.diasPadrao, quantidade: null, dataSaida: '', isPadrao: true, config: i, corBackground: 'verde' }))];
    });

    setCritical(prev => {
      const activeStoreItems = getDefaultCriticals(baseId);
      const filtered = prev.filter(p => !p.isPadrao || activeStoreItems.some(i => i.id === p.id));
      const toAdd = activeStoreItems.filter(i => !prev.some(p => p.id === i.id));
      return [...filtered, ...toAdd.map(i => ({ id: i.id, partNumber: i.partNumber, lote: '', saldoSistema: null, saldoFisico: null, isPadrao: true, config: i, corBackground: 'verde' }))];
    });

    setShelfLife(prev => {
      const activeStoreItems = getDefaultShelfLifes(baseId);
      const filtered = prev.filter(p => !p.isPadrao || activeStoreItems.some(i => i.id === p.id));
      const toAdd = activeStoreItems.filter(i => !prev.some(p => p.id === i.id));
      const result = [...filtered, ...toAdd.map(i => ({ id: i.id, partNumber: i.partNumber, lote: '', dataVencimento: '', isPadrao: true, config: i, corBackground: 'verde' }))];
      const manualRows = result.filter(r => !r.isPadrao);
      if (manualRows.length < 2) {
        const needed = 2 - manualRows.length;
        for (let j = 0; j < needed; j++) result.push({ id: `manual-init-${Date.now()}-${j}`, partNumber: '', lote: '', dataVencimento: '', isPadrao: false, corBackground: 'verde' });
      }
      return result;
    });
  }, [baseId, initialized, getDefaultLocations, getDefaultTransits, getDefaultCriticals, getDefaultShelfLifes]);

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
    nonRoutineTasks.forEach(nr => { 
      if (!nr.nome || !nr.tempo) return;
      if (nr.tipoMedida === MeasureType.QTD) {
         prod += (parseFloat(nr.tempo) || 0) * (nr.fatorMultiplicador || 0) / 60;
      } else {
         prod += hhmmssToMinutes(nr.tempo) / 60; 
      }
    });
    return { horasDisponiveis: disp, horasProduzidas: prod, performance: disp > 0 ? (prod / disp) * 100 : 0 };
  }, [colaboradoresIds, tarefasValores, nonRoutineTasks, baseUsers, opTasks]);

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
    if (!item || value === undefined || value === null || value === '') return;
    const categoryConfig = activeControls.find(c => c.tipo === controlType);
    const itemConfig = item.config;
    const cores = (itemConfig?.cores?.vermelho) ? itemConfig.cores : categoryConfig?.cores;
    const popups = (itemConfig?.popups?.vermelho) ? itemConfig.popups : categoryConfig?.popups;
    if (!cores || !popups) return;
    const val = Number(value);
    if (atendeCriterioVerde(cores.verde, val)) {
       if (popups.verde.habilitado !== false) setActiveAlert({ titulo: popups.verde.titulo || 'OK', mensagem: popups.verde.mensagem.replace('X', String(val)), color: 'bg-green-600 dark:bg-green-700' });
    } else if (atendeCriterioAmarelo(cores.amarelo, val)) {
       if (popups.amarelo.habilitado !== false) setActiveAlert({ titulo: popups.amarelo.titulo || 'Atenção', mensagem: popups.amarelo.mensagem.replace('X', String(val)), color: 'bg-yellow-600 dark:bg-yellow-700' });
    } else if (atendeCriterioVermelho(cores.vermelho, val)) {
       if (popups.vermelho.habilitado !== false) setActiveAlert({ titulo: popups.vermelho.titulo || 'Crítico', mensagem: popups.vermelho.mensagem.replace('X', String(val)), color: 'bg-red-600 dark:bg-red-700' });
    }
  };

  const getRowStatusClasses = (item: any, val: number, controlType: string) => {
    const corStatus = item.corBackground;
    if (corStatus === 'vermelho') return 'bg-red-100 dark:bg-red-900/30 text-red-950 dark:text-red-100 border-l-4 border-l-red-600 font-bold';
    if (corStatus === 'amarelo') return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-950 dark:text-yellow-100 border-l-4 border-l-yellow-500 font-bold';
    if (corStatus === 'verde') return 'bg-green-100 dark:bg-green-900/30 text-green-950 dark:text-green-100 border-l-4 border-l-green-600 font-bold';
    return '';
  };

  const handleShelfLifeDataChange = (id: string, novaData: string) => {
    const dias = getDaysRemaining(novaData);
    const categoryConfig = activeControls.find(c => c.tipo === 'shelf_life');
    setShelfLife(prev => prev.map(item => {
      if (item.id === id) {
        const cores = item.config?.cores || categoryConfig?.cores;
        let status: 'verde' | 'amarelo' | 'vermelho' = 'verde';
        if (cores) {
          if (atendeCriterioVermelho(cores.vermelho, dias)) status = 'vermelho';
          else if (atendeCriterioAmarelo(cores.amarelo, dias)) status = 'amarelo';
        }
        evaluateAlert(item, dias, 'shelf_life');
        return { ...item, dataVencimento: novaData, corBackground: status };
      }
      return item;
    }));
  };

  const handleLocationsDataChange = (id: string, novaData: string) => {
    const dias = getDaysDiff(novaData);
    const categoryConfig = activeControls.find(c => c.tipo === 'locations');
    setLocations(prev => prev.map(item => {
      if (item.id === id) {
        const cores = item.config?.cores || categoryConfig?.cores;
        let status: 'verde' | 'amarelo' | 'vermelho' = 'verde';
        if (cores) {
          if (atendeCriterioVermelho(cores.vermelho, dias)) status = 'vermelho';
          else if (atendeCriterioAmarelo(cores.amarelo, dias)) status = 'amarelo';
        }
        evaluateAlert(item, dias, 'locations');
        return { ...item, dataMaisAntigo: novaData, corBackground: status };
      }
      return item;
    }));
  };

  const handleTransitDataChange = (id: string, novaData: string) => {
    const dias = getDaysDiff(novaData);
    const categoryConfig = activeControls.find(c => c.tipo === 'transito');
    setTransit(prev => prev.map(item => {
      if (item.id === id) {
        const cores = item.config?.cores || categoryConfig?.cores;
        let status: 'verde' | 'amarelo' | 'vermelho' = 'verde';
        if (cores) {
          if (atendeCriterioVermelho(cores.vermelho, dias)) status = 'vermelho';
          else if (atendeCriterioAmarelo(cores.amarelo, dias)) status = 'amarelo';
        }
        evaluateAlert(item, dias, 'transito');
        return { ...item, dataSaida: novaData, corBackground: status };
      }
      return item;
    }));
  };

  const handleCriticalFieldChange = (id: string, field: 'partNumber' | 'lote' | 'saldoSistema' | 'saldoFisico', val: any) => {
    const numericVal = (field === 'saldoSistema' || field === 'saldoFisico') ? Math.max(0, Number(val)) : val;
    setCritical(prev => prev.map(item => {
      if (item.id === id) {
        const newItem = { ...item, [field]: numericVal };
        const categoryConfig = activeControls.find(c => c.tipo === 'itens_criticos');
        const diff = Math.abs((newItem.saldoSistema || 0) - (newItem.saldoFisico || 0));
        const cores = item.config?.cores || categoryConfig?.cores;
        let status: 'verde' | 'amarelo' | 'vermelho' = 'verde';
        if (cores) {
          if (atendeCriterioVermelho(cores.vermelho, diff)) status = 'vermelho';
          else if (atendeCriterioAmarelo(cores.amarelo, diff)) status = 'amarelo';
        }
        return { ...newItem, corBackground: status };
      }
      return item;
    }));
  };

  const handleColaboradorChange = (idx: number, id: string | null) => {
    if (id && colaboradoresIds.some((cid, i) => cid === id && i !== idx)) {
      const nome = baseUsers.find(u => u.id === id)?.nome || 'Selecionado';
      setActiveAlert({ titulo: 'COLABORADOR JÁ REGISTRADO', mensagem: `O colaborador '${nome}' já está registrado neste turno do dia ${dataOperacional}.`, color: 'bg-red-600 dark:bg-red-700' });
      return;
    }
    const n = [...colaboradoresIds]; n[idx] = id; setColaboradoresIds(n);
  };

  const resetCamposProducaoExceptTeam = () => {
    console.debug(`[ShiftHandover] Resetando campos de produção.`);
    setTarefasValores({});
    setNonRoutineTasks([]);
    setStatus('Rascunho');
    setErrosValidacao([]);
  };

  const resetCamposProducao = () => {
    console.debug(`[ShiftHandover] Finalização concluída. Limpando apenas campos de produção.`);
    setTurnoAtivo('');
    setColaboradoresIds([null, null, null, null, null, null]);
    resetCamposProducaoExceptTeam();
    // ✅ GARANTIA ABSOLUTA: Observações (obs) e Controles Diários (locations, etc) NÃO SÃO LIMPOS
    console.debug(`[ShiftHandover] Observações mantidas: ${obs.length > 0}`);
    console.debug(`[ShiftHandover] Controles mantidos para o próximo turno.`);
  };

  const handleFinalize = async () => {
    console.debug(`[ShiftHandover] Finalizando passagem.`);
    const errosOutras: string[] = [];
    
    // Validação estrita para categorias em formato SUSPENSO (Ajustado para permitir 0)
    nonRoutineTasks.forEach(t => { 
      if (t.nome.trim() !== '' && (t.tempo === undefined || t.tempo === null || t.tempo === '')) {
         const catName = opCategories.find(c => c.id === t.categoriaId)?.nome || 'Tarefas Adicionais';
         errosOutras.push(`Processos Operacionais - ${catName}: O valor para "${t.nome}" é obrigatório.`); 
      } 
    });

    const handoverData: ShiftHandover = { id: editId || `sh_${Date.now()}`, baseId: baseId || '', data: dataOperacional, turnoId: turnoAtivo, colaboradores: colaboradoresIds, tarefasExecutadas: tarefasValores, nonRoutineTasks: nonRoutineTasks, locationsData: locations, transitData: transit, shelfLifeData: shelfLife, criticalData: critical, informacoesImportantes: obs, status: 'Finalizado', performance: performance, CriadoEm: new Date().toISOString(), updatedAt: new Date().toISOString() };
    
    const validacao = validationService.validarPassagem(handoverData, opTasks, opCategories);
    const todosErros = [...validacao.camposPendentes, ...errosOutras];
    
    if (todosErros.length > 0) { 
      setErrosValidacao(todosErros); 
      setActiveAlert({ 
        titulo: "Campos Pendentes", 
        mensagem: "Existem campos obrigatórios não preenchidos na Passagem de Turno:\n\n• " + todosErros.join("\n• "), 
        color: "bg-red-600 dark:bg-red-700" 
      }); 
      return; 
    }

    if (!editId) {
      const respDuplicada = await validationService.validarPassagemDuplicada(dataOperacional, turnoAtivo, baseId || '');
      if (!respDuplicada.valido) {
        const turnoNum = currentBase?.turnos.find(t => t.id === turnoAtivo)?.numero || turnoAtivo;
        setActiveAlert({ titulo: "PASSAGEM JÁ FINALIZADA", mensagem: respDuplicada.message || `Já existe uma Passagem de Serviço finalizada para o dia ${dataOperacional} no Turno ${turnoNum}.`, color: "bg-red-600 dark:bg-red-700" });
        return;
      }
    }
    const { colaboradoresDuplicados } = await validationService.verificarColaboradoresEmOutrosTurnos(dataOperacional, turnoAtivo, baseId || '', colaboradoresIds, baseUsers);
    if (colaboradoresDuplicados.length > 0) {
      setConfirmModal({ open: true, title: 'ATENÇÃO - COLABORADOR DUPLICADO', message: `Os colaboradores '${colaboradoresDuplicados.join(', ')}' já estão registrados em outro turno do dia ${dataOperacional}. Tem certeza que quer considerar o mesmo colaborador em 2 turnos diferentes no mesmo dia?`, type: 'warning', onConfirm: () => proceedToMigrate(handoverData), confirmLabel: 'Sim, Continuar', cancelLabel: 'Não, Cancelar' });
      return;
    }
    if (editId) { setConfirmModal({ open: true, title: 'CONFIRMAR ALTERAÇÃO', message: 'Tem certeza que quer alterar os dados desta passagem de serviço no histórico de relatórios?', type: 'warning', onConfirm: () => proceedToMigrate(handoverData), confirmLabel: 'Sim, Salvar Alterações', cancelLabel: 'Não, Cancelar' }); return; }
    proceedToMigrate(handoverData);
  };

  const proceedToMigrate = async (data: ShiftHandover) => {
    try {
      await migrationService.processarMigracao(data, store, editId || undefined);
      console.debug(`[ShiftHandover] Migração executada. Notas e Controles preservados na base.`);
      setConfirmModal({ open: true, title: editId ? 'Alteração Salva com Sucesso!' : 'Passagem Finalizada com Sucesso!', message: editId ? 'As informações originais foram substituídas pelas novas no histórico.' : 'Seus dados foram migrados para Relatórios com sucesso. Notas e Controles foram preservados para o próximo turno.', type: 'success', confirmLabel: 'OK', cancelLabel: undefined, onConfirm: () => { if (editId) navigate('/reports'); else { resetCamposProducao(); setConfirmModal(prev => ({ ...prev, open: false })); window.scrollTo({ top: 0, behavior: 'smooth' }); } } });
    } catch (error) { setActiveAlert({ titulo: "Erro ao Finalizar", mensagem: "Ocorreu um erro ao finalizar a passagem. Tente novamente.", color: "bg-red-700 dark:bg-red-800" }); }
  };

  const handleDynamicRowTaskChange = (rowId: string, taskName: string, catId: string) => {
    const matchedTask = opTasks.find(t => t.nome === taskName && t.categoriaId === catId);
    setNonRoutineTasks(prev => prev.map(item => {
      if (item.id === rowId) {
        return { 
          ...item, 
          nome: taskName, 
          tipoMedida: matchedTask?.tipoMedida || MeasureType.TEMPO,
          fatorMultiplicador: matchedTask?.fatorMultiplicador || 0,
          tempo: ''
        };
      }
      return item;
    }));
  };

  const hasErr = (keyword: string) => errosValidacao.some(err => err.includes(keyword));

  return (
    <div ref={pageContainerRef} onKeyDown={handleKeyDown} className="max-w-full mx-auto space-y-8 animate-in fade-in relative px-4 md:px-8 focus:outline-none pb-24">
      {opCategories.filter(c => c.exibicao === 'suspensa').map(cat => (
        <datalist key={`list-${cat.id}`} id={`datalist-${cat.id}`}>
          {opTasks.filter(t => t.categoriaId === cat.id).map(t => <option key={t.id} value={t.nome} />)}
        </datalist>
      ))}

      {editId && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border-l-4 border-amber-500 p-4 rounded-xl flex items-center justify-between">
           <div className="flex items-center space-x-3">
             <Edit2 className="text-amber-600 dark:text-amber-400 w-5 h-5" />
             <p className="text-sm font-bold text-amber-800 dark:text-amber-200 uppercase tracking-tight">MODO EDIÇÃO: Alterando registro histórico de {currentBase?.sigla}.</p>
           </div>
           <button onClick={() => navigate('/reports')} className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase hover:underline">Cancelar Edição</button>
        </div>
      )}

      {activeAlert && (
        <div className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden">
          <div className={`${activeAlert.color} text-white p-8 rounded-[2.5rem] shadow-2xl max-w-lg w-full border-4 border-white/20 flex flex-col max-h-[90vh] animate-in zoom-in-95`}>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-2xl font-black uppercase tracking-tight">{activeAlert.titulo}</h4>
              <button onClick={() => setActiveAlert(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24}/></button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide mb-6">
              <p className="font-bold whitespace-pre-wrap leading-relaxed opacity-90">{activeAlert.mensagem}</p>
            </div>
            <button 
              onClick={() => setActiveAlert(null)} 
              className="w-full bg-white text-gray-800 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-50 active:scale-95 transition-all shadow-lg"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      <ConfirmModal isOpen={confirmModal.open} onClose={() => { if(confirmModal.onCancel) confirmModal.onCancel(); setConfirmModal({ ...confirmModal, open: false }); }} onConfirm={confirmModal.onConfirm} title={confirmModal.title} message={confirmModal.message} type={confirmModal.type} confirmLabel={confirmModal.confirmLabel} cancelLabel={confirmModal.cancelLabel} />

      <header className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-6">
         <div className="flex items-center space-x-6">
            <div className="w-16 h-16 bg-orange-50 dark:bg-orange-950/30 rounded-2xl flex items-center justify-center text-orange-600 dark:text-orange-500 shadow-inner"><Plane className="w-8 h-8" /></div>
            <div>
               <h2 className="text-3xl font-black text-gray-800 dark:text-slate-100 tracking-tighter">Passagem de Serviço</h2>
               <p className="text-gray-400 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest">{currentBase?.nome} ({currentBase?.sigla}) — {dataOperacional}</p>
            </div>
         </div>
         <div className="flex items-center space-x-4">
            <div className="flex flex-col items-end">
               <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
                  {statusSalvamento === 'salvando' && <><RefreshCw className="w-3 h-3 animate-spin text-orange-500" /> <span>Salvando...</span></>}
                  {statusSalvamento === 'salvo' && <><CloudCheck className="w-3 h-3 text-green-500" /> <span>Salvo</span></>}
                  {statusSalvamento === 'idle' && <><CloudCheck className="w-3 h-3 text-gray-300" /> <span>Auto-save Isolado</span></>}
               </div>
               {lastLocalUpdate > 0 && <span className="text-[8px] font-bold text-gray-300 uppercase mt-0.5">Sincronizado: {new Date(lastLocalUpdate).toLocaleTimeString()}</span>}
            </div>
            <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${status === 'Rascunho' ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/50' : 'bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/50'}`}>Status: {status}</div>
         </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <aside className="w-full lg:w-1/4 lg:sticky lg:top-6 z-20 space-y-4">
           <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-700 space-y-4">
              <h3 className="font-black text-gray-800 dark:text-slate-100 uppercase tracking-widest flex items-center space-x-2 text-[11px]"><BarChart3 size={14} className="text-orange-500" /> <span>Produção {currentBase?.sigla}</span></h3>
              <div className="grid gap-2.5">
                 <KpiItem label="Horas Disp." value={minutesToHhmmss(horasDisponiveis * 60)} icon={<Clock size={14}/>} />
                 <KpiItem label="Horas Prod." value={minutesToHhmmss(horasProduzidas * 60)} icon={<Activity size={14}/>} />
              </div>
              <div className="pt-1">
                 <div className="flex justify-between items-center text-[9px] font-black uppercase text-gray-400 dark:text-slate-500 mb-1"><span>Performance</span><span className={performanceColor}>{performance.toFixed(1)}%</span></div>
                 <div className="h-2.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden border border-gray-50 dark:border-slate-600 shadow-inner">
                    <div className={`h-full transition-all duration-1000 ${performanceBg}`} style={{ width: `${Math.min(performance, 100)}%` }} />
                 </div>
              </div>
           </div>
           <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-slate-700 space-y-4">
              <h3 className="font-black text-gray-800 dark:text-slate-100 uppercase tracking-widest flex items-center space-x-2 text-sm"><MessageSquare size={16} className="text-orange-500" /> <span>Observações {currentBase?.sigla}</span></h3>
              <textarea disabled={isViewOnly || isFormLocked} value={obs} onChange={e => setObs(e.target.value)} placeholder={isFormLocked ? "Preencha o cabeçalho primeiro..." : "Intercorrências específicas da base..."} className="w-full min-h-[250px] p-5 bg-gray-50 dark:bg-slate-900 border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-orange-100 dark:focus:border-slate-600 outline-none font-medium text-sm dark:text-slate-200 resize-none disabled:opacity-50" />
              <Typography variant="caption" color="textSecondary" sx={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', display: 'block', px: 1 }}>Notas isoladas desta unidade operacional</Typography>
           </div>
        </aside>

        <div className="w-full lg:w-3/4 space-y-12">
           <section className={`bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border transition-all ${hasErr('Configuração') ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : 'border-gray-100 dark:border-slate-700'}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                <DatePickerField label="Data Operacional" value={dataOperacional} onChange={setDataOperacional} disabled={isViewOnly} />
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Turno</label>
                    <select disabled={isViewOnly} value={turnoAtivo} onChange={e => setTurnoAtivo(e.target.value)} className={`w-full p-4 bg-gray-50 dark:bg-slate-900 dark:text-slate-200 border rounded-2xl font-bold text-sm focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900 outline-none transition-all ${hasErr('Turno') ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-100 dark:border-slate-700'}`}>
                       <option value="">Selecionar Turno...</option>
                       {currentBase?.turnos.map(t => <option key={t.id} value={t.id}>Turno {t.numero} ({t.horaInicio}-{t.horaFim})</option>)}
                    </select>
                </div>
              </div>
           </section>

           <section className={`bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border transition-all space-y-6 ${hasErr('Equipe') ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : 'border-gray-100 dark:border-slate-700'}`}>
              <h3 className="font-black text-gray-800 dark:text-slate-100 uppercase tracking-widest flex items-center space-x-2 text-sm"><Users size={16} className="text-orange-500" /> <span>Equipe {currentBase?.sigla}</span></h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {colaboradoresIds.map((id, idx) => (
                    <select key={idx} disabled={isViewOnly} value={id || ''} onChange={e => handleColaboradorChange(idx, e.target.value || null)} className={`w-full p-4 bg-gray-50 dark:bg-slate-900 dark:text-slate-200 border rounded-2xl font-bold text-xs ${hasErr('Equipe') ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-100 dark:border-slate-700'}`}>
                       <option value="">Colaborador {idx+1}...</option>
                       {baseUsers.map(u => (
                         <option key={u.id} value={u.id}>
                           {u.nome} - {u.jornadaPadrao}h
                         </option>
                       ))}
                    </select>
                 ))}
              </div>
           </section>

           <section className={`space-y-12 transition-all ${isFormLocked ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
              <div className="px-4 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-gray-800 dark:text-slate-100 uppercase tracking-tighter">Controles Diários de {currentBase?.sigla}</h2>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-1">Gestão isolada por unidade operacional.</p>
                </div>
                {isFormLocked && (
                  <div className="flex items-center space-x-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase animate-pulse">
                    <Lock size={12}/> <span>Preencha Data, Turno e Equipe para desbloquear</span>
                  </div>
                )}
              </div>

              <PanelContainer title="Shelf Life" icon={<FlaskConical size={16} className="text-orange-500" />} onAdd={() => setShelfLife([...shelfLife, { id: `m-${Date.now()}`, partNumber: '', lote: '', dataVencimento: '', isPadrao: false, corBackground: 'verde' }])} isViewOnly={isViewOnly}>
                <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-slate-900 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest"><tr><th className="px-6 py-4">Part Number</th><th className="px-6 py-4">Lote</th><th className="px-6 py-4">Vencimento</th></tr></thead>
                  <tbody>
                    {shelfLife.map(row => {
                      const dias = getDaysRemaining(row.dataVencimento);
                      return (
                        <tr key={row.id} className={`border-t border-gray-50 dark:border-slate-800 ${getRowStatusClasses(row, dias, 'shelf_life')}`}>
                          <td className={`px-6 py-4 font-bold uppercase ${hasErr('Controle Shelf Life') && !row.partNumber ? 'bg-red-50/50' : ''}`}>
                            <input disabled={isViewOnly || row.isPadrao} className={`bg-transparent w-full outline-none ${hasErr('Controle Shelf Life') && !row.partNumber ? 'text-red-600 placeholder-red-300' : ''}`} value={row.partNumber} placeholder="PN Obrigatório" onChange={e => setShelfLife(shelfLife.map(l => l.id === row.id ? {...l, partNumber: e.target.value} : l))} />
                          </td>
                          <td className={`px-6 py-4 font-bold ${hasErr('Lote') && !row.lote ? 'bg-red-50/50' : ''}`}>
                            <input disabled={isViewOnly} className={`bg-transparent w-full outline-none ${hasErr('Lote') && !row.lote ? 'text-red-600 placeholder-red-300' : ''}`} value={row.lote} placeholder="Lote Obrigatório" onChange={e => setShelfLife(shelfLife.map(l => l.id === row.id ? {...l, lote: e.target.value} : l))} />
                          </td>
                          <td className={`px-6 py-4 ${hasErr('Vencimento') && !row.dataVencimento ? 'bg-red-50/50' : ''}`}>
                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                               <Box sx={{ minWidth: '150px' }}>
                                 <DatePickerField value={row.dataVencimento} onChange={v => handleShelfLifeDataChange(row.id, v)} disabled={isViewOnly} />
                               </Box>
                               {row.dataVencimento && (
                                 <Typography sx={{ fontWeight: 800, fontSize: '14px', color: obterCorDoBackgroundShelfLife(row), letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                                   <span className="opacity-40"> - </span> {getShelfLifeDisplayText(row.dataVencimento)}
                                 </Typography>
                               )}
                             </Box>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </PanelContainer>

              <PanelContainer title="Locations" icon={<BoxIcon size={16} className="text-orange-500" />} onAdd={() => setLocations([...locations, { id: `m-${Date.now()}`, nomeLocation: '', quantidade: null, dataMaisAntigo: '', corBackground: 'verde' }])} isViewOnly={isViewOnly}>
                <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-slate-900 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest"><tr><th className="px-6 py-4">Location</th><th className="px-6 py-4">Quantidade</th><th className="px-6 py-4">Mais Antigo</th></tr></thead>
                  <tbody>
                    {locations.map(row => {
                      const dias = getDaysDiff(row.dataMaisAntigo);
                      return (
                        <tr key={row.id} className={`border-t border-gray-50 dark:border-slate-800 ${getRowStatusClasses(row, dias, 'locations')}`}>
                          <td className={`px-6 py-4 font-bold uppercase ${hasErr('Locations') && !row.nomeLocation ? 'bg-red-50/50' : ''}`}>
                            <input disabled={isViewOnly || row.isPadrao} className={`bg-transparent w-full outline-none ${hasErr('Locations') && !row.nomeLocation ? 'text-red-600 placeholder-red-300' : ''}`} value={row.nomeLocation} placeholder="Nome Obrigatório" onChange={e => setLocations(locations.map(l => l.id === row.id ? {...l, nomeLocation: e.target.value} : l))} />
                          </td>
                          <td className={`px-6 py-4 ${hasErr('Qtd') && row.quantidade === null ? 'bg-red-50/50' : ''}`}>
                            <input type="number" min="0" disabled={isViewOnly} className={`w-20 p-2 rounded-xl font-black text-center bg-gray-50 dark:bg-slate-900 dark:text-slate-200 ${hasErr('Qtd') && row.quantidade === null ? 'border-2 border-red-500' : ''}`} value={row.quantidade ?? ''} onChange={e => setLocations(locations.map(l => l.id === row.id ? {...l, quantidade: e.target.value === '' ? null : Math.max(0, Number(e.target.value))} : l))} />
                          </td>
                          <td className={`px-6 py-4 ${hasErr('Data Antigo') && row.quantidade !== 0 && row.quantidade !== null && !row.dataMaisAntigo ? 'bg-red-50/50' : ''}`}>
                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                               <Box sx={{ minWidth: '150px' }}>
                                 <DatePickerField disabled={isViewOnly || row.quantidade === 0 || row.quantidade === null} value={row.dataMaisAntigo} onChange={v => handleLocationsDataChange(row.id, v)} />
                               </Box>
                               {row.dataMaisAntigo && (row.quantidade !== 0 && row.quantidade !== null) && (
                                 <Typography sx={{ fontWeight: 800, fontSize: '14px', color: obterCorDoBackgroundEnvio(row), letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                                   <span className="opacity-40"> - </span> {getEnvioDisplayText(row.dataMaisAntigo)}
                                 </Typography>
                               )}
                             </Box>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </PanelContainer>

              <PanelContainer title="Trânsito" icon={<Truck size={16} className="text-orange-500" />} onAdd={() => setTransit([...transit, { id: `m-${Date.now()}`, nomeTransito: '', diasPadrao: 0, quantidade: null, dataSaida: '', corBackground: 'verde' }])} isViewOnly={isViewOnly}>
                <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-slate-900 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest"><tr><th className="px-6 py-4">Tipo</th><th className="px-6 py-4">Quantidade</th><th className="px-6 py-4">Data Saída</th></tr></thead>
                  <tbody>
                    {transit.map(row => {
                      const dias = getDaysDiff(row.dataSaida);
                      return (
                        <tr key={row.id} className={`border-t border-gray-50 dark:border-slate-800 ${getRowStatusClasses(row, dias, 'transito')}`}>
                          <td className={`px-6 py-4 font-bold uppercase ${hasErr('Trânsito') && !row.nomeTransito ? 'bg-red-50/50' : ''}`}>
                            <input disabled={isViewOnly || row.isPadrao} className={`bg-transparent w-full outline-none ${hasErr('Trânsito') && !row.nomeTransito ? 'text-red-600 placeholder-red-300' : ''}`} value={row.nomeTransito} placeholder="Tipo Obrigatório" onChange={e => setTransit(transit.map(l => l.id === row.id ? {...l, nomeTransito: e.target.value} : l))} />
                          </td>
                          <td className={`px-6 py-4 ${hasErr('Qtd') && row.quantidade === null ? 'bg-red-50/50' : ''}`}>
                            <input type="number" min="0" disabled={isViewOnly} className={`w-20 p-2 rounded-xl font-black text-center bg-gray-50 dark:bg-slate-900 dark:text-slate-200 ${hasErr('Qtd') && row.quantidade === null ? 'border-2 border-red-500' : ''}`} value={row.quantidade ?? ''} onChange={e => setTransit(transit.map(l => l.id === row.id ? {...l, quantidade: e.target.value === '' ? null : Math.max(0, Number(e.target.value))} : l))} />
                          </td>
                          <td className={`px-6 py-4 ${hasErr('Data Saída') && row.quantidade !== 0 && row.quantidade !== null && !row.dataSaida ? 'bg-red-50/50' : ''}`}>
                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                               <Box sx={{ minWidth: '150px' }}>
                                 <DatePickerField disabled={isViewOnly || row.quantidade === 0 || row.quantidade === null} value={row.dataSaida} onChange={v => handleTransitDataChange(row.id, v)} />
                               </Box>
                               {row.dataSaida && (row.quantidade !== 0 && row.quantidade !== null) && (
                                 <Typography sx={{ fontWeight: 800, fontSize: '14px', color: obterCorDoBackgroundEnvio(row), letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                                   <span className="opacity-40"> - </span> {getEnvioDisplayText(row.dataMaisAntigo)}
                                 </Typography>
                               )}
                             </Box>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </PanelContainer>

              <PanelContainer title="Saldo Crítico" icon={<AlertOctagon size={16} className="text-orange-500" />} onAdd={() => setCritical([...critical, { id: `m-${Date.now()}`, partNumber: '', lote: '', saldoSistema: null, saldoFisico: null, corBackground: 'verde' }])} isViewOnly={isViewOnly}>
                <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-slate-900 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                    <tr>
                      <th className="px-6 py-4">PN</th>
                      <th className="px-6 py-4">Lote/Série</th>
                      <th className="px-6 py-4 text-center">Sistema</th>
                      <th className="px-6 py-4 text-center">Físico</th>
                      <th className="px-6 py-4 text-center">Diferença</th>
                    </tr>
                  </thead>
                  <tbody>
                    {critical.map(row => {
                      const diff = (row.saldoSistema || 0) - (row.saldoFisico || 0);
                      const absDiff = Math.abs(diff);
                      const precisaLote = (row.saldoSistema !== 0 || row.saldoFisico !== 0) && (row.saldoSistema !== null && row.saldoFisico !== null);
                      return (
                        <tr key={row.id} className={`border-t border-gray-50 dark:border-slate-800 ${getRowStatusClasses(row, absDiff, 'itens_criticos')}`}>
                          <td className={`px-6 py-4 font-bold uppercase ${hasErr('Saldo Crítico') && !row.partNumber ? 'bg-red-50/50' : ''}`}>
                            <input disabled={isViewOnly || row.isPadrao} className={`bg-transparent w-full outline-none ${hasErr('Saldo Crítico') && !row.partNumber ? 'text-red-600' : ''}`} value={row.partNumber} placeholder="PN Obrigatório" onChange={e => handleCriticalFieldChange(row.id, 'partNumber', e.target.value)} />
                          </td>
                          <td className={`px-6 py-4 font-bold uppercase ${hasErr('Lote') && precisaLote && !row.lote ? 'bg-red-50/50' : ''}`}>
                            <input disabled={isViewOnly} className={`bg-transparent w-full outline-none ${hasErr('Lote') && precisaLote && !row.lote ? 'text-red-600' : ''}`} value={row.lote} placeholder={precisaLote ? "Lote Obrigatório" : "N/S or Lote"} onChange={e => handleCriticalFieldChange(row.id, 'lote', e.target.value)} />
                          </td>
                          <td className={`px-6 py-4 text-center ${hasErr('Sistema') && row.saldoSistema === null ? 'bg-red-50/50' : ''}`}>
                            <input type="number" min="0" disabled={isViewOnly} className={`w-16 p-2 rounded-xl font-black text-center bg-white/50 dark:bg-white/10 ${hasErr('Sistema') && row.saldoSistema === null ? 'border-2 border-red-500' : ''}`} value={row.saldoSistema ?? ''} onChange={e => handleCriticalFieldChange(row.id, 'saldoSistema', e.target.value === '' ? null : Number(e.target.value))} />
                          </td>
                          <td className={`px-6 py-4 text-center ${hasErr('Físico') && row.saldoFisico === null ? 'bg-red-50/50' : ''}`}>
                            <input 
                              type="number" 
                              min="0"
                              disabled={isViewOnly} 
                              className={`w-16 p-2 rounded-xl font-black text-center bg-white/50 dark:bg-white/10 ${hasErr('Físico') && row.saldoFisico === null ? 'border-2 border-red-500' : ''}`} 
                              value={row.saldoFisico ?? ''} 
                              onChange={e => handleCriticalFieldChange(row.id, 'saldoFisico', e.target.value === '' ? null : Number(e.target.value))}
                              onBlur={() => evaluateAlert(row, Math.abs((row.saldoSistema||0) - (row.saldoFisico||0)), 'itens_criticos')}
                            />
                          </td>
                          <td className="px-6 py-4 text-center font-black">{diff}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </PanelContainer>
           </section>

           <section className={`space-y-12 pb-12 transition-all ${isFormLocked ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
              <div className="px-4">
                <h2 className="text-2xl font-black text-gray-800 dark:text-slate-100 uppercase tracking-tighter">Processos Operacionais</h2>
                <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-1">Acompanhamento de produtividade de {currentBase?.sigla}.</p>
              </div>
              
              <div className="flex flex-col gap-16">
                 {opCategories.map(cat => (
                    <div key={cat.id} className="w-full space-y-6">
                       <h3 className="px-4 text-xl font-black text-gray-800 dark:text-slate-100 uppercase tracking-tight flex items-center space-x-3">
                         <div className="w-1.5 h-6 bg-orange-600 rounded-full" />
                         <span>{cat.nome}</span>
                       </h3>
                       
                       <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden divide-y divide-gray-50 dark:divide-slate-700">
                          {cat.exibicao === 'lista' ? (
                            opTasks.filter(t => t.categoriaId === cat.id).map(task => (
                              <div key={task.id} className={`p-6 flex items-center justify-between hover:bg-orange-50/10 dark:hover:bg-orange-950/10 transition-colors ${hasErr(`Processos Operacionais - ${cat.nome}`) && (tarefasValores[task.id] === undefined || tarefasValores[task.id] === null || tarefasValores[task.id] === '') ? 'bg-red-50 dark:bg-red-950/20' : ''}`}>
                                <div className="flex flex-col">
                                  <span className={`text-sm font-black uppercase ${hasErr(`Processos Operacionais - ${cat.nome}`) && (tarefasValores[task.id] === undefined || tarefasValores[task.id] === null || tarefasValores[task.id] === '') ? 'text-red-600' : 'text-gray-700 dark:text-slate-200'}`}>{task.nome}</span>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-[10px] font-bold text-gray-300 dark:text-slate-500 uppercase">{task.tipoMedida}</span>
                                    {task.tipoMedida === MeasureType.QTD && (
                                      <span className="text-[10px] font-bold text-orange-400 uppercase tracking-tighter italic">Fator: {minutesToHhmmss(task.fatorMultiplicador)}</span>
                                    )}
                                  </div>
                                </div>
                                {task.tipoMedida === MeasureType.TEMPO ? (
                                  <TimeInput disabled={isViewOnly} value={tarefasValores[task.id] || ''} onChange={v => setTarefasValores({...tarefasValores, [task.id]: v})} className={`w-32 p-4 bg-gray-50 dark:bg-slate-900 dark:text-orange-400 border-2 rounded-2xl font-black text-center text-orange-600 ${hasErr(`Processos Operacionais - ${cat.nome}`) && (tarefasValores[task.id] === undefined || tarefasValores[task.id] === null || tarefasValores[task.id] === '') ? 'border-red-500 ring-2 ring-red-500/10' : 'border-transparent'}`} />
                                ) : (
                                  <input type="number" min="0" disabled={isViewOnly} value={tarefasValores[task.id] || ''} onChange={e => setTarefasValores({...tarefasValores, [task.id]: e.target.value === '' ? '' : String(Math.max(0, Number(e.target.value)))})} placeholder="0" className={`w-24 p-4 bg-gray-50 dark:bg-slate-900 dark:text-slate-200 border-2 rounded-2xl font-black text-center ${hasErr(`Processos Operacionais - ${cat.nome}`) && (tarefasValores[task.id] === undefined || tarefasValores[task.id] === null || tarefasValores[task.id] === '') ? 'border-red-500 ring-2 ring-red-500/10' : 'border-transparent'}`} />
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="divide-y divide-gray-50 dark:divide-slate-700">
                               {nonRoutineTasks.filter(t => t.categoriaId === cat.id).map((nr, idx) => {
                                 const isInputVisivel = nr.nome.trim() !== '';
                                 const isPendente = isInputVisivel && (nr.tempo === undefined || nr.tempo === null || nr.tempo === '');
                                 return (
                                   <div key={nr.id} className={`p-6 flex flex-col md:flex-row items-center gap-4 hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors ${isPendente ? 'bg-red-50/30 dark:bg-red-950/20' : ''}`}>
                                      <div className="flex-1 w-full">
                                        <label className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1 block">Nome da Atividade (Selecione ou Digite)</label>
                                        <input 
                                          disabled={isViewOnly} 
                                          list={`datalist-${cat.id}`}
                                          value={nr.nome} 
                                          onChange={e => handleDynamicRowTaskChange(nr.id, e.target.value, cat.id)} 
                                          placeholder="Escolha na lista ou descreva..." 
                                          className="w-full p-4 bg-gray-50 dark:bg-slate-900 dark:text-slate-200 border-transparent rounded-2xl font-bold text-sm outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-orange-100 dark:focus:border-slate-600 transition-all" 
                                        />
                                      </div>
                                      {isInputVisivel && (
                                        <div className="w-full md:w-auto animate-in fade-in slide-in-from-right-2">
                                          <div className="flex items-center space-x-2 mb-1">
                                            {nr.tipoMedida === MeasureType.QTD ? <Hash size={10} className="text-gray-400" /> : <Timer size={10} className="text-gray-400" />}
                                            <label className={`text-[9px] font-black uppercase tracking-widest block ${isPendente ? 'text-red-500 dark:text-red-400' : 'text-gray-400 dark:text-slate-500'}`}>
                                              {nr.tipoMedida === MeasureType.QTD ? 'Quantidade' : 'Tempo HH:MM:SS'}
                                            </label>
                                          </div>
                                          
                                          {nr.tipoMedida === MeasureType.QTD ? (
                                            <input 
                                              type="number"
                                              min="0"
                                              disabled={isViewOnly}
                                              value={nr.tempo}
                                              onChange={e => setNonRoutineTasks(nonRoutineTasks.map(item => item.id === nr.id ? {...item, tempo: e.target.value === '' ? '' : String(Math.max(0, Number(e.target.value)))} : item))}
                                              placeholder="0"
                                              className={`w-40 p-4 rounded-2xl font-black text-center transition-all ${isPendente ? 'bg-red-50 dark:bg-red-900/30 border-2 border-red-500' : 'bg-gray-50 dark:bg-slate-900 dark:text-slate-200 border-transparent'}`}
                                            />
                                          ) : (
                                            <TimeInput 
                                              disabled={isViewOnly} 
                                              value={nr.tempo} 
                                              onChange={v => setNonRoutineTasks(nonRoutineTasks.map(item => item.id === nr.id ? {...item, tempo: v} : item))} 
                                              className={`w-40 p-4 rounded-2xl font-black text-center transition-all ${isPendente ? 'bg-red-50 dark:bg-red-900/30 border-2 border-red-500 text-red-600' : 'bg-gray-50 dark:bg-slate-900 dark:text-orange-400 border-transparent text-orange-600'}`} 
                                            />
                                          )}
                                        </div>
                                      )}
                                      {!isViewOnly && (nonRoutineTasks.filter(f => f.categoriaId === cat.id).length > 1) && (
                                        <button onClick={() => setNonRoutineTasks(nonRoutineTasks.filter(item => item.id !== nr.id))} className="mt-5 p-3 text-gray-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 bg-gray-100 dark:bg-slate-900 rounded-xl"><Trash2 size={18}/></button>
                                      )}
                                   </div>
                                 );
                               })}
                               {!isViewOnly && (
                                 <div className="p-4 bg-gray-50/30 dark:bg-slate-900/30 flex justify-center">
                                   <button onClick={() => setNonRoutineTasks([...nonRoutineTasks, { id: `nr-${cat.id}-${Date.now()}`, nome: '', tempo: '', categoriaId: cat.id, tipoMedida: MeasureType.TEMPO }])} className="flex items-center space-x-2 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                                     <PlusCircle size={16} /> <span>Adicionar Linha</span>
                                   </button>
                                 </div>
                               )}
                            </div>
                          )}
                       </div>
                    </div>
                 ))}
              </div>
           </section>
        </div>
      </div>

      {!isViewOnly && (
        <div className="fixed bottom-8 right-8 z-40 flex items-center space-x-4">
          <button onClick={salvarDadosInternal} className="bg-gray-800 text-white px-8 py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-black transition-all flex items-center space-x-3 border-4 border-white dark:border-slate-800">
            {statusSalvamento === 'salvando' ? <RefreshCw className="animate-spin" /> : <Save />}
            <span>{statusSalvamento === 'salvando' ? 'Salvando...' : 'Salvar Rascunho Isolado'}</span>
          </button>
          <button onClick={handleFinalize} className="bg-orange-600 text-white px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center space-x-3 border-4 border-white dark:border-slate-800">
            <CheckCircle size={20} />
            <span>{editId ? 'Salvar Alterações' : 'Finalizar Passagem'}</span>
          </button>
        </div>
      )}
    </div>
  );
};

const KpiItem: React.FC<{label: string, value: string, icon: any}> = ({label, value, icon}) => (
  <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 flex flex-col items-center">
     <div className="flex items-center space-x-2 text-gray-400 dark:text-slate-500">{icon}<span className="text-[9px] font-black uppercase tracking-widest">{label}</span></div>
     <span className="text-base font-black text-gray-800 dark:text-slate-100">{value}</span>
  </div>
);

const PanelContainer: React.FC<{title: string, icon: any, children: any, onAdd: any, isViewOnly: boolean}> = ({ title, icon, children, onAdd, isViewOnly }) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center px-4">
      <h3 className="font-black text-gray-800 dark:text-slate-100 uppercase tracking-widest flex items-center space-x-3 text-sm"><div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">{icon}</div><span>{title}</span></h3>
      {!isViewOnly && <button onClick={onAdd} className="text-[10px] font-black text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20 px-5 py-2.5 rounded-2xl uppercase tracking-widest hover:bg-orange-600 hover:text-white dark:hover:bg-orange-600 transition-all">+ Adicionar</button>}
    </div>
    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">{children}</div>
  </div>
);

export default ShiftHandoverPage;
