
import React, { useEffect, useState, useMemo } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Chip, TextField, Box, Typography, Container, CircularProgress, 
  Button, IconButton, Tooltip, Divider, TablePagination
} from '@mui/material';
import { 
  Download, BarChart, Copy, Edit2, FileSearch
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

// --- UTILITÁRIOS DE FORMATAÇÃO ---
const formatHhMmSs = (h: number, m: number = 0, s: number = 0) => {
  return `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.floor(m)).padStart(2, '0')}:${String(Math.round(s)).padStart(2, '0')}`;
};

function ordenarTarefasPorCategoria(tarefasUnicas: string[], mapaCategorias: Record<string, string>): string[] {
  const ordemCategoriasPreferencial = [
    '1. RECEBIMENTO',
    'RECEBIMENTO',
    '2. FORNECIMENTO',
    'FORNECER',
    'FORNECIMENTO',
    '3. DESCARREGAMENTO',
    'DESPACHO',
    '4. ARMAZENAGEM',
    'DEVOLUÇÃO DE MATERIAIS',
    '5. OUTROS'
  ];

  const grupos: Record<string, string[]> = {};
  tarefasUnicas.forEach(tarefa => {
    const cat = (mapaCategorias[tarefa] || '5. OUTROS').toUpperCase();
    if (!grupos[cat]) grupos[cat] = [];
    grupos[cat].push(tarefa);
  });

  const categoriasEncontradas = Object.keys(grupos).sort((a, b) => {
    const idxA = ordemCategoriasPreferencial.findIndex(p => a.includes(p));
    const idxB = ordemCategoriasPreferencial.findIndex(p => b.includes(p));
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  const resultado: string[] = [];
  categoriasEncontradas.forEach(cat => {
    const tarefasDoGrupo = grupos[cat].sort((a, b) => a.localeCompare(b));
    resultado.push(...tarefasDoGrupo);
  });

  return resultado;
}

const ReportSection: React.FC<{ title: string; subtitle: string; children: React.ReactNode; actions?: React.ReactNode }> = ({ title, subtitle, children, actions }) => (
  <Box sx={{ mb: 6 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, px: 0.5 }}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 900, color: '#1f2937', mb: 0.5 }}>{title}</Typography>
        <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, display: 'block' }}>{subtitle.toUpperCase()}</Typography>
      </Box>
      {actions}
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
  const [acompanhamento, setAcompanhamento] = useState<any[]>([]);
  const [resumo, setResumo] = useState<any>({ categorias: [], totalHoras: '00:00:00' });
  const [mensalDetalhado, setMensalDetalhado] = useState<any[]>([]);
  const [mensalResumo, setMensalResumo] = useState<any>({ categorias: [], totalHoras: '00:00:00' });
  const [detalhamento, setDetalhamento] = useState<any[]>([]);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  
  const [pageDiario, setPageDiario] = useState(0);
  const [rowsPerPageDiario, setRowsPerPageDiario] = useState(10);
  
  const [pageMensal, setPageMensal] = useState(0);
  const [rowsPerPageMensal, setRowsPerPageMensal] = useState(10);

  useEffect(() => {
    const loadData = () => {
      const a = localStorage.getItem('gol_rep_acompanhamento');
      const r = localStorage.getItem('gol_rep_resumo');
      const d = localStorage.getItem('gol_rep_detalhamento');
      const mr = localStorage.getItem('gol_rep_mensal_resumo');
      const md = localStorage.getItem('gol_rep_mensal_detalhado');
      
      if (a) setAcompanhamento(JSON.parse(a).reverse());
      if (r) setResumo(JSON.parse(r));
      if (d) setDetalhamento(JSON.parse(d).reverse());
      if (mr) setMensalResumo(JSON.parse(mr));
      if (md) setMensalDetalhado(JSON.parse(md).reverse());
      
      setLoading(false);
    };
    loadData();
  }, []);

  const mapaCategorias = useMemo(() => {
    const map: Record<string, string> = {};
    detalhamento.forEach(row => {
      if (row.activities) {
        row.activities.forEach((a: any) => {
          map[a.taskNome.toUpperCase()] = a.categoryNome;
        });
      }
      if (row.nonRoutineTasks) {
        row.nonRoutineTasks.forEach((t: any) => {
          map[`[EXTRA] ${t.nome.toUpperCase()}`] = "5. OUTROS";
        });
      }
    });
    return map;
  }, [detalhamento]);

  const tarefasUnicas = useMemo(() => {
    const tarefas = new Set<string>();
    detalhamento.forEach((linha) => {
      if (linha.tarefasMap) {
        Object.keys(linha.tarefasMap).forEach(t => tarefas.add(t));
      }
    });
    const tarefasArray = Array.from(tarefas);
    return ordenarTarefasPorCategoria(tarefasArray, mapaCategorias);
  }, [detalhamento, mapaCategorias]);

  const mapaCategoriasMensal = useMemo(() => {
    const map: Record<string, string> = {};
    mensalDetalhado.forEach(row => {
      if (row.activities) {
        row.activities.forEach((a: any) => {
          map[a.taskNome.toUpperCase()] = a.categoryNome;
        });
      }
    });
    return map;
  }, [mensalDetalhado]);

  const tarefasMensaisUnicas = useMemo(() => {
    const tarefas = new Set<string>();
    mensalDetalhado.forEach((linha) => {
      if (linha.tarefasMap) {
        Object.keys(linha.tarefasMap).forEach(t => tarefas.add(t));
      }
    });
    const tarefasArray = Array.from(tarefas);
    return ordenarTarefasPorCategoria(tarefasArray, mapaCategoriasMensal);
  }, [mensalDetalhado, mapaCategoriasMensal]);

  const dadosFiltradosDiario = useMemo(() => {
    return detalhamento.filter(row => {
      if (!dataInicio && !dataFim) return true;
      const [d, m, y] = row.data.split('/');
      const date = new Date(`${y}-${m}-${d}`);
      const start = dataInicio ? new Date(dataInicio) : new Date('1900-01-01');
      const end = dataFim ? new Date(dataFim) : new Date('2099-12-31');
      return date >= start && date <= end;
    });
  }, [detalhamento, dataInicio, dataFim]);

  const dadosFiltradosMensal = useMemo(() => {
    return mensalDetalhado.filter(row => {
      if (!dataInicio && !dataFim) return true;
      const [m, y] = row.mesReferencia.split('/');
      const date = new Date(`${y}-${m}-01`);
      const start = dataInicio ? new Date(dataInicio) : new Date('1900-01-01');
      const end = dataFim ? new Date(dataFim) : new Date('2099-12-31');
      return date >= start && date <= end;
    });
  }, [mensalDetalhado, dataInicio, dataFim]);

  const exportCSV = (tipo: 'diario' | 'mensal') => {
    const dados = tipo === 'diario' ? dadosFiltradosDiario : dadosFiltradosMensal;
    const tarefas = tipo === 'diario' ? tarefasUnicas : tarefasMensaisUnicas;
    if (dados.length === 0) return;

    let headers = tipo === 'diario' 
      ? 'DATA,REGISTRO EM,TURNO,H.DISP.,H.PROD.,% PERF.' 
      : 'MES REFERENCIA,BASE,H. TOTAL MENSAL';
    
    tarefas.forEach(t => { headers += `,${t.replace(/,/g, '')}`; });
    if (tipo === 'diario') headers += ',OBSERVAÇÕES';

    const rows = dados.map(row => {
      const basic = tipo === 'diario' 
        ? [row.data, row.CriadoEm, row.turno, row.horasDisponivel, row.horasProduzida, `${row.percentualPerformance}%`].join(',')
        : [row.mesReferencia, row.baseSigla, row.totalHoras].join(',');
        
      const taskValues = tarefas.map(t => row.tarefasMap?.[t] || '00:00:00').join(',');
      const extra = tipo === 'diario' ? `,${row.observacoes?.replace(/\n/g, ' ') || ''}` : '';
      return `${basic},${taskValues}${extra}`;
    }).join('\n');

    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `relatorio_${tipo}_gol_${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  const handleEdit = (id: string) => navigate(`/shift-handover?editId=${id}`);
  const handleEditMonthly = (id: string) => navigate(`/monthly-collection?editId=${id}`);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '60vh', gap: 2 }}>
        <CircularProgress color="warning" />
        <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'gray' }}>SINCRO OPERACIONAL EM CURSO...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: '#374151', letterSpacing: '-0.02em' }}>Relatórios & Compliance</Typography>
          <Typography variant="body2" sx={{ color: '#9ca3af', fontWeight: 600 }}>HISTÓRICO INTEGRAL DE PASSAGENS E COLETA MENSAL</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
           <TextField label="Início" type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} size="small" InputLabelProps={{ shrink: true }} />
           <TextField label="Fim" type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} size="small" InputLabelProps={{ shrink: true }} />
        </Box>
      </Box>

      {/* --- SEÇÃO DIÁRIA (LEGACY VISUALS) --- */}
      <ReportSection title="Painel de Acompanhamento de Turnos" subtitle="Status de preenchimento diário.">
        <TableContainer component={Paper} sx={{ borderRadius: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f9fafb' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 900, fontSize: '0.7rem' }}>DATA OPERACIONAL</TableCell>
                <TableCell align="center" sx={{ fontWeight: 900, fontSize: '0.7rem' }}>TURNO 1 (00-08)</TableCell>
                <TableCell align="center" sx={{ fontWeight: 900, fontSize: '0.7rem' }}>TURNO 2 (08-12)</TableCell>
                <TableCell align="center" sx={{ fontWeight: 900, fontSize: '0.7rem' }}>TURNO 3 (12-18)</TableCell>
                <TableCell align="center" sx={{ fontWeight: 900, fontSize: '0.7rem' }}>TURNO 4 (18-00)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {acompanhamento.map((row, i) => (
                <TableRow key={i} hover>
                  <TableCell sx={{ fontWeight: 'bold', color: '#4b5563' }}>{row.data}</TableCell>
                  <TableCell align="center"><StatusBadge status={row.turno1} /></TableCell>
                  <TableCell align="center"><StatusBadge status={row.turno2} /></TableCell>
                  <TableCell align="center"><StatusBadge status={row.turno3} /></TableCell>
                  <TableCell align="center"><StatusBadge status={row.turno4} /></TableCell>
                </TableRow>
              ))}
              {acompanhamento.length === 0 && <NoDataRows colSpan={5} />}
            </TableBody>
          </Table>
        </TableContainer>
      </ReportSection>

      <ReportSection title="Resumo Geral de Produtividade Diária" subtitle="Total acumulado das passagens de serviço.">
        <TableContainer component={Paper} sx={{ borderRadius: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f9fafb' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 900, fontSize: '0.7rem', width: '30%' }}>CATEGORIA</TableCell>
                <TableCell sx={{ fontWeight: 900, fontSize: '0.7rem' }}>MICRO-ATIVIDADE</TableCell>
                <TableCell sx={{ fontWeight: 900, fontSize: '0.7rem' }} align="center">TIPO INPUT</TableCell>
                <TableCell sx={{ fontWeight: 900, fontSize: '0.7rem' }} align="center">TOTAL QUANTIDADE</TableCell>
                <TableCell sx={{ fontWeight: 900, fontSize: '0.7rem' }} align="center">TOTAL HORAS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {resumo.categorias && resumo.categorias.map((cat: any, i: number) => (
                <React.Fragment key={cat.categoryId || i}>
                  <TableRow sx={{ bgcolor: '#fff' }}>
                    <TableCell sx={{ fontWeight: 900, color: '#111', fontSize: '0.8rem' }}>
                      {cat.categoryNome.toUpperCase()}
                      <Typography variant="caption" display="block" sx={{ color: '#ea580c', fontWeight: 800 }}>
                        Total Categoria: {cat.totalCategoryFormatted || "00:00:00"}
                      </Typography>
                    </TableCell>
                    <TableCell colSpan={4} />
                  </TableRow>
                  {cat.atividades.map((ativ: any, j: number) => (
                    <TableRow key={j} hover>
                      <TableCell />
                      <TableCell sx={{ fontSize: '0.75rem', fontWeight: 500, color: '#4b5563' }}>{ativ.nome}</TableCell>
                      <TableCell align="center" sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#9ca3af' }}>{ativ.tipoInput === 'CUSTOM' ? 'Customizada' : ativ.tipoInput}</TableCell>
                      <TableCell align="center" sx={{ fontSize: '0.8rem', fontWeight: 800 }}>{ativ.totalQuantidade || '-'}</TableCell>
                      <TableCell align="center" sx={{ fontSize: '0.8rem', fontWeight: 800, color: '#111' }}>{ativ.totalFormatted || "00:00:00"}</TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              ))}
              <TableRow sx={{ bgcolor: '#0f172a' }}>
                <TableCell colSpan={4} align="right" sx={{ py: 3, fontWeight: 900, color: '#fff', letterSpacing: '0.1em', fontSize: '0.75rem' }}>TOTAL DIÁRIO ACUMULADO:</TableCell>
                <TableCell align="center" sx={{ py: 3, fontWeight: 900, color: '#f97316', fontSize: '1rem' }}>{resumo.totalHoras || "00:00:00"}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </ReportSection>

      <ReportSection 
        title="Detalhamento Diário (Exportação)" 
        subtitle="Matriz integral de passagens por fluxo operacional."
        actions={<Button startIcon={<Download size={16}/>} onClick={() => exportCSV('diario')} size="small" variant="contained" color="warning" sx={{ fontWeight: 900, textTransform: 'none' }}>Baixar CSV Diário</Button>}
      >
        <TableContainer component={Paper} sx={{ borderRadius: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 2000 + (tarefasUnicas.length * 120) }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f9fafb' }}>
                <TableCell sx={{ fontWeight: 900, fontSize: '0.65rem' }}>DATA</TableCell>
                <TableCell sx={{ fontWeight: 900, fontSize: '0.65rem' }}>TURNO</TableCell>
                <TableCell align="right" sx={{ fontWeight: 900, fontSize: '0.65rem' }}>H.DISP.</TableCell>
                <TableCell align="right" sx={{ fontWeight: 900, fontSize: '0.65rem' }}>H.PROD.</TableCell>
                <TableCell align="right" sx={{ fontWeight: 900, fontSize: '0.65rem' }}>% PERF.</TableCell>
                {tarefasUnicas.map(t => (
                  <TableCell key={t} align="center" sx={{ fontWeight: 900, fontSize: '0.6rem', minWidth: 120, borderLeft: '1px solid #e5e7eb', color: t.includes('[EXTRA]') ? '#0284c7' : '#ea580c' }}>
                    {t.replace('[EXTRA] ', '')}
                  </TableCell>
                ))}
                <TableCell align="center" sx={{ position: 'sticky', right: 0, bgcolor: '#f9fafb', borderLeft: '1px solid #e5e7eb' }}>AÇÕES</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dadosFiltradosDiario.slice(pageDiario * rowsPerPageDiario, pageDiario * rowsPerPageDiario + rowsPerPageDiario).map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ fontWeight: 800 }}>{row.data}</TableCell>
                  <TableCell><Chip label={row.turno} size="small" variant="outlined" sx={{ fontWeight: 800, fontSize: '0.6rem' }} color="warning" /></TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#6b7280' }}>{row.horasDisponivel}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 900, color: '#ea580c' }}>{row.horasProduzida}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 900, color: '#10b981' }}>{row.percentualPerformance}%</TableCell>
                  {tarefasUnicas.map(t => (
                    <TableCell key={t} align="center" sx={{ fontSize: '0.7rem', fontWeight: 800 }}>{row.tarefasMap?.[t] || '00:00:00'}</TableCell>
                  ))}
                  <TableCell align="center" sx={{ position: 'sticky', right: 0, bgcolor: '#fff', borderLeft: '1px solid #e5e7eb' }}>
                    <IconButton size="small" onClick={() => handleEdit(row.id)} sx={{ color: "#ea580c" }}><Edit2 size={12} /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {dadosFiltradosDiario.length === 0 && <NoDataRows colSpan={6 + tarefasUnicas.length} />}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination rowsPerPageOptions={[10, 25]} component="div" count={dadosFiltradosDiario.length} rowsPerPage={rowsPerPageDiario} page={pageDiario} onPageChange={(_, p) => setPageDiario(p)} onRowsPerPageChange={e => {setRowsPerPageDiario(parseInt(e.target.value)); setPageDiario(0);}} />
      </ReportSection>

      <Divider sx={{ my: 8 }} />

      {/* --- SEÇÃO MENSAL (SOLICITADA: FORMATOS SEMELHANTES AOS ACIMA) --- */}
      <ReportSection title="Resumo Geral de Produtividade Mensal" subtitle="Acúmulo total das coletas mensais finalizadas.">
        <TableContainer component={Paper} sx={{ borderRadius: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f9fafb' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 900, fontSize: '0.7rem', width: '30%' }}>CATEGORIA</TableCell>
                <TableCell sx={{ fontWeight: 900, fontSize: '0.7rem' }}>MICRO-ATIVIDADE MENSAL</TableCell>
                <TableCell sx={{ fontWeight: 900, fontSize: '0.7rem' }} align="center">TIPO INPUT</TableCell>
                <TableCell sx={{ fontWeight: 900, fontSize: '0.7rem' }} align="center">TOTAL QUANTIDADE</TableCell>
                <TableCell sx={{ fontWeight: 900, fontSize: '0.7rem' }} align="center">TOTAL HORAS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mensalResumo.categorias && mensalResumo.categorias.map((cat: any, i: number) => (
                <React.Fragment key={cat.categoryId || i}>
                  <TableRow sx={{ bgcolor: '#fff' }}>
                    <TableCell sx={{ fontWeight: 900, color: '#111', fontSize: '0.8rem' }}>
                      {cat.categoryNome.toUpperCase()}
                      <Typography variant="caption" display="block" sx={{ color: '#0284c7', fontWeight: 800 }}>
                        Total Categoria: {cat.totalCategoryFormatted || "00:00:00"}
                      </Typography>
                    </TableCell>
                    <TableCell colSpan={4} />
                  </TableRow>
                  {cat.atividades.map((ativ: any, j: number) => (
                    <TableRow key={j} hover>
                      <TableCell />
                      <TableCell sx={{ fontSize: '0.75rem', fontWeight: 500, color: '#4b5563' }}>{ativ.nome}</TableCell>
                      <TableCell align="center" sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#9ca3af' }}>{ativ.tipoInput}</TableCell>
                      <TableCell align="center" sx={{ fontSize: '0.8rem', fontWeight: 800 }}>{ativ.totalQuantidade || '-'}</TableCell>
                      <TableCell align="center" sx={{ fontSize: '0.8rem', fontWeight: 800, color: '#111' }}>{ativ.totalFormatted || "00:00:00"}</TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              ))}
              <TableRow sx={{ bgcolor: '#0f172a' }}>
                <TableCell colSpan={4} align="right" sx={{ py: 3, fontWeight: 900, color: '#fff', letterSpacing: '0.1em', fontSize: '0.75rem' }}>TOTAL MENSAL CONSOLIDADO:</TableCell>
                <TableCell align="center" sx={{ py: 3, fontWeight: 900, color: '#0ea5e9', fontSize: '1rem' }}>{mensalResumo.totalHoras || "00:00:00"}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </ReportSection>

      <ReportSection 
        title="Detalhamento de Coleta Mensal (Exportação)" 
        subtitle="Matriz integral de indicadores mensais por base."
        actions={<Button startIcon={<Download size={16}/>} onClick={() => exportCSV('mensal')} size="small" variant="contained" color="primary" sx={{ fontWeight: 900, textTransform: 'none' }}>Baixar CSV Mensal</Button>}
      >
        <TableContainer component={Paper} sx={{ borderRadius: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 1200 + (tarefasMensaisUnicas.length * 120) }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f9fafb' }}>
                <TableCell sx={{ fontWeight: 900, fontSize: '0.65rem' }}>MÊS REFERÊNCIA</TableCell>
                <TableCell sx={{ fontWeight: 900, fontSize: '0.65rem' }}>BASE</TableCell>
                <TableCell align="right" sx={{ fontWeight: 900, fontSize: '0.65rem' }}>H. TOTAL MENSAL</TableCell>
                {tarefasMensaisUnicas.map(t => (
                  <TableCell key={t} align="center" sx={{ fontWeight: 900, fontSize: '0.6rem', minWidth: 120, borderLeft: '1px solid #e5e7eb', color: '#0284c7' }}>
                    {t}
                  </TableCell>
                ))}
                <TableCell align="center" sx={{ position: 'sticky', right: 0, bgcolor: '#f9fafb', borderLeft: '1px solid #e5e7eb' }}>AÇÕES</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dadosFiltradosMensal.slice(pageMensal * rowsPerPageMensal, pageMensal * rowsPerPageMensal + rowsPerPageMensal).map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ fontWeight: 800 }}>{row.mesReferencia}</TableCell>
                  <TableCell><Chip label={row.baseSigla} size="small" variant="filled" sx={{ fontWeight: 800, fontSize: '0.6rem', bgcolor: '#0284c7', color: 'white' }} /></TableCell>
                  <TableCell align="right" sx={{ fontWeight: 900, color: '#0284c7' }}>{row.totalHoras}</TableCell>
                  {tarefasMensaisUnicas.map(t => (
                    <TableCell key={t} align="center" sx={{ fontSize: '0.7rem', fontWeight: 800 }}>{row.tarefasMap?.[t] || '00:00:00'}</TableCell>
                  ))}
                  <TableCell align="center" sx={{ position: 'sticky', right: 0, bgcolor: '#fff', borderLeft: '1px solid #e5e7eb' }}>
                    <IconButton size="small" onClick={() => handleEditMonthly(row.id)} sx={{ color: "#0284c7" }}><Edit2 size={12} /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {dadosFiltradosMensal.length === 0 && <NoDataRows colSpan={4 + tarefasMensaisUnicas.length} />}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination rowsPerPageOptions={[10, 25]} component="div" count={dadosFiltradosMensal.length} rowsPerPage={rowsPerPageMensal} page={pageMensal} onPageChange={(_, p) => setPageMensal(p)} onRowsPerPageChange={e => {setRowsPerPageMensal(parseInt(e.target.value)); setPageMensal(0);}} />
      </ReportSection>

    </Container>
  );
};

export default ReportsPage;
