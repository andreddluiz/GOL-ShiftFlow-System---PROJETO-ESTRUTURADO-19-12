
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Chip, TextField, Box, Typography, Container, CircularProgress, 
  Button, IconButton, Tooltip, Divider, TablePagination, Tabs, Tab
} from '@mui/material';
import { 
  Download, BarChart, Copy, Edit2, FileSearch, Sigma, FileText, File as FileIcon, Filter, LayoutList,
  Printer, Calendar
} from 'lucide-react';
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

// --- UTILITÁRIOS DE FORMATAÇÃO ---
function hhmmssToMinutes(hms: string): number {
  if (!hms || hms === '00:00:00') return 0;
  const parts = hms.split(':').map(Number);
  return (parts[0] * 60) + (parts[1] || 0) + (parts[2] || 0) / 60;
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
  const color = status === 'OK' ? 'success' : 'default';
  return <Chip label={status.toUpperCase()} size="small" color={color} sx={{ fontWeight: 900, fontSize: '0.6rem', height: 22 }} />;
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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  const [acompanhamento, setAcompanhamento] = useState<any[]>([]);
  const [mensalDetalhado, setMensalDetalhado] = useState<any[]>([]);
  const [detalhamento, setDetalhamento] = useState<any[]>([]);

  const [filterInicio, setFilterInicio] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [filterFim, setFilterFim] = useState(dayjs().endOf('month').format('YYYY-MM-DD'));

  useEffect(() => {
    const loadData = () => {
      const a = localStorage.getItem('gol_rep_acompanhamento');
      const d = localStorage.getItem('gol_rep_detalhamento');
      const md = localStorage.getItem('gol_rep_mensal_detalhado');
      if (a) setAcompanhamento(JSON.parse(a).reverse());
      if (d) setDetalhamento(JSON.parse(d).reverse());
      if (md) setMensalDetalhado(JSON.parse(md).reverse());
      setLoading(false);
    };
    loadData();
  }, []);

  const consolidadoCategorias = useMemo(() => {
    const map: Record<string, { nome: string, diario: number, mensal: number, total: number }> = {};
    const diarioFiltrado = detalhamento.filter(row => {
      const [d, m, y] = row.data.split('/');
      const date = dayjs(`${y}-${m}-${d}`);
      return date.isAfter(dayjs(filterInicio).subtract(1, 'day')) && date.isBefore(dayjs(filterFim).add(1, 'day'));
    });

    const mensalFiltrado = mensalDetalhado.filter(row => {
      if (!row.mesReferencia) return false;
      const [m, y] = row.mesReferencia.split('/');
      const date = dayjs(`${y}-${m}-01`);
      const start = dayjs(filterInicio).startOf('month');
      const end = dayjs(filterFim).endOf('month');
      return (date.isSame(start) || date.isAfter(start)) && (date.isSame(end) || date.isBefore(end));
    });

    diarioFiltrado.forEach(row => {
      if (row.activities) {
        row.activities.forEach((a: any) => {
          const nome = a.categoryNome.toUpperCase();
          if (!map[nome]) map[nome] = { nome, diario: 0, mensal: 0, total: 0 };
          map[nome].diario += hhmmssToMinutes(a.formatted || '00:00:00');
        });
      }
    });

    mensalFiltrado.forEach(row => {
      if (row.activities) {
        row.activities.forEach((a: any) => {
          const nome = a.categoryNome.toUpperCase();
          if (!map[nome]) map[nome] = { nome, diario: 0, mensal: 0, total: 0 };
          map[nome].mensal += hhmmssToMinutes(a.formatted || '00:00:00');
        });
      }
    });

    return Object.values(map).map(item => ({
      ...item,
      total: item.diario + item.mensal,
      diarioF: minutesToHhmmss(item.diario),
      mensalF: minutesToHhmmss(item.mensal),
      totalF: minutesToHhmmss(item.diario + item.mensal)
    })).sort((a, b) => b.total - a.total);
  }, [detalhamento, mensalDetalhado, filterInicio, filterFim]);

  const totaisGeraisConsolidado = useMemo(() => {
    let d = 0; let m = 0; let t = 0;
    consolidadoCategorias.forEach(c => {
      d += hhmmssToMinutes(c.diarioF);
      m += hhmmssToMinutes(c.mensalF);
      t += c.total;
    });
    return { diario: minutesToHhmmss(d), mensal: minutesToHhmmss(m), total: minutesToHhmmss(t) };
  }, [consolidadoCategorias]);

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

  const tarefasUnicas = useMemo(() => {
    const tarefas = new Set<string>();
    detalhamento.forEach((linha) => { if (linha.tarefasMap) { Object.keys(linha.tarefasMap).forEach(t => tarefas.add(t)); } });
    return ordenarTarefasPorCategoria(Array.from(tarefas), mapaCategoriasMeta as any);
  }, [detalhamento, mapaCategoriasMeta]);

  const tarefasUnicasMensais = useMemo(() => {
    const tarefas = new Set<string>();
    mensalDetalhado.forEach((linha) => { if (linha.tarefasMap) { Object.keys(linha.tarefasMap).forEach(t => tarefas.add(t)); } });
    return ordenarTarefasPorCategoria(Array.from(tarefas), mapaCategoriasMeta as any);
  }, [mensalDetalhado, mapaCategoriasMeta]);

  const acompanhamentoFiltrado = useMemo(() => {
    return acompanhamento.filter(row => {
      const [d, m, y] = row.data.split('/');
      const date = dayjs(`${y}-${m}-${d}`);
      return date.isAfter(dayjs(filterInicio).subtract(1, 'day')) && date.isBefore(dayjs(filterFim).add(1, 'day'));
    });
  }, [acompanhamento, filterInicio, filterFim]);

  const diarioFiltrado = useMemo(() => {
    return detalhamento.filter(row => {
      const [d, m, y] = row.data.split('/');
      const date = dayjs(`${y}-${m}-${d}`);
      return date.isAfter(dayjs(filterInicio).subtract(1, 'day')) && date.isBefore(dayjs(filterFim).add(1, 'day'));
    });
  }, [detalhamento, filterInicio, filterFim]);

  const mensalFiltrado = useMemo(() => {
    return mensalDetalhado.filter(row => {
      if (!row.mesReferencia) return false;
      const [m, y] = row.mesReferencia.split('/');
      const date = dayjs(`${y}-${m}-01`);
      const start = dayjs(filterInicio).startOf('month');
      const end = dayjs(filterFim).endOf('month');
      return (date.isSame(start) || date.isAfter(start)) && (date.isSame(end) || date.isBefore(end));
    });
  }, [mensalDetalhado, filterInicio, filterFim]);

  const resumoTotaisDiario = useMemo(() => {
    const map: Record<string, { task: string, category: string, totalMin: number }> = {};
    const catSumMap: Record<string, number> = {};

    diarioFiltrado.forEach(row => {
      tarefasUnicas.forEach(t => {
        const time = row.tarefasMap?.[t] || '00:00:00';
        const mins = hhmmssToMinutes(time);
        const cat = mapaCategoriasMeta[t]?.catNome || 'OUTROS';
        if (!map[t]) map[t] = { task: t, category: cat, totalMin: 0 };
        map[t].totalMin += mins;
        catSumMap[cat] = (catSumMap[cat] || 0) + mins;
      });
    });

    const items = Object.values(map).filter(i => i.totalMin > 0).sort((a, b) => {
        const idxA = CATEGORY_ORDER_PRIORITY.indexOf(a.category.toUpperCase());
        const idxB = CATEGORY_ORDER_PRIORITY.indexOf(b.category.toUpperCase());
        if (idxA !== idxB) return idxA - idxB;
        return a.task.localeCompare(b.task);
    });

    const finalItems: any[] = [];
    let currentCat = "";
    items.forEach(item => {
      if (item.category !== currentCat) {
        currentCat = item.category;
        finalItems.push({ isSubtotal: true, category: currentCat, totalMin: catSumMap[currentCat] || 0 });
      }
      finalItems.push(item);
    });
    return finalItems;
  }, [diarioFiltrado, tarefasUnicas, mapaCategoriasMeta]);

  const resumoTotaisMensal = useMemo(() => {
    const map: Record<string, { task: string, category: string, totalMin: number }> = {};
    const catSumMap: Record<string, number> = {};

    mensalFiltrado.forEach(row => {
      if (row.activities) {
        row.activities.forEach((act: any) => {
          const t = act.taskNome.toUpperCase();
          const cat = act.categoryNome.toUpperCase();
          const mins = hhmmssToMinutes(act.formatted || '00:00:00');
          if (!map[t]) map[t] = { task: t, category: cat, totalMin: 0 };
          map[t].totalMin += mins;
          catSumMap[cat] = (catSumMap[cat] || 0) + mins;
        });
      }
    });

    const items = Object.values(map).filter(i => i.totalMin > 0).sort((a, b) => {
        const idxA = CATEGORY_ORDER_PRIORITY.indexOf(a.category.toUpperCase());
        const idxB = CATEGORY_ORDER_PRIORITY.indexOf(b.category.toUpperCase());
        if (idxA !== idxB) return idxA - idxB;
        return a.task.localeCompare(b.task);
    });

    const finalItems: any[] = [];
    let currentCat = "";
    items.forEach(item => {
      if (item.category !== currentCat) {
        currentCat = item.category;
        finalItems.push({ isSubtotal: true, category: currentCat, totalMin: catSumMap[currentCat] || 0 });
      }
      finalItems.push(item);
    });
    return finalItems;
  }, [mensalFiltrado]);

  const exportCSV = (tipo: 'diario' | 'mensal') => {
    const dados = tipo === 'diario' ? diarioFiltrado : mensalFiltrado;
    const tarefas = tipo === 'diario' ? tarefasUnicas : tarefasUnicasMensais;
    if (dados.length === 0) return;
    let headers = tipo === 'diario' ? 'DATA,TURNO,H.PROD.,% PERF.' : 'MES REFERENCIA,BASE,H. TOTAL MENSAL';
    tarefas.forEach(t => { headers += `,${t.replace(/,/g, '')}`; });
    headers += ',OBSERVAÇÕES';
    const rows = dados.map(row => {
      const basic = tipo === 'diario' ? [row.data, row.turno, row.horasProduzida, `${row.percentualPerformance}%`].join(',') : [row.mesReferencia, row.baseSigla, row.totalHoras].join(',');
      const taskValues = tarefas.map(t => row.tarefasMap?.[t] || '00:00:00').join(',');
      const extra = `,${(row.observacoes||'').replace(/,/g,';').replace(/\n/g,' ')}`;
      return `${basic},${taskValues}${extra}`;
    }).join('\n');
    const blob = new Blob([headers + '\n' + rows], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `relatorio_${tipo}_gol.csv`; a.click();
  };

  if (loading) return <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '60vh', gap: 2 }}><CircularProgress color="warning" /><Typography variant="caption" sx={{ fontWeight: 'bold' }}>CARREGANDO DADOS...</Typography></Box>;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }} className="no-print">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#374151', mb: 1 }}>Relatórios & Histórico</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase' }}>Consolidação integral de produtividade</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, bgcolor: 'white', p: 2, borderRadius: 4, border: '1px solid #f3f4f6', alignItems: 'center' }}>
            <Calendar size={18} className="text-gray-400" />
            <TextField type="date" label="De" value={filterInicio} onChange={e => setFilterInicio(e.target.value)} size="small" InputLabelProps={{ shrink: true }} />
            <TextField type="date" label="Até" value={filterFim} onChange={e => setFilterFim(e.target.value)} size="small" InputLabelProps={{ shrink: true }} />
            <IconButton color="primary" onClick={() => window.print()} title="Imprimir"><Printer size={20}/></IconButton>
          </Box>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 3 }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} textColor="inherit" indicatorColor="primary">
            <Tab label="P. DE SERVIÇO" sx={{ fontWeight: 800 }} />
            <Tab label="HISTÓRICO DETALHADO" sx={{ fontWeight: 800 }} />
            <Tab label="CONSOLIDADO" sx={{ fontWeight: 800 }} />
          </Tabs>
        </Box>
      </Box>

      {activeTab === 0 && (
        <ReportSection title="Status de Preenchimento" subtitle="Monitoramento de passagens por turno.">
          <TableContainer component={Paper} sx={{ borderRadius: '1.5rem', boxShadow: 'none', border: '1px solid #f3f4f6' }}>
            <Table><TableHead sx={{ bgcolor: '#f9fafb' }}><TableRow><TableCell sx={{ fontWeight: 900, fontSize: '0.7rem' }}>DATA OPERACIONAL</TableCell><TableCell align="center" sx={{ fontWeight: 900, fontSize: '0.7rem' }}>TURNO 1</TableCell><TableCell align="center" sx={{ fontWeight: 900, fontSize: '0.7rem' }}>TURNO 2</TableCell><TableCell align="center" sx={{ fontWeight: 900, fontSize: '0.7rem' }}>TURNO 3</TableCell><TableCell align="center" sx={{ fontWeight: 900, fontSize: '0.7rem' }}>TURNO 4</TableCell></TableRow></TableHead>
            <TableBody>{acompanhamentoFiltrado.map((row, i) => (<TableRow key={i} hover><TableCell sx={{ fontWeight: 'bold', color: '#4b5563' }}>{row.data}</TableCell><TableCell align="center"><StatusBadge status={row.turno1} /></TableCell><TableCell align="center"><StatusBadge status={row.turno2} /></TableCell><TableCell align="center"><StatusBadge status={row.turno3} /></TableCell><TableCell align="center"><StatusBadge status={row.turno4} /></TableCell></TableRow>))}{acompanhamentoFiltrado.length === 0 && <NoDataRows colSpan={5} />}</TableBody></Table>
          </TableContainer>
        </ReportSection>
      )}

      {activeTab === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* 1. RESUMO DIÁRIO */}
          <Box>
            <ReportSection title="1. Resumo de Totais por Categoria (Diário)" subtitle="Produtividade diária acumulada por fluxo.">
              <TableContainer component={Paper} sx={{ borderRadius: '1rem', border: '1px solid #f3f4f6' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#0f172a' }}><TableRow><TableCell sx={{ color: '#fff', fontWeight: 900, fontSize: '0.7rem' }}>FLUXO / TAREFA</TableCell><TableCell align="right" sx={{ color: '#f97316', fontWeight: 900, fontSize: '0.7rem' }}>TOTAL HORAS</TableCell></TableRow></TableHead>
                  <TableBody>
                    {resumoTotaisDiario.map((row, i) => (
                      <TableRow key={i} sx={{ bgcolor: row.isSubtotal ? '#f8fafc' : 'transparent' }}>
                        <TableCell sx={{ fontWeight: row.isSubtotal ? 950 : 800, pl: row.isSubtotal ? 2 : 4, fontSize: '0.75rem', color: row.isSubtotal ? '#1e293b' : '#64748b' }}>{row.isSubtotal ? `TOTAL ${row.category}` : row.task}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 950, fontSize: '0.75rem', color: row.isSubtotal ? '#1e293b' : '#f97316' }}>{minutesToHhmmss(row.totalMin)}</TableCell>
                      </TableRow>
                    ))}
                    {resumoTotaisDiario.length === 0 && <NoDataRows colSpan={2} />}
                  </TableBody>
                </Table>
              </TableContainer>
            </ReportSection>
          </Box>

          {/* 2. DETALHAMENTO DIÁRIO */}
          <Box>
            <ReportSection title="2. Detalhamento Diário" subtitle="Matriz de atividades por turno." actions={<Button startIcon={<Download size={16}/>} onClick={() => exportCSV('diario')} size="small" variant="contained" color="warning" sx={{ fontWeight: 900, borderRadius: 2 }}>Exportar CSV</Button>}>
              <TableContainer component={Paper} sx={{ borderRadius: '1rem', border: '1px solid #f3f4f6', overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 1500 }}>
                  <TableHead sx={{ bgcolor: '#f9fafb' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 900, fontSize: '0.65rem' }}>DATA</TableCell>
                      <TableCell sx={{ fontWeight: 900, fontSize: '0.65rem' }}>TURNO</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 900, fontSize: '0.65rem' }}>H.PROD.</TableCell>
                      {tarefasUnicas.map(t => <TableCell key={t} align="center" sx={{ fontSize: '0.65rem', fontWeight: 900, borderLeft: '1px solid #f3f4f6', color: '#ea580c' }}>{t}</TableCell>)}
                      <TableCell sx={{ fontWeight: 900, fontSize: '0.65rem', borderLeft: '1px solid #f3f4f6' }}>OBS</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {diarioFiltrado.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell sx={{ fontWeight: 800 }}>{row.data}</TableCell>
                        <TableCell><Chip label={row.turno} size="small" variant="outlined" sx={{ fontWeight: 900, fontSize: '0.6rem' }} color="warning" /></TableCell>
                        <TableCell align="right" sx={{ fontWeight: 900, color: '#f97316' }}>{row.horasProduzida}</TableCell>
                        {tarefasUnicas.map(t => <TableCell key={t} align="center" sx={{ fontSize: '0.7rem', borderLeft: '1px solid #f9fafb' }}>{row.tarefasMap?.[t] || '00:00:00'}</TableCell>)}
                        <TableCell sx={{ fontSize: '0.65rem', minWidth: 200 }}>{row.observacoes || '-'}</TableCell>
                      </TableRow>
                    ))}
                    {diarioFiltrado.length === 0 && <NoDataRows colSpan={4 + tarefasUnicas.length} />}
                  </TableBody>
                </Table>
              </TableContainer>
            </ReportSection>
          </Box>

          <Divider sx={{ borderStyle: 'dashed', my: 2 }} />

          {/* 3. RESUMO MENSAL */}
          <Box>
            <ReportSection title="3. Resumo Mensal por Categoria" subtitle="Acumulado da competência mensal por fluxo.">
              <TableContainer component={Paper} sx={{ borderRadius: '1rem', border: '1px solid #f3f4f6' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#0f172a' }}><TableRow><TableCell sx={{ color: '#fff', fontWeight: 900, fontSize: '0.7rem' }}>FLUXO / TAREFA</TableCell><TableCell align="right" sx={{ color: '#0284c7', fontWeight: 900, fontSize: '0.7rem' }}>TOTAL HORAS</TableCell></TableRow></TableHead>
                  <TableBody>
                    {resumoTotaisMensal.map((row, i) => (
                      <TableRow key={i} sx={{ bgcolor: row.isSubtotal ? '#f8fafc' : 'transparent' }}>
                        <TableCell sx={{ fontWeight: row.isSubtotal ? 950 : 800, pl: row.isSubtotal ? 2 : 4, fontSize: '0.75rem', color: row.isSubtotal ? '#1e293b' : '#64748b' }}>{row.isSubtotal ? `TOTAL ${row.category}` : row.task}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 950, fontSize: '0.75rem', color: row.isSubtotal ? '#1e293b' : '#0284c7' }}>{minutesToHhmmss(row.totalMin)}</TableCell>
                      </TableRow>
                    ))}
                    {resumoTotaisMensal.length === 0 && <NoDataRows colSpan={2} />}
                  </TableBody>
                </Table>
              </TableContainer>
            </ReportSection>
          </Box>

          {/* 4. DETALHAMENTO MENSAL */}
          <Box>
            <ReportSection title="4. Detalhamento Mensal" subtitle="Coleta consolidada por base e competência." actions={<Button startIcon={<Download size={16}/>} onClick={() => exportCSV('mensal')} size="small" variant="contained" color="primary" sx={{ fontWeight: 900, borderRadius: 2 }}>Exportar CSV</Button>}>
              <TableContainer component={Paper} sx={{ borderRadius: '1rem', border: '1px solid #f3f4f6', overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 1500 }}>
                  <TableHead sx={{ bgcolor: '#f9fafb' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 900, fontSize: '0.65rem' }}>MÊS</TableCell>
                      <TableCell sx={{ fontWeight: 900, fontSize: '0.65rem' }}>BASE</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 900, fontSize: '0.65rem' }}>H. TOTAL</TableCell>
                      {tarefasUnicasMensais.map(t => <TableCell key={t} align="center" sx={{ fontSize: '0.65rem', fontWeight: 900, borderLeft: '1px solid #f3f4f6', color: '#0284c7' }}>{t}</TableCell>)}
                      <TableCell align="center" className="no-print">AÇÕES</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mensalFiltrado.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell sx={{ fontWeight: 800 }}>{row.mesReferencia}</TableCell>
                        <TableCell><Chip label={row.baseSigla} size="small" sx={{ fontWeight: 900, fontSize: '0.6rem', bgcolor: '#0284c7', color: 'white' }} /></TableCell>
                        <TableCell align="right" sx={{ fontWeight: 900, color: '#0284c7' }}>{row.totalHoras}</TableCell>
                        {tarefasUnicasMensais.map(t => <TableCell key={t} align="center" sx={{ fontSize: '0.7rem', borderLeft: '1px solid #f9fafb' }}>{row.tarefasMap?.[t] || '00:00:00'}</TableCell>)}
                        <TableCell align="center" className="no-print">
                          <IconButton size="small" onClick={() => navigate(`/monthly-collection?editId=${row.id}`)} sx={{ color: '#0284c7' }}><Edit2 size={12} /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {mensalFiltrado.length === 0 && <NoDataRows colSpan={4 + tarefasUnicasMensais.length} />}
                  </TableBody>
                </Table>
              </TableContainer>
            </ReportSection>
          </Box>
        </Box>
      )}

      {activeTab === 2 && (
        <ReportSection title="Consolidado Integral por Categoria" subtitle="Soma total de produtividade: Diário + Mensal.">
          <TableContainer component={Paper} sx={{ borderRadius: '1.5rem', border: '1px solid #f3f4f6' }}>
            <Table><TableHead sx={{ bgcolor: '#0f172a' }}><TableRow><TableCell sx={{ color: '#fff', fontWeight: 900 }}>CATEGORIA</TableCell><TableCell align="center" sx={{ color: '#fff', fontWeight: 900 }}>DIÁRIO (H)</TableCell><TableCell align="center" sx={{ color: '#fff', fontWeight: 900 }}>MENSAL (H)</TableCell><TableCell align="center" sx={{ color: '#f97316', fontWeight: 900 }}>TOTAL ACUMULADO (H)</TableCell></TableRow></TableHead>
            <TableBody>
              {consolidadoCategorias.map((row, i) => (<TableRow key={i} hover><TableCell sx={{ fontWeight: 900, color: '#1e293b' }}>{row.nome}</TableCell><TableCell align="center" sx={{ color: '#64748b', fontWeight: 700 }}>{row.diarioF}</TableCell><TableCell align="center" sx={{ color: '#64748b', fontWeight: 700 }}>{row.mensalF}</TableCell><TableCell align="center" sx={{ fontWeight: 900, bgcolor: '#fff7ed', color: '#ea580c' }}>{row.totalF}</TableCell></TableRow>))}
              <TableRow sx={{ bgcolor: '#f8fafc' }}><TableCell sx={{ fontWeight: 950, color: '#0f172a' }}>TOTAL GERAL CONSOLIDADO</TableCell><TableCell align="center" sx={{ fontWeight: 950, color: '#0f172a' }}>{totaisGeraisConsolidado.diario}</TableCell><TableCell align="center" sx={{ fontWeight: 950, color: '#0f172a' }}>{totaisGeraisConsolidado.mensal}</TableCell><TableCell align="center" sx={{ fontWeight: 950, bgcolor: '#ea580c', color: '#fff' }}>{totaisGeraisConsolidado.total}</TableCell></TableRow>
            </TableBody></Table>
          </TableContainer>
        </ReportSection>
      )}
    </Container>
  );
};

export default ReportsPage;
