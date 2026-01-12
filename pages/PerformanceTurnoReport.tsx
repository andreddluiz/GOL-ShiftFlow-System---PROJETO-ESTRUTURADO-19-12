
import React, { useState, useMemo, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Grid, FormControl, InputLabel, Select, MenuItem, Chip, Alert
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { Clock, Target, Calendar, Zap } from 'lucide-react';
import dayjs from 'dayjs';
import { baseService } from '../services';
import { CustomLabel, minutesToHhmmss, hhmmssToMinutes } from '../modals';
import { authService } from '../services/authService';
import { dataAccessControlService } from '../services/dataAccessControlService';

export const PerformanceTurnoReport: React.FC<{ baseId?: string }> = ({ baseId }) => {
  const [usuario] = useState(() => authService.obterUsuarioAutenticado());
  const [mesFiltro, setMesFiltro] = useState(dayjs().format('YYYY-MM'));
  const [turnosFiltro, setTurnosFiltro] = useState<string[]>(['1', '2', '3', '4']);
  const [exibirRotulos, setExibirRotulos] = useState(false);
  const [metaBase, setMetaBase] = useState<number>(160);

  const isBasePermitida = useMemo(() => baseId ? dataAccessControlService.podeAcessarBase(usuario, baseId) : false, [usuario, baseId]);

  useEffect(() => { 
    if (baseId && isBasePermitida) { 
      const mesNum = dayjs(mesFiltro).month() + 1; 
      baseService.obterMetaHoras(baseId, mesNum).then(setMetaBase); 
    } 
  }, [baseId, mesFiltro, isBasePermitida]);

  const dadosBrutos = useMemo(() => { 
    const raw = localStorage.getItem('gol_rep_detalhamento'); 
    let parsed = raw ? JSON.parse(raw) : []; 
    return dataAccessControlService.filtrarDadosPorPermissao(parsed, usuario);
  }, [usuario]);

  const dadosProcessados = useMemo(() => {
    const map: Record<string, any> = {};
    const targetMonth = dayjs(mesFiltro);
    
    dadosBrutos.filter((d: any) => {
      const [day, month, year] = d.data.split('/');
      const dDate = dayjs(`${year}-${month}`);
      return (!baseId || d.baseId === baseId) && 
             dDate.isSame(targetMonth, 'month') && 
             turnosFiltro.includes(String(d.turnoId));
    }).forEach((d: any) => {
      const label = `Turno ${d.turnoId}`;
      if (!map[label]) map[label] = { label, totalHoras: 0, quantidade: 0 };
      map[label].totalHoras += hhmmssToMinutes(d.horasProduzida || '00:00:00');
      map[label].quantidade += 1;
    });

    return Object.values(map).map(d => ({
      ...d, totalHorasFormatado: minutesToHhmmss(d.totalHoras),
      performance: (d.totalHoras / (metaBase * 60)) * 100
    })).sort((a, b) => a.label.localeCompare(b.label));
  }, [mesFiltro, turnosFiltro, baseId, metaBase, dadosBrutos]);

  const resumo = useMemo(() => {
    const totalMin = dadosProcessados.reduce((acc, d) => acc + d.totalHoras, 0);
    const perfMedia = dadosProcessados.length > 0 ? dadosProcessados.reduce((acc, d) => acc + d.performance, 0) / dadosProcessados.length : 0;
    const mais = [...dadosProcessados].sort((a,b) => b.totalHoras - a.totalHoras)[0];
    return { total: minutesToHhmmss(totalMin), perf: perfMedia.toFixed(1) + '%', top: mais?.label || '-' };
  }, [dadosProcessados]);

  if (baseId && !isBasePermitida) {
    return <Alert severity="error">Você não possui permissão para visualizar dados desta base.</Alert>;
  }

  return (
    <Box>
      <Card sx={{ borderRadius: 4, mb: 4, border: '1px solid #f3f4f6', boxShadow: 'none' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Calendar size={18} className="text-orange-500" /><Typography variant="subtitle2" sx={{ fontWeight: 900, textTransform: 'uppercase' }}>Performance por Turno (Meta Base: {metaBase}h)</Typography></Box>
            <Button variant={exibirRotulos ? "contained" : "outlined"} color="warning" size="small" onClick={() => setExibirRotulos(!exibirRotulos)} sx={{ fontWeight: 900, fontSize: '0.65rem' }}>{exibirRotulos ? "Ocultar Rótulos" : "Exibir Rótulos"}</Button>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}><TextField label="Mês de Referência" type="month" value={mesFiltro} onChange={e => setMesFiltro(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth size="small" /></Grid>
            <Grid item xs={12} md={8}><FormControl fullWidth size="small"><InputLabel children="Turnos" /><Select multiple value={turnosFiltro} onChange={e => setTurnosFiltro(e.target.value as string[])} label="Turnos" renderValue={s => <Box sx={{ display: 'flex', gap: 0.5 }}>{s.map(v => <Chip key={v} label={v} size="small" sx={{ fontWeight: 800, height: 20 }} />)}</Box>}><MenuItem value="1">Turno 1</MenuItem><MenuItem value="2">Turno 2</MenuItem><MenuItem value="3">Turno 3</MenuItem><MenuItem value="4">Turno 4</MenuItem></Select></FormControl></Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <ResumoCard title="Total Produzido" value={resumo.total} icon={<Clock className="text-blue-500" />} />
        <ResumoCard title="Performance Média" value={resumo.perf} icon={<Zap className="text-emerald-500" />} />
        <ResumoCard title="Turno Líder" value={resumo.top} icon={<Target className="text-orange-500" />} />
      </Grid>

      <Grid container spacing={4}>
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 4, border: '1px solid #f3f4f6', boxShadow: 'none' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 3 }}>Produção Real (HH:MM:SS)</Typography>
              {/* FIXED: Wrapper div with inline style to prevent width(-1) and height(-1) */}
              <div style={{ width: '100%', height: 400, minHeight: 400, minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosProcessados.map(d => ({ name: d.label, prod: d.totalHoras/60 }))} margin={{ top: 30, right: 30, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: '10px', fontWeight: 800 }} />
                    <YAxis axisLine={false} tickLine={false} style={{ fontSize: '10px' }} hide />
                    <Tooltip formatter={(v: number) => minutesToHhmmss(v * 60)} />
                    <Bar name="Produção" dataKey="prod" fill="#FF5A00" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="prod" position="insideTop" content={<CustomLabel exibir={exibirRotulos} formato="horas" />} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={5}>
          <TableContainer component={Paper} sx={{ borderRadius: 4, border: '1px solid #f3f4f6', boxShadow: 'none' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f9fafb' }}><TableRow><TableCell sx={{ fontWeight: 900 }}>TURNO</TableCell><TableCell align="right" sx={{ fontWeight: 900 }}>PROD. (HH:MM:SS)</TableCell><TableCell align="right" sx={{ fontWeight: 900 }}>PERF.</TableCell></TableRow></TableHead>
              <TableBody>
                {dadosProcessados.map(row => (
                  <TableRow key={row.label} hover>
                    <TableCell sx={{ fontWeight: 800 }}>{row.label}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900, color: '#f97316' }}>{row.totalHorasFormatado}</TableCell>
                    <TableCell align="right"><Chip label={`${row.performance.toFixed(1)}%`} size="small" color={row.performance >= 70 ? "success" : "warning"} sx={{ fontWeight: 900, fontSize: '0.65rem' }} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
};

const ResumoCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
  <Grid item xs={12} sm={4}>
    <Card sx={{ borderRadius: 4, border: '1px solid #f3f4f6', boxShadow: 'none' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}><Typography variant="caption" sx={{ fontWeight: 900, color: '#9ca3af', textTransform: 'uppercase' }}>{title}</Typography><Box sx={{ p: 1, bgcolor: '#f9fafb', borderRadius: 2 }}>{icon}</Box></Box>
        <Typography variant="h5" sx={{ fontWeight: 950, color: '#1f2937' }}>{value}</Typography>
      </CardContent>
    </Card>
  </Grid>
);
