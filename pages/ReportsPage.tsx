
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
const formatHhMm = (h: number, m: number = 0) => {
  return `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round(m)).padStart(2, '0')}`;
};

function ordenarTarefasPorCategoria(tarefasUnicas: string[], mapaCategorias: Record<string, string>): string[] {
  console.debug(`[Ordenação] Ordenando ${tarefasUnicas.length} tarefas por categoria fluxogramada`);
  
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
  const [resumo, setResumo] = useState<any>({ categorias: [], totalHoras: 0, totalMinutos: 0 });
  const [mensal, setMensal] = useState<any[]>([]);
  const [detalhamento, setDetalhamento] = useState<any[]>([]);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const loadData = () => {
      const a = localStorage.getItem('gol_rep_acompanhamento');
      const r = localStorage.getItem('gol_rep_resumo');
      const m = localStorage.getItem('gol_rep_mensal');
      const d = localStorage.getItem('gol_rep_detalhamento');
      if (a) setAcompanhamento(JSON.parse(a).reverse());
      if (r) setResumo(JSON.parse(r));
      if (m) setMensal(JSON.parse(m));
      if (d) setDetalhamento(JSON.parse(d).reverse());
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

  const dadosFiltrados = useMemo(() => {
    return detalhamento.filter(row => {
      if (!dataInicio && !dataFim) return true;
      const [d, m, y] = row.data.split('/');
      const date = new Date(`${y}-${m}-${d}`);
      const start = dataInicio ? new Date(dataInicio) : new Date('1900-01-01');
      const end = dataFim ? new Date(dataFim) : new Date('2099-12-31');
      return date >= start && date <= end;
    });
  }, [detalhamento, dataInicio, dataFim]);

  const exportCSV = () => {
    if (dadosFiltrados.length === 0) return;
    let headers = 'DATA,REGISTRO EM,EDIÇÃO EM,TURNO,QTD COL.,NOMES,H.DISP.,H.PROD.,% PERF.';
    tarefasUnicas.forEach(t => { headers += `,${t.replace(/,/g, '')}`; });
    headers += ',SHELF LIFE,LOCATIONS,TRÂNSITO,SALDO CRÍTICO,OBSERVAÇÕES';

    const rows = dadosFiltrados.map(row => {
      const basic = [
        row.data,
        row.CriadoEm ? dayjs(row.CriadoEm).format('DD/MM/YYYY HH:mm:ss') : '-',
        row.updatedAt && row.updatedAt !== row.CriadoEm ? dayjs(row.updatedAt).format('DD/MM/YYYY HH:mm:ss') : '-',
        row.turno, row.qtdColaboradores, `"${row.nomeColaboradores}"`,
        row.horasDisponivel, row.horasProduzida, `${row.percentualPerformance}%`
      ].join(',');
      const tasks = tarefasUnicas.map(t => row.tarefasMap?.[t] || '00:00:00').join(',');
      const extra = [ `"${row.shelfLife || ''}"`, `"${row.locations || ''}"`, `"${row.transito || ''}"`, `"${row.saldoCritico || ''}"`, `"${row.observacoes?.replace(/\n/g, ' ') || ''}"` ].join(',');
      return `${basic},${tasks},${extra}`;
    }).join('\n');

    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `detalhamento_dinamico_gol_${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  const copyToClipboard = () => {
    let texto = 'DATA\tREGISTRO EM\tEDIÇÃO EM\tTURNO\tQTD COL.\tNOMES\tH.DISP.\tH.PROD.\t% PERF.';
    tarefasUnicas.forEach(t => { texto += `\t${t}`; });
    texto += '\tSHELF LIFE\tLOCATIONS\tTRÂNSITO\tSALDO CRÍTICO\tOBSERVAÇÕES\n';
    dadosFiltrados.forEach(row => {
      let linha = `${row.data}\t${row.CriadoEm ? dayjs(row.CriadoEm).format('DD/MM/YYYY HH:mm:ss') : '-'}\t${row.updatedAt && row.updatedAt !== row.CriadoEm ? dayjs(row.updatedAt).format('DD/MM/YYYY HH:mm:ss') : '-'}\t${row.turno}\t${row.qtdColaboradores}\t${row.nomeColaboradores}\t${row.horasDisponivel}\t${row.horasProduzida}\t${row.percentualPerformance}%`;
      tarefasUnicas.forEach(t => { linha += `\t${row.tarefasMap?.[t] || '00:00:00'}`; });
      linha += `\t${row.shelfLife}\t${row.locations}\t${row.transito}\t${row.saldoCritico}\t${row.observacoes}\n`;
      texto += linha;
    });
    navigator.clipboard.writeText(texto);
    alert('Matriz analítica copiada para a área de transferência!');
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

      <ReportSection title="Painel de Acompanhamento de Turnos" subtitle="Status de preenchimento por período operacional (Passagem de Serviço).">
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

      <Divider sx={{ my: 8 }} />

      <ReportSection title="Resumo Geral de Produtividade" subtitle="Soma acumulada de todas as passagens no período selecionado.">
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
              {resumo.categorias.map((cat: any, i: number) => (
                <React.Fragment key={cat.categoryId || i}>
                  <TableRow sx={{ bgcolor: '#fff' }}>
                    <TableCell sx={{ fontWeight: 900, color: '#111', fontSize: '0.8rem' }}>
                      {cat.categoryNome.toUpperCase()}
                      <Typography variant="caption" display="block" sx={{ color: '#ea580c', fontWeight: 800 }}>
                        Total Categoria: {formatHhMm(cat.totalCategoryHoras, cat.totalCategoryMinutos)}
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
                      <TableCell align="center" sx={{ fontSize: '0.8rem', fontWeight: 800, color: '#111' }}>{formatHhMm(ativ.totalHoras, ativ.totalMinutos)}</TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              ))}
              <TableRow sx={{ bgcolor: '#0f172a' }}>
                <TableCell colSpan={4} align="right" sx={{ py: 3, fontWeight: 900, color: '#fff', letterSpacing: '0.1em', fontSize: '0.75rem' }}>TOTAL GERAL DE HORAS PRODUTIVAS:</TableCell>
                <TableCell align="center" sx={{ py: 3, fontWeight: 900, color: '#f97316', fontSize: '1rem' }}>{formatHhMm(resumo.totalHoras, resumo.totalMinutos)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </ReportSection>

      <Divider sx={{ my: 8 }} />

      <ReportSection title="Histórico de Dados Mensais (Coleta)" subtitle="Registros consolidados mensais de indicadores regulatórios.">
        <TableContainer component={Paper} sx={{ borderRadius: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f9fafb' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 900, fontSize: '0.7rem' }}>MÊS REFERÊNCIA</TableCell>
                <TableCell align="right" sx={{ fontWeight: 900, fontSize: '0.7rem' }}>TOTAL HORAS</TableCell>
                <TableCell align="center" sx={{ fontWeight: 900, fontSize: '0.7rem' }}>STATUS</TableCell>
                <TableCell align="center" sx={{ fontWeight: 900, fontSize: '0.7rem' }}>AÇÕES</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mensal.map((row, i) => (
                <TableRow key={i} hover>
                  <TableCell sx={{ fontWeight: 900, color: '#4b5563' }}>{row.mesReferencia}</TableCell>
                  <TableCell align="right">{formatHhMm(row.totalGeral.horas, row.totalGeral.minutos)}</TableCell>
                  <TableCell align="center"><StatusBadge status="OK" /></TableCell>
                  <TableCell align="center">
                    <Tooltip title="Editar Coleta">
                       <IconButton size="small" onClick={() => handleEditMonthly(row.id)} sx={{ bgcolor: '#f0fdf4', '&:hover': { bgcolor: '#dcfce7' } }}>
                         <Edit2 size={12} color="#166534" />
                       </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {mensal.length === 0 && <NoDataRows colSpan={4} />}
            </TableBody>
          </Table>
        </TableContainer>
      </ReportSection>

      <Divider sx={{ my: 8 }} />

      <ReportSection 
        title="Detalhamento por Dia e Turno (Exportação)" 
        subtitle="Matriz analítica integral com colunas individuais agrupadas por fluxo operacional (Recebimento a Outros)."
        actions={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button startIcon={<Copy size={16}/>} onClick={copyToClipboard} size="small" variant="outlined" sx={{ fontWeight: 900, textTransform: 'none' }}>Copiar Tabela</Button>
            <Button startIcon={<Download size={16}/>} onClick={exportCSV} size="small" variant="contained" color="warning" sx={{ fontWeight: 900, textTransform: 'none' }}>Baixar CSV</Button>
          </Box>
        }
      >
        <TableContainer component={Paper} sx={{ borderRadius: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 2400 + (tarefasUnicas.length * 150) }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f9fafb' }}>
                <TableCell sx={{ fontWeight: 900, fontSize: '0.65rem', minWidth: 100 }}>DATA</TableCell>
                <TableCell sx={{ fontWeight: 900, fontSize: '0.65rem', minWidth: 140 }}>DATA/HORA DO REGISTRO</TableCell>
                <TableCell sx={{ fontWeight: 900, fontSize: '0.65rem', minWidth: 140 }}>DATA/HORA DA EDIÇÃO</TableCell>
                <TableCell sx={{ fontWeight: 900, fontSize: '0.65rem', minWidth: 80 }}>TURNO</TableCell>
                <TableCell sx={{ fontWeight: 900, fontSize: '0.65rem', minWidth: 60 }} align="center">QTD COL.</TableCell>
                <TableCell sx={{ fontWeight: 900, fontSize: '0.65rem', minWidth: 150 }}>NOMES</TableCell>
                <TableCell sx={{ fontWeight: 900, fontSize: '0.65rem', minWidth: 80 }} align="right">H.DISP.</TableCell>
                <TableCell sx={{ fontWeight: 900, fontSize: '0.65rem', minWidth: 80 }} align="right">H.PROD.</TableCell>
                <TableCell sx={{ fontWeight: 900, fontSize: '0.65rem', minWidth: 70 }} align="right">% PERF.</TableCell>
                {tarefasUnicas.map(t => (
                  <TableCell key={t} align="center" sx={{ fontWeight: 900, fontSize: '0.6rem', minWidth: 140, borderLeft: '1px solid #e5e7eb', color: t.includes('[EXTRA]') ? '#0284c7' : '#ea580c' }}>
                    {t.replace('[EXTRA] ', '')}
                  </TableCell>
                ))}
                <TableCell sx={{ fontWeight: 900, fontSize: '0.65rem', minWidth: 150, borderLeft: '2px solid #ea580c' }}>SHELF LIFE</TableCell>
                <TableCell sx={{ fontWeight: 900, fontSize: '0.65rem', minWidth: 150 }}>LOCATIONS</TableCell>
                <TableCell sx={{ fontWeight: 900, fontSize: '0.65rem', minWidth: 150 }}>TRÂNSITO</TableCell>
                <TableCell sx={{ fontWeight: 900, fontSize: '0.65rem', minWidth: 150 }}>SALDO CRÍTICO</TableCell>
                <TableCell sx={{ fontWeight: 900, fontSize: '0.65rem', minWidth: 350 }}>OBSERVAÇÕES</TableCell>
                <TableCell align="center" sx={{ fontWeight: 900, fontSize: '0.65rem', minWidth: 80, position: 'sticky', right: 0, bgcolor: '#f9fafb', borderLeft: '1px solid #e5e7eb' }}>AÇÕES</TableCell>
              </TableRow>
              <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                <TableCell sx={{ bgcolor: '#f1f5f9' }} colSpan={9} />
                {tarefasUnicas.map(t => (
                   <TableCell key={`cat-${t}`} align="center" sx={{ fontWeight: 800, fontSize: '0.55rem', color: '#64748b', borderLeft: '1px solid #e2e8f0', textTransform: 'uppercase', py: 0.5 }}>
                     {mapaCategorias[t] || '-'}
                   </TableCell>
                ))}
                <TableCell sx={{ fontWeight: 800, fontSize: '0.55rem', color: '#64748b', borderLeft: '2px solid #cbd5e1', py: 0.5 }}>CONTROLE</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.55rem', color: '#64748b', py: 0.5 }}>CONTROLE</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.55rem', color: '#64748b', py: 0.5 }}>CONTROLE</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.55rem', color: '#64748b', py: 0.5 }}>CONTROLE</TableCell>
                <TableCell colSpan={2} sx={{ bgcolor: '#f1f5f9' }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {dadosFiltrados.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, i) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ fontWeight: 800, color: '#1f2937' }}>{row.data}</TableCell>
                  <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6b7280' }}>
                    {row.CriadoEm ? dayjs(row.CriadoEm).format('DD/MM/YYYY HH:mm:ss') : '-'}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6b7280' }}>
                    {row.updatedAt && row.updatedAt !== row.CriadoEm ? dayjs(row.updatedAt).format('DD/MM/YYYY HH:mm:ss') : '-'}
                  </TableCell>
                  <TableCell><Chip label={row.turno} size="small" variant="outlined" sx={{ fontWeight: 800, fontSize: '0.6rem', height: 18 }} color="warning" /></TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>{row.qtdColaboradores}</TableCell>
                  <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#4b5563', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <Tooltip title={row.nomeColaboradores}><span>{row.nomeColaboradores}</span></Tooltip>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#6b7280' }}>{row.horasDisponivel}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 900, color: '#ea580c' }}>{row.horasProduzida}</TableCell>
                  <TableCell align="right">
                    <Typography sx={{ fontWeight: 900, color: row.percentualPerformance > 70 ? '#10b981' : '#f59e0b', fontSize: '0.7rem' }}>
                      {row.percentualPerformance}%
                    </Typography>
                  </TableCell>
                  {tarefasUnicas.map(t => {
                    const valor = row.tarefasMap?.[t] || '00:00:00';
                    return (
                      <TableCell key={`${row.id}-${t}`} align="center" sx={{ fontSize: '0.7rem', color: valor === '00:00:00' ? '#cbd5e1' : '#1e293b', fontWeight: valor === '00:00:00' ? 400 : 800, borderLeft: '1px solid #f1f5f9' }}>
                        {valor}
                      </TableCell>
                    );
                  })}
                  <TableCell sx={{ fontSize: '0.65rem', color: '#6b7280', borderLeft: '2px solid #ea580c' }}>{row.shelfLife || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.65rem', color: '#6b7280' }}>{row.locations || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.65rem', color: '#6b7280' }}>{row.transito || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.65rem', color: '#6b7280' }}>{row.saldoCritico || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.65rem', fontStyle: 'italic', color: '#9ca3af' }}>{row.observacoes || 'Sem obs.'}</TableCell>
                  <TableCell align="center" sx={{ position: 'sticky', right: 0, bgcolor: '#fff', borderLeft: '1px solid #e5e7eb' }}>
                    <Tooltip title="Editar Passagem">
                      <IconButton size="small" onClick={() => handleEdit(row.id)} sx={{ bgcolor: '#fff7ed', '&:hover': { bgcolor: '#ffedd5' } }}><Edit2 size={12} color="#ea580c" /></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {dadosFiltrados.length === 0 && <NoDataRows colSpan={14 + tarefasUnicas.length} />}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={dadosFiltrados.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          sx={{ mt: 1 }}
        />
      </ReportSection>
    </Container>
  );
};

export default ReportsPage;
