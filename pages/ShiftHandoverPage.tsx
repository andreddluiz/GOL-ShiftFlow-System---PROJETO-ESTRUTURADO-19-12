
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  CheckCircle, Trash2, Info, Users, Clock, AlertTriangle, ClipboardList,
  X, TrendingUp, Timer, MapPin, Box as BoxIcon, Truck, FlaskConical, AlertOctagon, Plane, Settings,
  Calendar, UserCheck, Activity, BarChart3, MessageSquare, PlusCircle,
  Edit2, Hash, ChevronDown, CloudCheck, RefreshCw
} from 'lucide-react';
import { Box, Typography, Chip } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import { 
  MeasureType, OutraAtividade, Control, 
  LocationRow, TransitRow, ShelfLifeRow, CriticalRow, AlertConfig, ManagedItem,
  User, Task, Category, ConditionConfig, ShiftHandover
} from '../types';
import { DatePickerField, TimeInput, hhmmssToMinutes, minutesToHhmmss, ConfirmModal } from '../modals';
import { validationService, migrationService, sharedDraftService } from '../services';

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
  
  const [nonRoutineTasks, setNonRoutineTasks] = useState<OutraAtividade[]>([]);
  
  const [locations, setLocations] = useState<any[]>([]);
  const [transit, setTransit] = useState<any[]>([]);
  const [shelfLife, setShelfLife] = useState<any[]>([]);
  const [critical, setCritical] = useState<any[]>([]);
  
  const [activeAlert, setActiveAlert] = useState<{titulo: string, mensagem: string, color: string} | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ open: boolean, title: string, message: string, onConfirm: () => void, onCancel?: () => void, type?: 'danger' | 'warning' | 'info' | 'success', confirmLabel?: string, cancelLabel?: string }>({ open: false, title: '', message: '', onConfirm: () => {} });
  
  // Controle de Sincronia Multi-usuário
  const [lastLocalUpdate, setLastLocalUpdate] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Categorias e Tarefas Operacionais
  const opCategories = useMemo(() => allCats.filter(c => c.tipo === 'operacional' && c.status === 'Ativa' && c.visivel !== false && (!c.baseId || c.baseId === baseId)).sort((a,b) => a.ordem - b.ordem), [allCats, baseId]);
  const opTasks = useMemo(() => allTasks.filter(t => t.status === 'Ativa' && t.visivel !== false && (!t.baseId || t.baseId === baseId)), [allTasks, baseId]);

  // --- Lógica de Sincronização Compartilhada (Multi-usuário) ---
  
  // Carregar dados quando Data ou Turno mudam
  useEffect(() => {
    if (!baseId || !dataOperacional || !turnoAtivo || editId) return;

    const loadSharedDraft = async () => {
      const remote = await sharedDraftService.getDraft(baseId, dataOperacional, turnoAtivo);
      if (remote) {
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
        // Se não houver rascunho compartilhado, manter os campos limpos (ou rascunho local se preferir)
        resetCamposProducao();
      }
    };
    loadSharedDraft();
  }, [baseId, dataOperacional, turnoAtivo, editId]);

  // Auto-Save: Salvar rascunho compartilhado em cada alteração
  useEffect(() => {
    if (!baseId || !dataOperacional || !turnoAtivo || editId || status === 'Finalizado') return;

    const saveDraft = async () => {
      const now = new Date().getTime();
      setLastLocalUpdate(now);
      const content = { dataOperacional, turnoAtivo, colaboradoresIds, tarefasValores, obs, nonRoutineTasks, locations, transit, shelfLife, critical, status };
      await sharedDraftService.saveDraft(baseId, dataOperacional, turnoAtivo, content);
    };

    // Debounce manual simples para evitar excesso de escritas
    const timeout = setTimeout(saveDraft, 1000);
    return () => clearTimeout(timeout);
  }, [colaboradoresIds, tarefasValores, obs, nonRoutineTasks, locations, transit, shelfLife, critical]);

  // Polling de sincronização: Verificar se outros usuários atualizaram o mesmo turno
  useEffect(() => {
    if (!baseId || !dataOperacional || !turnoAtivo || editId || status === 'Finalizado') return;

    const syncWithRemote = async () => {
      setIsSyncing(true);
      const remote = await sharedDraftService.getDraft(baseId, dataOperacional, turnoAtivo);
      // Se o remoto for mais novo que a nossa última atualização local, atualizamos o estado
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

    const interval = setInterval(syncWithRemote, 5000); // Sincroniza a cada 5 segundos
    return () => clearInterval(interval);
  }, [baseId, dataOperacional, turnoAtivo, lastLocalUpdate, editId, status]);

  // Inicialização de tarefas dinâmicas (suspensas)
  useEffect(() => {
    if (!initialized || !opCategories.length) return;
    
    if (nonRoutineTasks.length === 0) {
      const initialDynamicRows: OutraAtividade[] = [];
      opCategories.forEach(cat => {
        if (cat.exibicao === 'suspensa') {
          for (let i = 0; i < 3; i++) {
            initialDynamicRows.push({ id: `dyn-${cat.id}-${Date.now()}-${i}`, nome: '', tempo: '', categoriaId: cat.id, tipoMedida: MeasureType.TEMPO });
          }
        }
      });
      setNonRoutineTasks(initialDynamicRows);
    }
  }, [initialized, opCategories]);

  // Carregar rascunho de EDIÇÃO (Relatórios)
  useEffect(() => {
    if (!baseId || !editId) return;
    const reportsRaw = localStorage.getItem('gol_rep_detalhamento');
    if (reportsRaw) {
      const reports = JSON.parse(reportsRaw);
      const record = reports.find((r: any) => r.id === editId);
      if (record) {
        setDataOperacional(record.data);
        setTurnoAtivo(record.turnoId);
        setColaboradoresIds(record.colaboradoresIds || [null, null, null, null, null, null]);
        setTarefasValores(record.tarefasExecutadas);
        setObs(record.informacoesImportantes || record.observacoes || '');
        setNonRoutineTasks(record.nonRoutineTasks || []);
        setLocations(record.locationsData || []);
        setTransit(record.transitData || []);
        setShelfLife(record.shelfLifeData || []);
        setCritical(record.criticalData || []);
        setStatus('Rascunho');
      }
    }
  }, [baseId, editId]);

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
       if (popups.verde.habilitado !== false) setActiveAlert({ titulo: popups.verde.titulo || 'OK', mensagem: popups.verde.mensagem.replace('X', String(val)), color: 'bg-green-600' });
    } else if (atendeCriterioAmarelo(cores.amarelo, val)) {
       if (popups.amarelo.habilitado !== false) setActiveAlert({ titulo: popups.amarelo.titulo || 'Atenção', mensagem: popups.amarelo.mensagem.replace('X', String(val)), color: 'bg-yellow-600' });
    } else if (atendeCriterioVermelho(cores.vermelho, val)) {
       if (popups.vermelho.habilitado !== false) setActiveAlert({ titulo: popups.vermelho.titulo || 'Crítico', mensagem: popups.vermelho.mensagem.replace('X', String(val)), color: 'bg-red-600' });
    }
  };

  const getRowStatusClasses = (item: any, val: number, controlType: string) => {
    const corStatus = item.corBackground;
    if (corStatus === 'vermelho') return 'bg-red-100 text-red-950 border-l-4 border-l-red-600 font-bold';
    if (corStatus === 'amarelo') return 'bg-yellow-100 text-yellow-950 border-l-4 border-l-yellow-500 font-bold';
    if (corStatus === 'verde') return 'bg-green-100 text-green-950 border-l-4 border-l-green-600 font-bold';
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
    setCritical(prev => prev.map(item => {
      if (item.id === id) {
        const newItem = { ...item, [field]: val };
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

  const hasErr = (keyword: string) => errosValidacao.some(err => err.includes(keyword));

  const handleColaboradorChange = (idx: number, id: string | null) => {
    if (id && colaboradoresIds.some((cid, i) => cid === id && i !== idx)) {
      const nome = baseUsers.find(u => u.id === id)?.nome || 'Selecionado';
      setActiveAlert({ titulo: 'COLABORADOR JÁ REGISTRADO', mensagem: `O colaborador '${nome}' já está registrado neste turno do dia ${dataOperacional}.`, color: 'bg-red-600' });
      return;
    }
    const n = [...colaboradoresIds]; n[idx] = id; setColaboradoresIds(n);
  };

  const resetCamposProducao = () => {
    setColaboradoresIds([null, null, null, null, null, null]);
    setTarefasValores({});
    setObs('');
    setNonRoutineTasks([]);
    setStatus('Rascunho');
    setErrosValidacao([]);
  };

  const handleFinalize = async () => {
    const errosOutras: string[] = [];
    nonRoutineTasks.forEach(t => { if (t.nome.trim() !== '' && (!t.tempo || t.tempo === '00:00:00')) errosOutras.push(`Entrada Suspensa: O valor para "${t.nome}" é obrigatório.`); });
    const handoverData: ShiftHandover = { id: editId || `sh_${Date.now()}`, baseId: baseId || '', data: dataOperacional, turnoId: turnoAtivo, colaboradores: colaboradoresIds, tarefasExecutadas: tarefasValores, nonRoutineTasks: nonRoutineTasks, locationsData: locations, transitData: transit, shelfLifeData: shelfLife, criticalData: critical, informacoesImportantes: obs, status: 'Finalizado', performance: performance, CriadoEm: new Date().toISOString(), updatedAt: new Date().toISOString() };
    const validacao = validationService.validarPassagem(handoverData, opTasks);
    const todosErros = [...validacao.camposPendentes, ...errosOutras];
    if (todosErros.length > 0) { setErrosValidacao(todosErros); setActiveAlert({ titulo: "Campos Pendentes", mensagem: "Existem campos obrigatórios não preenchidos:\n\n" + todosErros.join("\n"), color: "bg-red-600" }); return; }
    if (!editId) {
      const respDuplicada = await validationService.validarPassagemDuplicada(dataOperacional, turnoAtivo, baseId || '');
      if (!respDuplicada.valido) {
        const turnoNum = currentBase?.turnos.find(t => t.id === turnoAtivo)?.numero || turnoAtivo;
        setActiveAlert({ titulo: "PASSAGEM JÁ FINALIZADA", mensagem: respDuplicada.mensagem || `Já existe uma Passagem de Serviço finalizada para o dia ${dataOperacional} no Turno ${turnoNum}. Não é possível finalizar 2 vezes a mesma passagem.`, color: "bg-red-600" });
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
      setConfirmModal({ open: true, title: editId ? 'Alteração Salva com Sucesso!' : 'Passagem Finalizada com Sucesso!', message: editId ? 'As informações originais foram substituídas pelas novas no histórico.' : 'Seus dados foram migrados para Relatórios com sucesso.', type: 'success', confirmLabel: 'OK', cancelLabel: undefined, onConfirm: () => { if (editId) navigate('/reports'); else { resetCamposProducao(); setConfirmModal(prev => ({ ...prev, open: false })); window.scrollTo({ top: 0, behavior: 'smooth' }); } } });
    } catch (error) { setActiveAlert({ titulo: "Erro ao Finalizar", mensagem: "Ocorreu um erro ao finalizar a passagem. Tente novamente.", color: "bg-red-700" }); }
  };

  const isViewOnly = status === 'Finalizado';

  const handleDynamicRowTaskChange = (rowId: string, taskName: string, catId: string) => {
    const matchedTask = opTasks.find(t => t.nome === taskName && t.categoriaId === catId);
    setNonRoutineTasks(prev => prev.map(item => {
      if (item.id === rowId) {
        return { 
          ...item, 
          nome: taskName, 
          tipoMedida: matchedTask?.tipoMedida || MeasureType.TEMPO,
          fatorMultiplicador: matchedTask?.fatorMultiplicador || 0,
          tempo: '' // Limpar valor ao trocar tarefa para evitar conflito de tipos
        };
      }
      return item;
    }));
  };

  return (
    <div className="max-w-full mx-auto space-y-8 animate-in fade-in relative px-4 md:px-8">
      {opCategories.filter(c => c.exibicao === 'suspensa').map(cat => (
        <datalist key={`list-${cat.id}`} id={`datalist-${cat.id}`}>
          {opTasks.filter(t => t.categoriaId === cat.id).map(t => <option key={t.id} value={t.nome} />)}
        </datalist>
      ))}

      {editId && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl flex items-center justify-between">
           <div className="flex items-center space-x-3">
             <Edit2 className="text-amber-600 w-5 h-5" />
             <p className="text-sm font-bold text-amber-800 uppercase tracking-tight">MODO EDIÇÃO: Você está alterando um registro histórico existente.</p>
           </div>
           <button onClick={() => navigate('/reports')} className="text-xs font-black text-amber-600 uppercase hover:underline">Cancelar Edição</button>
        </div>
      )}

      {activeAlert && (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${activeAlert.color} text-white p-8 rounded-[2.5rem] shadow-2xl max-w-lg w-full border-4 border-white/20 text-center`}>
            <h4 className="text-2xl font-black uppercase mb-4">{activeAlert.titulo}</h4>
            <p className="font-bold mb-6 whitespace-pre-wrap">{activeAlert.mensagem}</p>
            <button onClick={() => setActiveAlert(null)} className="w-full bg-white text-gray-800 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-50">Fechar</button>
          </div>
        </div>
      )}

      <ConfirmModal isOpen={confirmModal.open} onClose={() => { if(confirmModal.onCancel) confirmModal.onCancel(); setConfirmModal({ ...confirmModal, open: false }); }} onConfirm={confirmModal.onConfirm} title={confirmModal.title} message={confirmModal.message} type={confirmModal.type} confirmLabel={confirmModal.confirmLabel} cancelLabel={confirmModal.cancelLabel} />

      <header className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
         <div className="flex items-center space-x-6">
            <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 shadow-inner"><Plane className="w-8 h-8" /></div>
            <div>
               <h2 className="text-3xl font-black text-gray-800 tracking-tighter">Passagem de Serviço</h2>
               <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">{currentBase?.nome} - {dataOperacional}</p>
            </div>
         </div>
         <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-gray-400 animate-pulse">
               {isSyncing ? <RefreshCw className="w-3 h-3 animate-spin text-orange-500" /> : <CloudCheck className="w-3 h-3 text-green-500" />}
               <span>{isSyncing ? 'Sincronizando...' : 'Auto-save Ativo'}</span>
            </div>
            <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${status === 'Rascunho' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-green-50 text-green-600 border-green-100'}`}>Status: {status}</div>
         </div>
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
                       {baseUsers.map(u => (
                         <option key={u.id} value={u.id}>
                           {u.nome} - {currentBase?.sigla} - {u.jornadaPadrao}h
                         </option>
                       ))}
                    </select>
                 ))}
              </div>
           </section>

           <section className="space-y-12">
              <div className="px-4">
                <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">Controles Diários</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Gestão de itens críticos e conformidade técnica.</p>
              </div>

              <PanelContainer title="Shelf Life" icon={<FlaskConical size={16} className="text-orange-500" />} onAdd={() => setShelfLife([...shelfLife, { id: `m-${Date.now()}`, partNumber: '', lote: '', dataVencimento: '', isPadrao: false, corBackground: 'verde' }])} isViewOnly={isViewOnly}>
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest"><tr><th className="px-6 py-4">Part Number</th><th className="px-6 py-4">Lote</th><th className="px-6 py-4">Vencimento</th></tr></thead>
                  <tbody>
                    {shelfLife.map(row => {
                      const dias = getDaysRemaining(row.dataVencimento);
                      return (
                        <tr key={row.id} className={`border-t border-gray-50 ${getRowStatusClasses(row, dias, 'shelf_life')} ${hasErr(row.partNumber) ? 'bg-red-50' : ''}`}>
                          <td className="px-6 py-4 font-bold uppercase"><input disabled={isViewOnly || row.isPadrao} className="bg-transparent w-full outline-none" value={row.partNumber} onChange={e => setShelfLife(shelfLife.map(l => l.id === row.id ? {...l, partNumber: e.target.value} : l))} /></td>
                          <td className="px-6 py-4 font-bold"><input disabled={isViewOnly} className="bg-transparent w-full outline-none" value={row.lote} onChange={e => setShelfLife(shelfLife.map(l => l.id === row.id ? {...l, lote: e.target.value} : l))} /></td>
                          <td className="px-6 py-4">
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
                  <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest"><tr><th className="px-6 py-4">Location</th><th className="px-6 py-4">Quantidade</th><th className="px-6 py-4">Mais Antigo</th></tr></thead>
                  <tbody>
                    {locations.map(row => {
                      const dias = getDaysDiff(row.dataMaisAntigo);
                      return (
                        <tr key={row.id} className={`border-t border-gray-50 ${getRowStatusClasses(row, dias, 'locations')} ${hasErr(row.nomeLocation) ? 'bg-red-50' : ''}`}>
                          <td className="px-6 py-4 font-bold uppercase"><input disabled={isViewOnly || row.isPadrao} className="bg-transparent w-full outline-none" value={row.nomeLocation} onChange={e => setLocations(locations.map(l => l.id === row.id ? {...l, nomeLocation: e.target.value} : l))} /></td>
                          <td className="px-6 py-4"><input type="number" disabled={isViewOnly} className="w-20 p-2 rounded-xl font-black text-center bg-gray-50" value={row.quantidade ?? ''} onChange={e => setLocations(locations.map(l => l.id === row.id ? {...l, quantidade: e.target.value === '' ? null : Number(e.target.value)} : l))} /></td>
                          <td className="px-6 py-4">
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
                  <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest"><tr><th className="px-6 py-4">Tipo</th><th className="px-6 py-4">Quantidade</th><th className="px-6 py-4">Data Saída</th></tr></thead>
                  <tbody>
                    {transit.map(row => {
                      const dias = getDaysDiff(row.dataSaida);
                      return (
                        <tr key={row.id} className={`border-t border-gray-50 ${getRowStatusClasses(row, dias, 'transito')} ${hasErr(row.nomeTransito) ? 'bg-red-50' : ''}`}>
                          <td className="px-6 py-4 font-bold uppercase"><input disabled={isViewOnly || row.isPadrao} className="bg-transparent w-full outline-none" value={row.nomeTransito} onChange={e => setTransit(transit.map(l => l.id === row.id ? {...l, nomeTransito: e.target.value} : l))} /></td>
                          <td className="px-6 py-4"><input type="number" disabled={isViewOnly} className="w-20 p-2 rounded-xl font-black text-center bg-gray-50" value={row.quantidade ?? ''} onChange={e => setTransit(transit.map(l => l.id === row.id ? {...l, quantidade: e.target.value === '' ? null : Number(e.target.value)} : l))} /></td>
                          <td className="px-6 py-4">
                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                               <Box sx={{ minWidth: '150px' }}>
                                 <DatePickerField disabled={isViewOnly || row.quantidade === 0 || row.quantidade === null} value={row.dataSaida} onChange={v => handleTransitDataChange(row.id, v)} />
                               </Box>
                               {row.dataSaida && (row.quantidade !== 0 && row.quantidade !== null) && (
                                 <Typography sx={{ fontWeight: 800, fontSize: '14px', color: obterCorDoBackgroundEnvio(row), letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                                   <span className="opacity-40"> - </span> {getEnvioDisplayText(row.dataSaida)}
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
                  <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
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
                      return (
                        <tr key={row.id} className={`border-t border-gray-50 ${getRowStatusClasses(row, absDiff, 'itens_criticos')} ${hasErr(row.partNumber) ? 'bg-red-50' : ''}`}>
                          <td className="px-6 py-4 font-bold uppercase"><input disabled={isViewOnly || row.isPadrao} className="bg-transparent w-full outline-none" value={row.partNumber} onChange={e => handleCriticalFieldChange(row.id, 'partNumber', e.target.value)} /></td>
                          <td className="px-6 py-4 font-bold uppercase"><input disabled={isViewOnly} className="bg-transparent w-full outline-none" value={row.lote} placeholder="N/S ou Lote" onChange={e => handleCriticalFieldChange(row.id, 'lote', e.target.value)} /></td>
                          <td className="px-6 py-4 text-center"><input type="number" disabled={isViewOnly} className="w-16 p-2 rounded-xl font-black text-center bg-white/50" value={row.saldoSistema ?? ''} onChange={e => handleCriticalFieldChange(row.id, 'saldoSistema', e.target.value === '' ? null : Number(e.target.value))} /></td>
                          <td className="px-6 py-4 text-center">
                            <input 
                              type="number" 
                              disabled={isViewOnly} 
                              className="w-16 p-2 rounded-xl font-black text-center bg-white/50" 
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

           <section className="space-y-12 pb-12">
              <div className="px-4">
                <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">Processos Operacionais</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Acompanhamento de produtividade por fluxo de trabalho.</p>
              </div>
              
              <div className="flex flex-col gap-16">
                 {opCategories.map(cat => (
                    <div key={cat.id} className="w-full space-y-6">
                       <h3 className="px-4 text-xl font-black text-gray-800 uppercase tracking-tight flex items-center space-x-3">
                         <div className="w-1.5 h-6 bg-orange-600 rounded-full" />
                         <span>{cat.nome}</span>
                       </h3>
                       
                       <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
                          {cat.exibicao === 'lista' ? (
                            opTasks.filter(t => t.categoriaId === cat.id).map(task => (
                              <div key={task.id} className={`p-6 flex items-center justify-between hover:bg-orange-50/10 transition-colors ${hasErr(task.nome) ? 'bg-red-50' : ''}`}>
                                <div className="flex flex-col">
                                  <span className="text-sm font-black text-gray-700 uppercase">{task.nome}</span>
                                  <span className="text-[10px] font-bold text-gray-300 uppercase">{task.tipoMedida}</span>
                                  {task.tipoMedida === MeasureType.QTD && (
                                    <span className="text-[9px] font-bold text-gray-400 italic">
                                      Fator Multiplicador: {task.fatorMultiplicador.toFixed(2)}
                                    </span>
                                  )}
                                </div>
                                {task.tipoMedida === MeasureType.TEMPO ? (
                                  <TimeInput disabled={isViewOnly} value={tarefasValores[task.id] || ''} onChange={v => setTarefasValores({...tarefasValores, [task.id]: v})} className="w-32 p-4 bg-gray-50 border-transparent rounded-2xl font-black text-center text-orange-600" />
                                ) : (
                                  <input type="number" disabled={isViewOnly} value={tarefasValores[task.id] || ''} onChange={e => setTarefasValores({...tarefasValores, [task.id]: e.target.value})} placeholder="0" className="w-24 p-4 bg-gray-50 border-transparent rounded-2xl font-black text-center" />
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="divide-y divide-gray-50">
                               {nonRoutineTasks.filter(t => t.categoriaId === cat.id).map((nr, idx) => {
                                 const isInputVisivel = nr.nome.trim() !== '';
                                 const isPendente = isInputVisivel && (!nr.tempo || nr.tempo === '00:00:00' || nr.tempo === '0');
                                 return (
                                   <div key={nr.id} className={`p-6 flex flex-col md:flex-row items-center gap-4 hover:bg-gray-50/50 transition-colors ${isPendente ? 'bg-red-50/30' : ''}`}>
                                      <div className="flex-1 w-full">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Nome da Atividade (Selecione ou Digite)</label>
                                        <input 
                                          disabled={isViewOnly} 
                                          list={`datalist-${cat.id}`}
                                          value={nr.nome} 
                                          onChange={e => handleDynamicRowTaskChange(nr.id, e.target.value, cat.id)} 
                                          placeholder="Escolha na lista ou descreva..." 
                                          className="w-full p-4 bg-gray-50 border-transparent rounded-2xl font-bold text-sm outline-none focus:bg-white focus:border-orange-100 transition-all" 
                                        />
                                      </div>
                                      {isInputVisivel && (
                                        <div className="w-full md:w-auto animate-in fade-in slide-in-from-right-2">
                                          <div className="flex items-center space-x-2 mb-1">
                                            {nr.tipoMedida === MeasureType.QTD ? <Hash size={10} className="text-gray-400" /> : <Timer size={10} className="text-gray-400" />}
                                            <label className={`text-[9px] font-black uppercase tracking-widest block ${isPendente ? 'text-red-500' : 'text-gray-400'}`}>
                                              {nr.tipoMedida === MeasureType.QTD ? 'Quantidade' : 'Tempo HH:MM:SS'} {isPendente && '(Obrigatório)'}
                                            </label>
                                          </div>
                                          
                                          {nr.tipoMedida === MeasureType.QTD ? (
                                            <input 
                                              type="number"
                                              disabled={isViewOnly}
                                              value={nr.tempo}
                                              onChange={e => setNonRoutineTasks(nonRoutineTasks.map(item => item.id === nr.id ? {...item, tempo: e.target.value} : item))}
                                              placeholder="0"
                                              className={`w-40 p-4 rounded-2xl font-black text-center transition-all ${isPendente ? 'bg-red-50 border-2 border-red-500' : 'bg-gray-50 border-transparent'}`}
                                            />
                                          ) : (
                                            <TimeInput 
                                              disabled={isViewOnly} 
                                              value={nr.tempo} 
                                              onChange={v => setNonRoutineTasks(nonRoutineTasks.map(item => item.id === nr.id ? {...item, tempo: v} : item))} 
                                              className={`w-40 p-4 rounded-2xl font-black text-center transition-all ${isPendente ? 'bg-red-50 border-2 border-red-500 text-red-600' : 'bg-gray-50 border-transparent text-orange-600'}`} 
                                            />
                                          )}
                                          
                                          {nr.tipoMedida === MeasureType.QTD && (
                                            <p className="text-[8px] font-bold text-gray-300 mt-1 uppercase text-center italic">Fator: {nr.fatorMultiplicador?.toFixed(2)}m</p>
                                          )}
                                        </div>
                                      )}
                                      {!isViewOnly && (nonRoutineTasks.filter(f => f.categoriaId === cat.id).length > 1) && (
                                        <button onClick={() => setNonRoutineTasks(nonRoutineTasks.filter(item => item.id !== nr.id))} className="mt-5 p-3 text-gray-300 hover:text-red-500 bg-gray-100 rounded-xl"><Trash2 size={18}/></button>
                                      )}
                                   </div>
                                 );
                               })}
                               {!isViewOnly && (
                                 <div className="p-4 bg-gray-50/30 flex justify-center">
                                   <button onClick={() => setNonRoutineTasks([...nonRoutineTasks, { id: `nr-${cat.id}-${Date.now()}`, nome: '', tempo: '', categoriaId: cat.id, tipoMedida: MeasureType.TEMPO }])} className="flex items-center space-x-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-orange-600 transition-colors">
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
        <div className="fixed bottom-8 right-8 z-40">
          <button onClick={handleFinalize} className="bg-orange-600 text-white px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center space-x-3 border-4 border-white"><CheckCircle size={20} /><span>{editId ? 'Salvar Alterações no Histórico' : 'Finalizar Passagem de Serviço'}</span></button>
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
