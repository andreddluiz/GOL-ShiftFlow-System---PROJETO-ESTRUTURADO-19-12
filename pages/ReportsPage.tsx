
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Chip, TextField, Box, Typography, Container, CircularProgress, 
  IconButton, Tooltip, Tabs, Tab,
  FormControl, InputLabel, Select, MenuItem, Alert
} from '@mui/material';
import { 
  Edit2, Sigma, LayoutList, BarChart,
  Printer, Calendar, LayoutDashboard, Globe, Clock, MapPin, ChevronRight, Search, Trash2
} from 'lucide-react';
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { PerformanceTurnoReport } from './PerformanceTurnoReport';
import { RelatorioProducaoPorBase } from './RelatorioProducaoPorBase';
import { useStore } from '../hooks/useStore';
import { authService } from '../services/authService';
import { dataAccessControlService } from '../services/dataAccessControlService';

// --- UTILITÁRIOS DE FORMATAÇÃO ---
function hhmmssToMinutes(hms: string): number {
  if (!hms || hms === '00:00:00') return 0;
  const parts = hms.split(':').map(Number);
  if (parts.length === 3) return (parts[0] * 60) + (parts[1] || 0) + (parts[2] || 0) / 60;
  return (parts[0] || 0) * 60;
}

function minutesToHhmmss(totalMinutes: number): string {
  if (isNaN(totalMinutes) || totalMinutes <= 0) return '00:00:00';
  const h = Math.floor(totalMinutes / 60);
  const m = Math.floor(totalMinutes % 60);
  const s = Math.round((totalMinutes * 60) % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const CATEGORY_ORDER_PRIORITY = [
  'RECEBER',
  'PRESERVAR / CONTROLAR',
  'FORNECER',
  'EXPEDIR',
  'LOGÍSTICA',
  'TAREFAS NÃO OPERACIONAIS',
  'OUTRAS TAREFAS'
];

function ordenarTarefasPorCategoria(tarefasUnicas: string[], mapaMeta: Record<string, { catNome: string, catOrdem: number, taskOrdem: number }>): string[] {
  return [...tarefasUnicas].sort((a, b) => {
    const metaA = mapaMeta[a] || { catNome: 'OUTROS', catOrdem: 999, taskOrdem: 999 };
    const metaB = mapaMeta[b] || { catNome: 'OUTROS', catOrdem: 999, taskOrdem: 999 };
    
    const idxA = CATEGORY_ORDER_PRIORITY.indexOf(metaA.catNome.toUpperCase());
    const idxB = CATEGORY_ORDER_PRIORITY.indexOf(metaB.catNome.toUpperCase());
    
    const priorityA = idxA === -1 ? 999 : idxA;
    const priorityB = idxB === -1 ? 999 : idxB;

    if (priorityA !== priorityB) return priorityA - priorityB;
    return metaA.taskOrdem - metaB.taskOrdem;
  });
}

const ReportSection: React.FC<{ title: string; subtitle: string; children: React.ReactNode; actions?: React.ReactNode; filters?: React.ReactNode }> = ({ title, subtitle, children, actions, filters }) => (
  <Box sx={{ mb: 6, '@media print': { mb: 2 } }}>
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'flex-end' }, mb: 2, px: 0.5, gap: 2 }}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 900, color: '#1f2937', mb: 0.5 }}>{title}</Typography>
        <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, display: 'block' }}>{subtitle.toUpperCase()}</Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }} className="no-print">
        {filters}
        {actions}
      </Box>
    </Box>
    {children}
  </Box>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const isPendente = status.toUpperCase() === 'PENDENTE';
  const color = status.toUpperCase() === 'OK' ? 'success' : (isPendente ? 'error' : 'default');
  
  return (
    <Chip 
      label={status.toUpperCase()} 
      size="small" 
      color={color}
      variant={isPendente ? "filled" : "outlined"}
      sx={{ 
        fontWeight: 900, 
        fontSize: '0.6rem', 
        height: 22,
        ...(isPendente && { bgcolor: '#ef4444', color: 'white', border: 'none' })
      }} 
    />
  );
};

