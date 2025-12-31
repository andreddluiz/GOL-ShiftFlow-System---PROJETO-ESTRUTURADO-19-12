
import React, { useState, useMemo, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Tabs, Tab, TextField, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Grid, FormControl, InputLabel, Select, MenuItem, Chip, IconButton
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LabelList, ReferenceLine } from 'recharts';
import { FileDown, FileText, Trophy, Target, ArrowUpDown, Filter, Sigma, Calendar, Clock } from 'lucide-react';
import dayjs from 'dayjs';
import { useStore } from '../hooks/useStore';
import { baseService } from '../services';
import { CustomLabel, minutesToHhmmss } from '../modals';

interface ProducaoBase {
  baseId: string;
  totalHoras: number;
  totalHorasFormatado: string;
  quantidadePassagens: number;
  quantidadeColaboradores: number;
  mediaPorPassagemFormatado: string;
  performance: number;
  ranking: number;
  sigla: string;
  prodDiaria: number;
  prodMensal: number;
  prodDiariaFormatado?: string;
  prodMensalFormatado?: string;
}

function hhmmssToMinutes(hms: string): number {
  if (!hms || hms === '00:00:00') return 0;
  const parts = hms.split(':').map(Number);
  if (parts.length === 3) return (parts[0] * 60) + (parts[1] || 0) + (parts[2] || 0) / 60;
  return (parts[0] || 0) * 60;
}

function buscarDadosReais(chave: string): any[] {
  const raw = localStorage.getItem(chave);
  if (raw) { try { const parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed : []; } catch (e) { return []; } }
  return [];
}

