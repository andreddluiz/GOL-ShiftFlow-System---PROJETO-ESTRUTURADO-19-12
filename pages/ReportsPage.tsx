
import React, { useEffect, useState, useMemo } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Chip, TextField, Box, Typography, Container, CircularProgress, 
  Button, IconButton, Tooltip, Divider, Collapse
} from '@mui/material';
import { 
  Download, FileText, ClipboardList, Calendar, 
  BarChart, Activity, CheckCircle, Clock, Copy,
  ChevronDown, ChevronUp, FileSearch, Filter, Edit2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../hooks/useStore';

// --- UTILITÁRIOS DE FORMATAÇÃO ---
const formatHhMm = (h: number, m: number = 0) => {
  return `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round(m)).padStart(2, '0')}`;
};

const formatToHms = (h: number, m: number) => {
    // Retorna HH:MM:SS para a tabela detalhada conforme solicitado
    const totalSec = Math.round((h * 3600) + (m * 60));
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export const ReportsPage: React.FC<{ baseId?: string }> = ({ baseId }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [acompanhamento, setAcompanhamento] = useState<any[]>([]);
  const [resumo, setResumo] = useState<any>({ categorias: [], totalHoras: 0, totalMinutos: 0 });
  const [mensal, setMensal] = useState<any[]>([]);
  const [detalhamento, setDetalhamento] = useState<any[]>([]);
  
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  // Identificar todas as tarefas únicas para as colunas da tabela de detalhamento
  const uniqueTaskNames = useMemo(() => {
    const names = new Set<string>();
    detalhamento.forEach(row => {
      row.atividades?.forEach((at: any) => names.add(at.taskNome));
    });
    return Array.from(names).sort();
  }, [detalhamento]);

  useEffect(() => {
    const loadData = () => {
      const a = localStorage.getItem('gol_rep_acompanhamento');
      const r = localStorage.getItem('gol_rep_resumo');
      const m = localStorage.getItem('gol_rep_mensal');
      const d = localStorage.getItem('gol_rep_detalhamento');

      if (a) setAcompanhamento(JSON.parse(a).reverse());
      if (r) setResumo(JSON.parse(r));
      if (m) setMensal(JSON.parse(m).reverse());
      if (d) setDetalhamento(JSON.parse(d).reverse());
      
      setLoading(false);
    };
    loadData();
  }, []);

  const exportCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(val => Array.isArray(val) ? `"${val.join(', ')}"` : `"${val}"`).join(',')
    ).join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${filename}.csv`; a.click();
  };

  const copyToClipboard = () => {
    const text = detalhamento.map(d => `${d.data}\t${d.turno}\t${d.horasProduzida.toFixed(1)}h\t${d.percentualPerformance.toFixed(1)}%`).join('\n');
    navigator.clipboard.writeText(`DATA\tTURNO\tPROD\tPERF\n${text}`);
    alert('Resumo copiado para a área de transferência!');
  };

  const handleEdit = (id: string) => {
    navigate(`/shift-handover?editId=${id}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '60vh', gap: 2 }}>
        <CircularProgress color="warning" />
        <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'gray' }}>CONSOLIDANDO DADOS OPERACIONAIS...</Typography>
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
           <TextField label="Data Inicial" type="date" value={dataInicio} onChange={e => dataInicio && setDataInicio(e.target.value)} size="small" InputLabelProps={{ shrink: true }} />
           <TextField label="Data Final" type="date" value={dataFim} onChange={e => dataFim && setDataFim(e.target.value)} size="small" InputLabelProps={{ shrink: true }} />
        </Box>
      </Box>

      {/* 1. PAINEL DE ACOMPANHAMENTO DE TURNOS */}
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

      {/* 2. RESUMO GERAL DE PRODUTIVIDADE */}
      <ReportSection title="Resumo Geral de Produtividade" subtitle="Soma acumulada de todas as passagens de serviço (Minutos convertidos em Horas).">
        <TableContainer component={Paper} sx={{ borderRadius: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f9fafb' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 900, fontSize: '0.7rem' }}>CATEGORIA OPERACIONAL</TableCell>
                <TableCell sx={{ fontWeight: 900, fontSize: '0.7rem' }}>MICRO-ATIVIDADE</TableCell>
                <TableCell align="center" sx={{ fontWeight: 900, fontSize: '0.7rem' }}>TIPO</TableCell>
                <TableCell align="right" sx={{ fontWeight: 900, fontSize: '0.7rem' }}>TOTAL QTY</TableCell>
                <TableCell align="right" sx={{ fontWeight: 900, fontSize: '0.7rem' }}>TOTAL HORAS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {resumo.categorias.map((cat: any, ci: number) => (
                <React.Fragment key={ci}>
                  {cat.atividades.map((at: any, ai: number) => (
                    <TableRow key={`${ci}-${ai}`} hover>
                      <TableCell>
                        {ai === 0 && (
                          <Typography variant="caption" sx={{ fontWeight: 900, color: '#FF5A00', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <BarChart size={12} /> {cat.categoryNome} ({formatHhMm(cat.totalCategoryHoras, cat.totalCategoryMinutos)})
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '0.8rem' }}>{at.nome}</TableCell>
                      <TableCell align="center"><Chip label={at.tipoInput} size="small" sx={{ fontSize: '0.6rem', fontWeight: 900, height: 20 }} /></TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>{at.tipoInput === 'QTY' ? at.totalQuantidade : '-'}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 900, color: '#111827' }}>{formatHhMm(at.totalHoras, at.totalMinutos)}</TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              ))}
              {resumo.categorias.length > 0 && (
                <TableRow sx={{ bgcolor: '#fff7ed' }}>
                  <TableCell colSpan={4} sx={{ fontWeight: 900, color: '#ea580c' }}>TOTAL GERAL PRODUTIVO ACUMULADO</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 900, color: '#ea580c', fontSize: '1.1rem' }}>
                    {formatHhMm(resumo.totalHoras, resumo.totalMinutos)}
                  </TableCell>
                </TableRow>
              )}
              {resumo.categorias.length === 0 && <NoDataRows colSpan={5} />}
            </TableBody>
          </Table>
        </TableContainer>
      </ReportSection>

      <Divider sx={{ my: 8 }} />

      {/* 3. HISTÓRICO DE DADOS MENSAIS */}
      <ReportSection title="Histórico de Dados Mensais (Coleta)" subtitle="Registros consolidados mensais salvos exclusivamente através da página 'Coleta Mensal'.">
        <TableContainer component={Paper} sx={{ borderRadius: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f9fafb' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 900, fontSize: '0.7rem' }}>MÊS REFERÊNCIA</TableCell>
                <TableCell align="right" sx={{ fontWeight: 900, fontSize: '0.7rem' }}>RECEBIMENTO</TableCell>
                <TableCell align="right" sx={{ fontWeight: 900, fontSize: '0.7rem' }}>FORNECER</TableCell>
                <TableCell align="right" sx={{ fontWeight: 900, fontSize: '0.7rem' }}>CANCELAMENTO</TableCell>
                <TableCell align="right" sx={{ fontWeight: 900, fontSize: '0.7rem' }}>EXPEDIR</TableCell>
                <TableCell align="right" sx={{ fontWeight: 900, fontSize: '0.7rem' }}>PRESERVAR</TableCell>
                <TableCell align="right" sx={{ fontWeight: 900, fontSize: '0.7rem' }}>ARMAZENAR</TableCell>
                <TableCell align="right" sx={{ fontWeight: 900, color: '#FF5A00' }}>TOTAL GERAL</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mensal.map((row, i) => (
                <TableRow key={i} hover>
                  <TableCell sx={{ fontWeight: 900, color: '#4b5563' }}>{row.mesReferencia}</TableCell>
                  <TableCell align="right">{formatHhMm(row.recebimento.horas, row.recebimento.minutos)}</TableCell>
                  <TableCell align="right">{formatHhMm(row.fornecer.horas, row.fornecer.minutos)}</TableCell>
                  <TableCell align="right">{formatHhMm(row.cancelamento.horas, row.cancelamento.minutos)}</TableCell>
                  <TableCell align="right">{formatHhMm(row.expedir.horas, row.expedir.minutos)}</TableCell>
                  <TableCell align="right">{formatHhMm(row.preservar.horas, row.preservar.minutos)}</TableCell>
                  <TableCell align="right">{formatHhMm(row.armazenar.horas, row.armazenar.minutos)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 900, color: '#FF5A00' }}>{formatHhMm(row.totalGeral.horas, row.totalGeral.minutos)}</TableCell>
                </TableRow>
              ))}
              {mensal.length === 0 && <NoDataRows colSpan={8} />}
            </TableBody>
          </Table>
        </TableContainer>
      </ReportSection>

      <Divider sx={{ my: 8 }} />

      {/* 4. DETALHAMENTO POR DIA E TURNO */}
      <ReportSection 
        title="Detalhamento por Dia e Turno (Exportação)" 
        subtitle="Matriz analítica integral com todos os campos preenchidos em cada Passagem de Serviço finalizada."
        actions={
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button size="small" variant="outlined" startIcon={<Copy size={14}/>} onClick={copyToClipboard} sx={{ fontWeight: 900, fontSize: '0.65rem' }}>Copiar Resumo</Button>
            <Button size="small" variant="contained" color="warning" startIcon={<Download size={14}/>} onClick={() => exportCSV(detalhamento, 'detalhamento_analitico_gol')} sx={{ fontWeight: 900, fontSize: '0.65rem' }}>Baixar CSV</Button>
          </Box>
        }
      >
        <TableContainer component={Paper} sx={{ borderRadius: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f9fafb' }}>
              <TableRow>
                <TableCell sx={{ width: 40 }} />
                <TableCell sx={{ fontWeight: 900, fontSize: '0.65rem' }}>DATA</TableCell>
                <TableCell sx={{ fontWeight: 900, fontSize: '0.65rem' }}>TURNO</TableCell>
                <TableCell sx={{ fontWeight: 900, fontSize: '0.65rem' }}>COLABORADORES</TableCell>
                <TableCell align="right" sx={{ fontWeight: 900, fontSize: '0.65rem' }}>H.DISP.</TableCell>
                <TableCell align="right" sx={{ fontWeight: 900, fontSize: '0.65rem' }}>H.PROD.</TableCell>
                <TableCell align="right" sx={{ fontWeight: 900, fontSize: '0.65rem' }}>% PERF.</TableCell>
                <TableCell align="center" sx={{ fontWeight: 900, fontSize: '0.65rem' }}>AÇÕES</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {detalhamento.map((row) => (
                <CollapsibleDetailRow 
                    key={row.id} 
                    row={row} 
                    taskColumns={uniqueTaskNames} 
                    onEdit={() => handleEdit(row.id)} 
                />
              ))}
              {detalhamento.length === 0 && <NoDataRows colSpan={8} />}
            </TableBody>
          </Table>
        </TableContainer>
      </ReportSection>

    </Container>
  );
};

// --- COMPONENTE DE LINHA EXPANSÍVEL PARA DETALHAMENTO ---
const CollapsibleDetailRow: React.FC<{ row: any, taskColumns: string[], onEdit: () => void }> = ({ row, taskColumns, onEdit }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ fontWeight: 'bold', color: '#1f2937' }}>{row.data}</TableCell>
        <TableCell><Chip label={row.turno} size="small" variant="outlined" sx={{ fontWeight: 800, fontSize: '0.6rem', height: 20 }} /></TableCell>
        <TableCell sx={{ maxWidth: 200, fontSize: '0.75rem', fontWeight: 600, color: '#4b5563' }}>{row.colaboradores.join(', ')}</TableCell>
        <TableCell align="right" sx={{ fontWeight: 700 }}>{row.horasDisponivel}h</TableCell>
        <TableCell align="right" sx={{ fontWeight: 700 }}>{row.horasProduzida.toFixed(2)}h</TableCell>
        <TableCell align="right">
          <Typography sx={{ fontWeight: 900, color: row.percentualPerformance > 70 ? '#10b981' : '#f59e0b', fontSize: '0.8rem' }}>
            {row.percentualPerformance.toFixed(1)}%
          </Typography>
        </TableCell>
        <TableCell align="center">
            <Tooltip title="Editar Passagem de Serviço">
                <IconButton size="small" color="primary" onClick={onEdit} sx={{ bgcolor: '#eff6ff', '&:hover': { bgcolor: '#dbeafe' } }}>
                    <Edit2 size={14} />
                </IconButton>
            </Tooltip>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ p: 4, bgcolor: '#fcfcfc', border: '1px solid #f3f4f6', borderRadius: '1rem', m: 2 }}>
              
              {/* TABELA DE ATIVIDADES CONFORME SOLICITADO */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="overline" sx={{ fontWeight: 900, color: '#FF5A00', mb: 2, display: 'block' }}>Detalhamento das Atividades (HH:MM:SS)</Typography>
                <TableContainer component={Paper} sx={{ borderRadius: '0.75rem', border: '1px solid #e5e7eb', boxShadow: 'none' }}>
                    <Table size="small">
                        <TableHead sx={{ bgcolor: '#f9fafb' }}>
                            <TableRow>
                                {taskColumns.map(col => (
                                    <TableCell key={col} sx={{ fontWeight: 900, fontSize: '0.6rem', color: '#6b7280', textTransform: 'uppercase' }}>
                                        {col}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow>
                                {taskColumns.map(col => {
                                    const activity = row.atividades?.find((a: any) => a.taskNome === col);
                                    return (
                                        <TableCell key={col} sx={{ fontWeight: 700, fontSize: '0.75rem', color: activity ? '#111827' : '#d1d5db' }}>
                                            {activity ? formatToHms(activity.horas, activity.minutos) : '00:00:00'}
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
              </Box>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                {/* Controles Diários */}
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 900, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 1 }}><FileSearch size={12}/> CONTROLES DIÁRIOS</Typography>
                  <div className="mt-2 space-y-1">
                    {row.shelfLifeItems?.map((s:any, idx:number) => <p key={idx} className="text-[10px] font-bold text-gray-600">• Shelf Life: {s.itemNome} (Venc: {s.data})</p>)}
                    {row.locationItems?.map((l:any, idx:number) => <p key={idx} className="text-[10px] font-bold text-gray-600">• Location: {l.itemNome} (Vol: {l.quantidade})</p>)}
                    {row.transitItems?.map((t:any, idx:number) => <p key={idx} className="text-[10px] font-bold text-gray-600">• Trânsito: {t.itemNome} (Vol: {t.quantidade})</p>)}
                  </div>
                </Box>

                {/* Obs */}
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 900, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 1 }}><ClipboardList size={12}/> INFORMAÇÕES IMPORTANTES</Typography>
                  <p className="mt-2 text-[10px] text-gray-500 italic font-medium leading-relaxed bg-white p-3 rounded-lg border border-gray-100">
                    {row.observacoes || 'Nenhuma observação registrada.'}
                  </p>
                </Box>
              </div>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

// --- COMPONENTE DE SEÇÃO ---
const ReportSection: React.FC<{title: string, subtitle: string, children: any, actions?: any}> = ({ title, subtitle, children, actions }) => (
  <Box sx={{ mb: 4 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, px: 1 }}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 900, color: '#1f2937', mb: 0.2 }}>{title}</Typography>
        <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{subtitle}</Typography>
      </Box>
      {actions}
    </Box>
    {children}
  </Box>
);

const StatusBadge: React.FC<{status: string}> = ({ status }) => (
  <Chip 
    label={status} 
    size="small" 
    variant={status === 'OK' ? 'filled' : 'outlined'}
    color={status === 'OK' ? 'success' : 'error'}
    sx={{ fontWeight: 900, fontSize: '0.62rem', minWidth: 70, height: 22 }}
  />
);

const NoDataRows: React.FC<{colSpan: number}> = ({ colSpan }) => (
  <TableRow>
    <TableCell colSpan={colSpan} align="center" sx={{ py: 12, color: '#d1d5db', fontStyle: 'italic', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.1em' }}>
      AGUARDANDO FINALIZAÇÃO DE TURNOS PARA EXIBIÇÃO DE DADOS
    </TableCell>
  </TableRow>
);

export default ReportsPage;