const NoDataRows: React.FC<{ colSpan: number }> = ({ colSpan }) => (
  <TableRow>
    <TableCell colSpan={colSpan} align="center" sx={{ py: 12, color: '#9ca3af', fontStyle: 'italic', fontWeight: 800, fontSize: '0.75rem' }}>
      NENHUM REGISTRO DISPONÍVEL PARA O FILTRO ATUAL
    </TableCell>
  </TableRow>
);

const ReportsPage: React.FC<{ baseId?: string }> = ({ baseId }) => {
  const navigate = useNavigate();
  const { bases, initialized, refreshData } = useStore();
  const [usuario] = useState(() => authService.obterUsuarioAutenticado());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  const [filterBaseSelection, setFilterBaseSelection] = useState<string>('all');
  const [acompanhamento, setAcompanhamento] = useState<any[]>([]);
  const [mensalDetalhado, setMensalDetalhado] = useState<any[]>([]);
  const [detalhamento, setDetalhamento] = useState<any[]>([]);

  const [filterInicio, setFilterInicio] = useState(dayjs().startOf('month').format('YYYY-MM'));
  const [filterFim, setFilterFim] = useState(dayjs().format('YYYY-MM'));

  const [filtroConsolidadoMes, setFiltroConsolidadoMes] = useState<string>('all');
  const [filtroConsolidadoMensalMes, setFiltroConsolidatedMensalMes] = useState<string>('all');

  const basesAcessiveis = useMemo(() => dataAccessControlService.obterBasesAcessiveis(usuario, bases), [usuario, bases]);

  const podeExcluir = useMemo(() => {
    return usuario && ['ANALISTA', 'LÍDER', 'ADMINISTRADOR'].includes(usuario.perfil);
  }, [usuario]);

  const handleExcluirRegistro = (id: string) => {
    if (!window.confirm("Deseja realmente invalidar esta passagem de serviço? Ela continuará no histórico com um traço indicando a exclusão.")) return;

    const key = 'gol_rep_detalhamento';
    const raw = localStorage.getItem(key);
    if (!raw) return;

    const registros = JSON.parse(raw);
    const atualizados = registros.map((r: any) => r.id === id ? { ...r, excluido: true } : r);
    localStorage.setItem(key, JSON.stringify(atualizados));
    
    setDetalhamento(dataAccessControlService.filtrarDadosPorPermissao(atualizados.slice().reverse(), usuario));
  };

  const handleExcluirRegistroMensal = (id: string) => {
    if (!window.confirm("Deseja realmente invalidar esta coleta mensal? Ela continuará no histórico com um traço indicando a exclusão.")) return;

    const key = 'gol_rep_mensal_detalhado';
    const raw = localStorage.getItem(key);
    if (!raw) return;

    const registros = JSON.parse(raw);
    const atualizados = registros.map((r: any) => r.id === id ? { ...r, excluido: true } : r);
    localStorage.setItem(key, JSON.stringify(atualizados));
    
    const displayList = dataAccessControlService.filtrarDadosPorPermissao(atualizados.slice().reverse(), usuario);
    setMensalDetalhado(displayList);
  };

  useEffect(() => {
    if (!initialized) refreshData();
  }, [initialized, refreshData]);

  useEffect(() => {
    if (baseId) {
      setFilterBaseSelection(baseId);
    } else if (usuario && usuario.perfil !== 'ADMINISTRADOR') {
       setFilterBaseSelection('all');
    }
  }, [baseId, usuario]);

  useEffect(() => {
    const loadData = () => {
      const a = localStorage.getItem('gol_rep_acompanhamento');
      const d = localStorage.getItem('gol_rep_detalhamento');
      const md = localStorage.getItem('gol_rep_mensal_detalhado');
      
      let acompanhamentoData = a ? JSON.parse(a).reverse() : [];
      let detalhamentoData = d ? JSON.parse(d).reverse() : [];
      let mensalData = md ? JSON.parse(md).reverse() : [];

      setAcompanhamento(dataAccessControlService.filtrarDadosPorPermissao(acompanhamentoData, usuario));
      setDetalhamento(dataAccessControlService.filtrarDadosPorPermissao(detalhamentoData, usuario));
      setMensalDetalhado(dataAccessControlService.filtrarDadosPorPermissao(mensalData, usuario));
      
      setLoading(false);
    };
    loadData();
  }, [usuario]);

  const mapaCategoriasMeta = useMemo(() => {
    const map: Record<string, { catNome: string, catOrdem: number, taskOrdem: number }> = {};
    detalhamento.forEach(row => {
      if (row.activities) {
        row.activities.forEach((a: any) => {
          map[a.taskNome.toUpperCase()] = { catNome: a.categoryNome, catOrdem: a.ordemCat ?? 999, taskOrdem: a.ordemTask ?? 999 };
        });
      }
    });
    mensalDetalhado.forEach(row => {
      if (row.activities) {
        row.activities.forEach((a: any) => {
          map[a.taskNome.toUpperCase()] = { catNome: a.categoryNome, catOrdem: a.ordemCat ?? 999, taskOrdem: a.ordemTask ?? 999 };
        });
      }
    });
    return map;
  }, [detalhamento, mensalDetalhado]);

  const effectiveBaseFilter = filterBaseSelection;

  const acompanhamentoFiltrado = useMemo(() => {
    return acompanhamento.filter(row => {
      const parts = row.data.split('/');
      const date = dayjs(`${parts[2]}-${parts[1]}`);
      const withinDate = (date.isSame(dayjs(filterInicio), 'month') || date.isAfter(dayjs(filterInicio), 'month')) && 
                         (date.isSame(dayjs(filterFim), 'month') || date.isBefore(dayjs(filterFim), 'month'));
      const withinBase = effectiveBaseFilter === 'all' || row.baseId === effectiveBaseFilter;
      return withinDate && withinBase;
    });
  }, [acompanhamento, filterInicio, filterFim, effectiveBaseFilter]);

  const diarioFiltrado = useMemo(() => {
    return detalhamento.filter(row => {
      const parts = row.data.split('/');
      const date = dayjs(`${parts[2]}-${parts[1]}`);
      const withinDate = (date.isSame(dayjs(filterInicio), 'month') || date.isAfter(dayjs(filterInicio), 'month')) && 
                         (date.isSame(dayjs(filterFim), 'month') || date.isBefore(dayjs(filterFim), 'month'));
      const withinBase = effectiveBaseFilter === 'all' || row.baseId === effectiveBaseFilter;
      return withinDate && withinBase;
    });
  }, [detalhamento, filterInicio, filterFim, effectiveBaseFilter]);

  const mensalFiltrado = useMemo(() => {
    return mensalDetalhado.filter(row => {
      if (!row.mesReferencia) return false;
      const [m, y] = row.mesReferencia.split('/');
      const date = dayjs(`${y}-${m}-01`);
      const start = dayjs(filterInicio).startOf('month');
      const end = dayjs(filterFim).endOf('month');
      const withinDate = (date.isSame(start) || date.isAfter(start)) && (date.isSame(end) || date.isBefore(end));
      const withinBase = effectiveBaseFilter === 'all' || row.baseId === effectiveBaseFilter;
      return withinDate && withinBase;
    });
  }, [mensalDetalhado, filterInicio, filterFim, effectiveBaseFilter]);

  const mesesDisponiveisDiario = useMemo(() => {
    const set = new Set<string>();
    diarioFiltrado.forEach(r => {
      const parts = r.data.split('/');
      set.add(`${parts[1]}:${parts[2]}`);
    });
    return Array.from(set).sort().reverse();
  }, [diarioFiltrado]);

  const mesesDisponiveisMensal = useMemo(() => {
    const set = new Set<string>();
    mensalFiltrado.forEach(r => {
      const parts = r.mesReferencia.split('/');
      set.add(`${parts[0]}:${parts[1]}`);
    });
    return Array.from(set).sort().reverse();
  }, [mensalFiltrado]);

  const resumoVerticalDiario = useMemo(() => {
    const resumo: Record<string, { totalCatMins: number, tasks: Record<string, number> }> = {};
    let totalGeralMins = 0;
    
    diarioFiltrado.filter(row => {
      if (row.excluido) return false;
      if (filtroConsolidadoMes === 'all') return true;
      const parts = row.data.split('/');
      return `${parts[1]}:${parts[2]}` === filtroConsolidadoMes;
    }).forEach(row => {
      if (row.activities) {
        row.activities.forEach((act: any) => {
          const catName = act.categoryNome.toUpperCase();
          const taskName = act.taskNome.toUpperCase();
          const mins = hhmmssToMinutes(act.formatted || '00:00:00');
          
          if (!resumo[catName]) resumo[catName] = { totalCatMins: 0, tasks: {} };
          resumo[catName].totalCatMins += mins;
          resumo[catName].tasks[taskName] = (resumo[catName].tasks[taskName] || 0) + mins;
          totalGeralMins += mins;
        });
      }
    });

    const entries = Object.entries(resumo).sort((a, b) => {
      const idxA = CATEGORY_ORDER_PRIORITY.indexOf(a[0]);
      const idxB = CATEGORY_ORDER_PRIORITY.indexOf(b[0]);
      return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
    });

    return { entries, totalGeralMins };
  }, [diarioFiltrado, filtroConsolidadoMes]);

  const resumoVerticalMensal = useMemo(() => {
    const resumo: Record<string, { totalCatMins: number, tasks: Record<string, number> }> = {};
    let totalGeralMins = 0;
    
    mensalFiltrado.filter(row => {
      if (row.excluido) return false;
      if (filtroConsolidadoMensalMes === 'all') return true;
      const parts = row.mesReferencia.split('/');
      return `${parts[0]}:${parts[1]}` === filtroConsolidadoMensalMes;
    }).forEach(row => {
      if (row.activities) {
        row.activities.forEach((act: any) => {
          const catName = act.categoryNome.toUpperCase();
          const taskName = act.taskNome.toUpperCase();
          const mins = hhmmssToMinutes(act.formatted || '00:00:00');
          
          if (!resumo[catName]) resumo[catName] = { totalCatMins: 0, tasks: {} };
          resumo[catName].totalCatMins += mins;
          resumo[catName].tasks[taskName] = (resumo[catName].tasks[taskName] || 0) + mins;
          totalGeralMins += mins;
        });
      }
    });

    const entries = Object.entries(resumo).sort((a, b) => {
      const idxA = CATEGORY_ORDER_PRIORITY.indexOf(a[0]);
      const idxB = CATEGORY_ORDER_PRIORITY.indexOf(b[0]);
      return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
    });

    return { entries, totalGeralMins };
  }, [mensalFiltrado, filtroConsolidadoMensalMes]);

  const tarefasUnicas = useMemo(() => {
    const tarefas = new Set<string>();
    diarioFiltrado.forEach((linha) => { if (linha.tarefasMap) { Object.keys(linha.tarefasMap).forEach(t => tarefas.add(t)); } });
    return ordenarTarefasPorCategoria(Array.from(tarefas), mapaCategoriasMeta as any);
  }, [diarioFiltrado, mapaCategoriasMeta]);

  const tarefasUnicasMensais = useMemo(() => {
    const tarefas = new Set<string>();
    mensalFiltrado.forEach((linha) => { if (linha.tarefasMap) { Object.keys(linha.tarefasMap).forEach(t => tarefas.add(t)); } });
    return ordenarTarefasPorCategoria(Array.from(tarefas), mapaCategoriasMeta as any);
  }, [mensalFiltrado, mapaCategoriasMeta]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress color="warning" /></Box>;

  return (
    <Container maxWidth={false} sx={{ py: 4, animateIn: 'fade-in' }}>
      <Box sx={{ mb: 6, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 3 }}>
        <div>
          <Typography variant="h4" sx={{ fontWeight: 950, color: '#1f2937', tracking: '-0.02em' }}>HISTÓRICO OPERACIONAL</Typography>
          <Typography variant="caption" sx={{ fontWeight: 800, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Relatórios Consolidados e Auditoria de Passagem</Typography>
        </div>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="base-select-label" sx={{ fontWeight: 800, fontSize: '0.75rem' }} children="FILTRAR POR UNIDADE" />
            <Select
              labelId="base-select-label"
              value={filterBaseSelection}
              label="FILTRAR POR UNIDADE"
              onChange={(e) => setFilterBaseSelection(e.target.value)}
              sx={{ borderRadius: 3, fontWeight: 900, fontSize: '0.75rem', bgcolor: 'white' }}
            >
              <MenuItem value="all"><em>{usuario?.perfil === 'ADMINISTRADOR' ? 'Todas as Bases' : 'Minhas Unidades'}</em></MenuItem>
              {basesAcessiveis.map(b => (
                <MenuItem key={b.id} value={b.id}>{b.sigla} - {b.nome}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField type="month" size="small" label="Mês Início" value={filterInicio} onChange={e => setFilterInicio(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ bgcolor: 'white', borderRadius: 2 }} />
          <TextField type="month" size="small" label="Mês Fim" value={filterFim} onChange={e => setFilterFim(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ bgcolor: 'white', borderRadius: 2 }} />
          
          <IconButton sx={{ bgcolor: '#fff', border: '1px solid #e5e7eb', borderRadius: 3 }}><Printer size={18} /></IconButton>
        </Box>
      </Box>

      {usuario?.perfil !== 'ADMINISTRADOR' && (
        <Alert severity="info" sx={{ borderRadius: 4, mb: 4, fontWeight: 800 }}>
          Você tem acesso à visualização de {basesAcessiveis.length} unidade(s). Dados de outras bases não são exibidos por segurança.
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto">
          <Tab icon={<LayoutDashboard size={16} />} iconPosition="start" label="Acompanhamento" sx={{ fontWeight: 900, fontSize: '0.75rem' }} />
          <Tab icon={<LayoutList size={16} />} iconPosition="start" label="Detalhamento Diário" sx={{ fontWeight: 900, fontSize: '0.75rem' }} />
          <Tab icon={<Calendar size={16} />} iconPosition="start" label="Detalhamento Mensal" sx={{ fontWeight: 900, fontSize: '0.75rem' }} />
          <Tab icon={<BarChart size={16} />} iconPosition="start" label="Performance Turnos" sx={{ fontWeight: 900, fontSize: '0.75rem' }} />
          <Tab icon={<Globe size={16} />} iconPosition="start" label="Ranking de Bases" sx={{ fontWeight: 900, fontSize: '0.75rem' }} />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <ReportSection title="Status de Passagem" subtitle={`Acompanhamento de preenchimento (${effectiveBaseFilter === 'all' ? 'Minhas Bases' : bases.find(b => b.id === effectiveBaseFilter)?.sigla})`}>
          <TableContainer component={Paper} sx={{ borderRadius: 4, border: '1px solid #f3f4f6', boxShadow: 'none' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f9fafb' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 900, py: 2 }}>DATA</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>TURNO 1</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>TURNO 2</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>TURNO 3</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>TURNO 4</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {acompanhamentoFiltrado.length > 0 ? acompanhamentoFiltrado.map((row, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell sx={{ fontWeight: 800 }}>{row.data}</TableCell>
                    <TableCell><StatusBadge status={row.turno1} /></TableCell>
                    <TableCell><StatusBadge status={row.turno2} /></TableCell>
                    <TableCell><StatusBadge status={row.turno3} /></TableCell>
                    <TableCell><StatusBadge status={row.turno4} /></TableCell>
                  </TableRow>
                )) : <NoDataRows colSpan={5} />}
              </TableBody>
            </Table>
          </TableContainer>
        </ReportSection>
      )}

      {activeTab === 1 && (
        <>
          <ReportSection title="Produção Diária Detalhada" subtitle={`Visão granular por tarefa e turno (${effectiveBaseFilter === 'all' ? 'Minhas Bases' : bases.find(b => b.id === effectiveBaseFilter)?.sigla})`}>
            <TableContainer component={Paper} sx={{ borderRadius: 4, border: '1px solid #f3f4f6', boxShadow: 'none', overflowX: 'auto', mb: 4 }}>
              <Table size="small" sx={{ minWidth: 2000 }}>
                <TableHead sx={{ bgcolor: '#f9fafb' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 950, py: 3, position: 'sticky', left: 0, bgcolor: '#f9fafb', zIndex: 10 }}>DATA</TableCell>
                    <TableCell sx={{ fontWeight: 950, position: 'sticky', left: 80, bgcolor: '#f9fafb', zIndex: 10 }}>TURNO</TableCell>
                    <TableCell sx={{ fontWeight: 950 }}>EQUIPE</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 950 }}>H. DISP.</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 950 }}>H. PROD.</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 950 }}>PERF.</TableCell>
                    <TableCell sx={{ fontWeight: 950 }}>OBSERVAÇÕES</TableCell>
                    {tarefasUnicas.map(t => {
                      const meta = mapaCategoriasMeta[t.toUpperCase()];
                      return (
                        <TableCell key={t} align="center" sx={{ minWidth: 150, p: 1 }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
                            <Typography sx={{ fontSize: '8px', fontWeight: 900, color: '#9ca3af', textTransform: 'uppercase' }}>
                              {meta?.catNome || 'OUTROS'}
                            </Typography>
                            <Typography sx={{ fontSize: '10px', fontWeight: 900, color: '#4b5563', lineHeight: 1.1 }}>
                              {t.toUpperCase()}
                            </Typography>
                          </Box>
                        </TableCell>
                      );
                    })}
                    <TableCell align="right" sx={{ fontWeight: 950, position: 'sticky', right: 0, bgcolor: '#f9fafb', zIndex: 10 }}>AÇÕES</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {diarioFiltrado.length > 0 ? diarioFiltrado.map((row, idx) => (
                    <TableRow 
                      key={idx} 
                      hover 
                      sx={{ 
                        opacity: row.excluido ? 0.5 : 1,
                        bgcolor: row.excluido ? '#f3f4f6' : 'inherit',
                        '& .MuiTableCell-root': { textDecoration: row.excluido ? 'line-through' : 'none' }
                      }}
                    >
                      <TableCell sx={{ fontWeight: 800, position: 'sticky', left: 0, bgcolor: row.excluido ? '#f3f4f6' : '#fff', zIndex: 5 }}>{row.data}</TableCell>
                      <TableCell sx={{ fontWeight: 800, position: 'sticky', left: 80, bgcolor: row.excluido ? '#f3f4f6' : '#fff', zIndex: 5 }}>{row.turno}</TableCell>
                      <TableCell>
                        <Tooltip 
                          title={row.nomeColaboradores || ""}
                          children={
                            <Typography sx={{ fontSize: '11px', fontWeight: 700, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {row.nomeColaboradores || "-"}
                            </Typography>
                          }
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: '#6366f1' }}>{row.horasDisponivel}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: '#f97316' }}>{row.horasProduzida}</TableCell>
                      <TableCell align="right">
                        <Chip label={`${row.percentualPerformance}%`} size="small" color={(row.performance || row.percentualPerformance) >= 80 ? "success" : "warning"} sx={{ fontWeight: 900, fontSize: '0.65rem' }} />
                      </TableCell>
                      <TableCell>
                        <Tooltip 
                          title={row.observacoes || row.informacoesImportantes || ""}
                          children={
                            <Typography sx={{ fontSize: '11px', fontWeight: 600, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {row.observacoes || row.informacoesImportantes || "-"}
                            </Typography>
                          }
                        />
                      </TableCell>
                      {tarefasUnicas.map(t => (
                        <TableCell key={t} align="center" sx={{ color: (row.tarefasMap?.[t.toUpperCase()] || '00:00:00') === '00:00:00' ? '#d1d5db' : '#1f2937', fontWeight: 700, fontSize: '11px' }}>
                          {row.tarefasMap?.[t.toUpperCase()] || '00:00:00'}
                        </TableCell>
                      ))}
                      <TableCell align="right" sx={{ position: 'sticky', right: 0, bgcolor: row.excluido ? '#f3f4f6' : '#fff', zIndex: 5 }}>
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                          <IconButton size="small" color="primary" onClick={() => navigate(`/shift-handover?editId=${row.id}`)} disabled={row.excluido}>
                            <Edit2 size={16} />
                          </IconButton>
                          {podeExcluir && !row.excluido && (
                            <IconButton size="small" color="error" onClick={() => handleExcluirRegistro(row.id)}>
                              <Trash2 size={16} />
                            </IconButton>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  )) : <NoDataRows colSpan={tarefasUnicas.length + 8} />}
                </TableBody>
              </Table>
            </TableContainer>
          </ReportSection>
        </>
      )}

      {activeTab === 2 && (
        <>
          <ReportSection title="Produção Mensal Detalhada" subtitle={`Consolidado de metas mensais (${effectiveBaseFilter === 'all' ? 'Minhas Bases' : bases.find(b => b.id === effectiveBaseFilter)?.sigla})`}>
            <TableContainer component={Paper} sx={{ borderRadius: 4, border: '1px solid #f3f4f6', boxShadow: 'none', overflowX: 'auto', mb: 4 }}>
              <Table size="small" sx={{ minWidth: 1500 }}>
                <TableHead sx={{ bgcolor: '#f9fafb' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 950, py: 3, position: 'sticky', left: 0, bgcolor: '#f9fafb', zIndex: 10 }}>COMPETÊNCIA</TableCell>
                    <TableCell sx={{ fontWeight: 950, position: 'sticky', left: 120, bgcolor: '#f9fafb', zIndex: 10 }}>BASE</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 950 }}>TOTAL ACUM.</TableCell>
                    {tarefasUnicasMensais.map(t => {
                      const meta = mapaCategoriasMeta[t.toUpperCase()];
                      return (
                        <TableCell key={t} align="center" sx={{ minWidth: 150, p: 1 }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
                            <Typography sx={{ fontSize: '8px', fontWeight: 900, color: '#9ca3af', textTransform: 'uppercase' }}>
                              {meta?.catNome || 'MENSAL'}
                            </Typography>
                            <Typography sx={{ fontSize: '10px', fontWeight: 900, color: '#4b5563', lineHeight: 1.1 }}>
                              {t.toUpperCase()}
                            </Typography>
                          </Box>
                        </TableCell>
                      );
                    })}
                    <TableCell align="right" sx={{ fontWeight: 950, position: 'sticky', right: 0, bgcolor: '#f9fafb', zIndex: 10 }}>AÇÕES</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mensalFiltrado.length > 0 ? mensalFiltrado.map((row, idx) => (
                    <TableRow 
                      key={idx} 
                      hover 
                      sx={{ 
                        opacity: row.excluido ? 0.5 : 1,
                        bgcolor: row.excluido ? '#f3f4f6' : 'inherit',
                        '& .MuiTableCell-root': { textDecoration: row.excluido ? 'line-through' : 'none' }
                      }}
                    >
                      <TableCell sx={{ fontWeight: 800, position: 'sticky', left: 0, bgcolor: row.excluido ? '#f3f4f6' : '#fff', zIndex: 5 }}>{row.mesReferencia}</TableCell>
                      <TableCell sx={{ fontWeight: 800, position: 'sticky', left: 120, bgcolor: row.excluido ? '#f3f4f6' : '#fff', zIndex: 5 }}>{row.baseSigla || row.baseId}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 900, color: '#f97316' }}>{row.totalHoras}</TableCell>
                      {tarefasUnicasMensais.map(t => (
                        <TableCell key={t} align="center" sx={{ color: (row.tarefasMap?.[t.toUpperCase()] || '00:00:00') === '00:00:00' ? '#d1d5db' : '#1f2937', fontWeight: 700, fontSize: '11px' }}>
                          {row.tarefasMap?.[t.toUpperCase()] || '00:00:00'}
                        </TableCell>
                      ))}
                      <TableCell align="right" sx={{ position: 'sticky', right: 0, bgcolor: row.excluido ? '#f3f4f6' : '#fff', zIndex: 5 }}>
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                          <IconButton size="small" color="primary" onClick={() => navigate(`/monthly-collection?editId=${row.id}`)} disabled={row.excluido}>
                            <Edit2 size={16} />
                          </IconButton>
                          {podeExcluir && !row.excluido && (
                            <IconButton size="small" color="error" onClick={() => handleExcluirRegistroMensal(row.id)}>
                              <Trash2 size={16} />
                            </IconButton>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  )) : <NoDataRows colSpan={tarefasUnicasMensais.length + 4} />}
                </TableBody>
              </Table>
            </TableContainer>
          </ReportSection>
        </>
      )}

      {activeTab === 3 && (
        <PerformanceTurnoReport baseId={effectiveBaseFilter === 'all' ? undefined : effectiveBaseFilter} />
      )}
      
      {activeTab === 4 && <RelatorioProducaoPorBase />}
    </Container>
  );
};

export default ReportsPage;