export const RelatorioProducaoPorBase: React.FC = () => {
  const { bases, initialized, refreshData } = useStore();
  const [abaAtiva, setAbaAtiva] = useState(0);
  
  // Ajuste de filtros para MM:AAAA (Solicitação 3)
  const [mesInicio, setMesInicio] = useState(dayjs().startOf('year').format('YYYY-MM'));
  const [mesFim, setMesFim] = useState(dayjs().format('YYYY-MM'));
  
  const [basesFiltro, setBasesFiltro] = useState<string[]>([]);
  const [ordenacao, setOrdenacao] = useState('producao-desc');
  const [exibirRotulos, setExibirRotulos] = useState(false);
  const [dadosDiarios, setDadosDiarios] = useState<any[]>([]);
  const [dadosMensais, setDadosMensais] = useState<any[]>([]);
  const [metasBase, setMetasBase] = useState<Record<string, number>>({});

  useEffect(() => { if (!initialized) refreshData(); }, [initialized, refreshData]);
  useEffect(() => { if (bases.length > 0 && basesFiltro.length === 0) setBasesFiltro(bases.map(b => b.id)); }, [bases]);
  useEffect(() => { setDadosDiarios(buscarDadosReais('gol_rep_detalhamento')); setDadosMensais(buscarDadosReais('gol_rep_mensal_detalhado')); }, []);
  useEffect(() => { const mesNum = dayjs(mesFim).month() + 1; baseService.obterMetasTodasAsBases(mesNum).then(setMetasBase); }, [mesFim]);

  const processarDados = (diario: boolean, mensal: boolean) => {
    const map: Record<string, ProducaoBase> = {};
    const startLimit = dayjs(mesInicio + '-01').startOf('month');
    const endLimit = dayjs(mesFim + '-01').endOf('month');

    if (diario) {
      dadosDiarios.filter(d => {
        const parts = d.data.split('/');
        const dDate = dayjs(`${parts[2]}-${parts[1]}-01`);
        return basesFiltro.includes(d.baseId) && (dDate.isSame(startLimit) || dDate.isAfter(startLimit)) && (dDate.isSame(endLimit) || dDate.isBefore(endLimit));
      }).forEach(d => {
        const b = bases.find(base => base.id === d.baseId); if (!b) return;
        if (!map[b.id]) {
          map[b.id] = { baseId: b.id, sigla: b.sigla, totalHoras: 0, totalHorasFormatado: '', quantidadePassagens: 0, quantidadeColaboradores: 0, mediaPorPassagemFormatado: '', performance: 0, ranking: 0, prodDiaria: 0, prodMensal: 0, prodDiariaFormatado: '00:00:00', prodMensalFormatado: '00:00:00' };
        }
        const entry = map[b.id]!;
        const mins = hhmmssToMinutes(d.horasProduzida || '00:00:00');
        entry.totalHoras += mins; 
        entry.prodDiaria += mins; 
        entry.quantidadePassagens += 1;
        entry.quantidadeColaboradores = Math.max(entry.quantidadeColaboradores, Number(d.qtdColaboradores || 0));
      });
    }

    if (mensal) {
      dadosMensais.filter(d => {
        const [m, y] = (d.mesReferencia || '').split('/');
        const dDate = dayjs(`${y}-${m}-01`);
        return basesFiltro.includes(d.baseId) && (dDate.isSame(startLimit) || dDate.isAfter(startLimit)) && (dDate.isSame(endLimit) || dDate.isBefore(endLimit));
      }).forEach(d => {
        const b = bases.find(base => base.id === d.baseId); if (!b) return;
        if (!map[b.id]) {
          map[b.id] = { baseId: b.id, sigla: b.sigla, totalHoras: 0, totalHorasFormatado: '', quantidadePassagens: 0, quantidadeColaboradores: 0, mediaPorPassagemFormatado: '', performance: 0, ranking: 0, prodDiaria: 0, prodMensal: 0, prodDiariaFormatado: '00:00:00', prodMensalFormatado: '00:00:00' };
        }
        const entry = map[b.id]!;
        const mins = hhmmssToMinutes(d.totalHoras || '00:00:00');
        entry.totalHoras += mins; 
        entry.prodMensal += mins;
      });
    }

    return Object.values(map).map(d => {
      const meta = metasBase[d.baseId] || 160;
      return { 
        ...d, totalHorasFormatado: minutesToHhmmss(d.totalHoras),
        prodDiariaFormatado: minutesToHhmmss(d.prodDiaria || 0),
        prodMensalFormatado: minutesToHhmmss(d.prodMensal || 0),
        mediaPorPassagemFormatado: minutesToHhmmss(d.totalHoras / (d.quantidadePassagens || 1)),
        performance: (d.totalHoras / (meta * 60)) * 100 
      };
    }).sort((a, b) => ordenacao === 'producao-desc' ? b.totalHoras - a.totalHoras : (ordenacao === 'producao-asc' ? a.totalHoras - b.totalHoras : a.sigla.localeCompare(b.sigla)))
      .map((d, i) => ({ ...d, ranking: i + 1 }));
  };

  const dadosAtivos = useMemo(() => processarDados(abaAtiva !== 2, abaAtiva !== 1), [abaAtiva, basesFiltro, mesInicio, mesFim, ordenacao, metasBase, dadosDiarios, dadosMensais]);
  const resumo = useMemo(() => {
    if (!dadosAtivos.length) return { media: '00:00:00', diff: '00:00:00' };
    const max = dadosAtivos[0]; const min = dadosAtivos[dadosAtivos.length-1];
    return { lider: max.sigla, lanterna: min.sigla, media: minutesToHhmmss(dadosAtivos.reduce((a,b)=>a+b.totalHoras,0)/dadosAtivos.length), diff: minutesToHhmmss(max.totalHoras - min.totalHoras) };
  }, [dadosAtivos]);

  const metaMediaGeral = useMemo(() => {
    const metaValues = Object.values(metasBase) as number[];
    if (metaValues.length === 0) return 160;
    return metaValues.reduce((a: number, b: number) => a + b, 0) / metaValues.length;
  }, [metasBase]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Card sx={{ borderRadius: 4, border: '1px solid #f3f4f6', boxShadow: 'none' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Filter size={18} className="text-orange-500" /><Typography variant="subtitle2" sx={{ fontWeight: 900, textTransform: 'uppercase' }}>Parâmetros do Relatório (HH:MM:SS)</Typography></Box>
            <Button variant={exibirRotulos ? "contained" : "outlined"} color="warning" size="small" onClick={() => setExibirRotulos(!exibirRotulos)} sx={{ fontWeight: 900, fontSize: '0.65rem' }}>{exibirRotulos ? "Ocultar Rótulos" : "Exibir Rótulos"}</Button>
          </Box>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}><TextField label="Mês Início" type="month" value={mesInicio} onChange={e => setMesInicio(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth size="small" /></Grid>
            <Grid item xs={12} md={3}><TextField label="Mês Fim" type="month" value={mesFim} onChange={e => setMesFim(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth size="small" /></Grid>
            <Grid item xs={12} md={3}><FormControl fullWidth size="small"><InputLabel children="Bases" /><Select multiple value={basesFiltro} onChange={e => setBasesFiltro(e.target.value as string[])} label="Bases" renderValue={s => <Box sx={{ display: 'flex', gap: 0.5 }}>{s.map(v => <Chip key={v} label={bases.find(b => b.id === v)?.sigla} size="small" sx={{ fontWeight: 800, height: 20 }} />)}</Box>}>{bases.map(b => <MenuItem key={b.id} value={b.id}>{b.sigla}</MenuItem>)}</Select></FormControl></Grid>
            <Grid item xs={12} md={3}><FormControl fullWidth size="small"><InputLabel children="Ordem" /><Select value={ordenacao} onChange={e => setOrdenacao(e.target.value)} label="Ordem"><MenuItem value="producao-desc">Produção (-)</MenuItem><MenuItem value="producao-asc">Produção (+)</MenuItem><MenuItem value="base-az">A-Z</MenuItem></Select></FormControl></Grid>
          </Grid>
        </CardContent>
      </Card>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={abaAtiva} onChange={(_, v) => setAbaAtiva(v)} textColor="primary" indicatorColor="primary">
          <Tab icon={<Sigma size={16} />} iconPosition="start" label="Total" sx={{ fontWeight: 900, fontSize: '0.75rem' }} />
          <Tab icon={<Clock size={16} />} iconPosition="start" label="Diário" sx={{ fontWeight: 900, fontSize: '0.75rem' }} />
          <Tab icon={<Calendar size={16} />} iconPosition="start" label="Mensal" sx={{ fontWeight: 900, fontSize: '0.75rem' }} />
        </Tabs>
      </Box>

      <Grid container spacing={3}>
        <ResumoCard title="Líder" value={resumo.lider || '-'} icon={<Trophy className="text-yellow-500" />} />
        <ResumoCard title="Média Geral" value={resumo.media} icon={<Target className="text-blue-500" />} />
        <ResumoCard title="Variação" value={resumo.diff} icon={<ArrowUpDown className="text-purple-500" />} />
      </Grid>

      <Card container sx={{ borderRadius: 4, border: '1px solid #f3f4f6', boxShadow: 'none' }}>
        <CardContent>
          <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f9fafb' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 900 }}>RANKING</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>BASE</TableCell>
                  {abaAtiva === 0 && <TableCell align="right" sx={{ fontWeight: 900 }}>PROD. DIÁRIA</TableCell>}
                  {abaAtiva === 0 && <TableCell align="right" sx={{ fontWeight: 900 }}>PROD. MENSAL</TableCell>}
                  <TableCell align="right" sx={{ fontWeight: 900, color: '#ea580c' }}>TOTAL (HH:MM:SS)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 900 }}>PERFORMANCE</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dadosAtivos.map(row => (
                  <TableRow key={row.baseId} hover>
                    <TableCell sx={{ fontWeight: 900 }}>{row.ranking}º</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>{row.sigla}</TableCell>
                    {abaAtiva === 0 && <TableCell align="right" sx={{ fontWeight: 700 }}>{row.prodDiariaFormatado}</TableCell>}
                    {abaAtiva === 0 && <TableCell align="right" sx={{ fontWeight: 700 }}>{row.prodMensalFormatado}</TableCell>}
                    <TableCell align="right" sx={{ fontWeight: 900, color: '#ea580c' }}>{row.totalHorasFormatado}</TableCell>
                    <TableCell align="right"><Chip label={`${row.performance.toFixed(1)}%`} size="small" color={row.performance >= 80 ? "success" : "warning"} sx={{ fontWeight: 900 }} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Grid container spacing={4}>
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 4, border: '1px solid #f3f4f6', boxShadow: 'none' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 4 }}>Composição da Produção (HH:MM:SS)</Typography>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosAtivos.map(d => ({ 
                    name: d.sigla, 
                    diaria: (d.prodDiaria || 0) / 60, 
                    mensal: (d.prodMensal || 0) / 60, 
                    total: d.totalHoras / 60 
                  }))} layout="vertical" margin={{ top: 10, right: 60, left: 40, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} style={{ fontSize: '11px', fontWeight: 900 }} width={60} />
                    <Tooltip formatter={(v: number) => [minutesToHhmmss(v * 60), 'Tempo']} />
                    <Legend />
                    {abaAtiva === 0 ? (
                      <>
                        <Bar name="Diária" dataKey="diaria" stackId="a" fill="#FF5A00">
                          {/* Rótulo dentro da barra (Solicitação 1) */}
                          <LabelList dataKey="diaria" position="insideRight" content={<CustomLabel exibir={exibirRotulos} formato="horas" />} />
                        </Bar>
                        <Bar name="Mensal" dataKey="mensal" stackId="a" fill="#0ea5e9" radius={[0, 4, 4, 0]}>
                           <LabelList dataKey="mensal" position="insideRight" content={<CustomLabel exibir={exibirRotulos} formato="horas" />} />
                        </Bar>
                      </>
                    ) : <Bar name="Produção" dataKey="total" fill="#FF5A00" radius={[0, 4, 4, 0]}><LabelList dataKey="total" position="insideRight" content={<CustomLabel exibir={exibirRotulos} formato="horas" />} /></Bar>}
                    <ReferenceLine x={metaMediaGeral} stroke="#ef4444" strokeDasharray="5 5" label={{ position: 'top', value: 'Meta Méd.', fill: '#ef4444', fontSize: 10, fontWeight: 900 }} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 4, border: '1px solid #f3f4f6', boxShadow: 'none' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 4 }}>Performance Real (%)</Typography>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosAtivos.map(d => ({ name: d.sigla, value: d.performance }))} margin={{ top: 30, right: 30, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: '11px', fontWeight: 900 }} />
                    <YAxis hide domain={[0, 120]} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                       {dadosAtivos.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.performance >= 80 ? '#10b981' : '#f59e0b'} />)}
                       {/* Rótulo dentro da barra (Solicitação 1) */}
                       <LabelList dataKey="value" position="insideTop" content={<CustomLabel exibir={exibirRotulos} formato="percentual" />} />
                    </Bar>
                    <ReferenceLine y={100} stroke="#10b981" strokeDasharray="3 3" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

const ResumoCard: React.FC<{ title: string; value: string; sub?: string; icon: React.ReactNode }> = ({ title, value, sub, icon }) => (
  <Grid item xs={12} sm={4}>
    <Card sx={{ borderRadius: 4, border: '1px solid #f3f4f6', boxShadow: 'none' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}><Typography variant="caption" sx={{ fontWeight: 950, textTransform: 'uppercase', color: '#9ca3af' }}>{title}</Typography><Box sx={{ p: 1, bgcolor: '#f9fafb', borderRadius: 2 }}>{icon}</Box></Box>
        <Typography variant="h5" sx={{ fontWeight: 950 }}>{value}</Typography>
        {sub && <Typography variant="caption" sx={{ color: '#ea580c', fontWeight: 800 }}>{sub}</Typography>}
      </CardContent>
    </Card>
  </Grid>
);
