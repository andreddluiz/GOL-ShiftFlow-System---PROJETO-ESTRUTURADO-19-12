
import React, { useMemo, useEffect, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell,
  LabelList
} from 'recharts';
import { 
  TrendingUp, Sigma, Activity, Calendar, 
  ChevronRight, Hash, Target, 
  CalendarDays, RefreshCw
} from 'lucide-react';
import { 
  Box, Typography, TextField, InputAdornment, Grid, 
  Button, Alert
} from '@mui/material';
import { useStore } from '../hooks/useStore';
import { minutesToHhmmss } from '../modals';
import dayjs from 'dayjs';

// --- UTILITÁRIOS DE CONVERSÃO ---

function converterHHMMSSParaMinutos(hhmmss: string): number {
  if (!hhmmss || hhmmss === '00:00:00') return 0;
  try {
    const partes = hhmmss.trim().split(':');
    if (partes.length < 2) return 0;
    const h = parseInt(partes[0]) || 0;
    const m = parseInt(partes[1]) || 0;
    const s = parseInt(partes[2]) || 0;
    return (h * 60) + m + (s / 60);
  } catch (e) {
    return 0;
  }
}

// Normaliza qualquer string de data para MM/YYYY
function normalizarParaCompetencia(dataStr: string): string {
  if (!dataStr) return '';
  // Formato MM/YYYY (já normalizado)
  if (dataStr.includes('/') && dataStr.split('/').length === 2) return dataStr;
  // Formato DD/MM/YYYY (passagem de serviço)
  if (dataStr.includes('/') && dataStr.split('/').length === 3) {
    const parts = dataStr.split('/');
    return `${parts[1]}/${parts[2]}`;
  }
  // Formato YYYY-MM (input type month) ou YYYY-MM-DD
  if (dataStr.includes('-')) {
    const parts = dataStr.split('-');
    if (parts.length === 2) return `${parts[1]}/${parts[0]}`; // YYYY-MM -> MM/YYYY
    if (parts.length === 3) return `${parts[1]}/${parts[0]}`; // YYYY-MM-DD -> MM/YYYY
  }
  return dataStr;
}

const DashboardPage: React.FC<{baseId?: string}> = ({ baseId }) => {
  const { initialized, refreshData } = useStore();
  const [dataDiaria, setDataDiaria] = useState<any[]>([]);
  const [dataMensal, setDataMensal] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros de Período por Mês/Ano (Solicitação do Usuário)
  const [mesInicio, setMesInicio] = useState(dayjs().startOf('month').format('YYYY-MM'));
  const [mesFim, setMesFim] = useState(dayjs().format('YYYY-MM'));

  // Capacidade Mensal (Persistente por Base)
  const [capacidadeH, setCapacidadeH] = useState<string>(() => {
    return localStorage.getItem(`gol_sf_disp_${baseId || 'all'}`) || '160';
  });

  useEffect(() => {
    localStorage.setItem(`gol_sf_disp_${baseId || 'all'}`, capacidadeH);
  }, [capacidadeH, baseId]);

  /**
   * CARREGAMENTO INTEGRADO DE DADOS (MODELO ESTÁVEL)
   */
  const loadConsolidatedData = () => {
    setLoading(true);
    
    // 1. Dados Diários (gol_rep_detalhamento)
    const dailyRaw = localStorage.getItem('gol_rep_detalhamento');
    let dailyRecords = dailyRaw ? JSON.parse(dailyRaw) : [];

    // 2. Dados Mensais (gol_rep_mensal_detalhado)
    const monthlyRaw = localStorage.getItem('gol_rep_mensal_detalhado');
    let monthlyRecords = monthlyRaw ? JSON.parse(monthlyRaw) : [];

    // Filtragem por Base
    if (baseId) {
      dailyRecords = dailyRecords.filter((item: any) => item.baseId === baseId);
      monthlyRecords = monthlyRecords.filter((item: any) => item.baseId === baseId);
    }

    // Normalização dos limites de competência
    const compInicio = normalizarParaCompetencia(mesInicio);
    const compFim = normalizarParaCompetencia(mesFim);
    
    const startLimit = dayjs(mesInicio + '-01').startOf('month');
    const endLimit = dayjs(mesFim + '-01').endOf('month');

    // Filtragem de Registros Diários por Competência (MM/YYYY)
    dailyRecords = dailyRecords.filter((item: any) => {
      const itemComp = normalizarParaCompetencia(item.data);
      const [m, y] = itemComp.split('/');
      const itemDate = dayjs(`${y}-${m}-01`);
      return (itemDate.isSame(startLimit) || itemDate.isAfter(startLimit)) && 
             (itemDate.isSame(endLimit) || itemDate.isBefore(endLimit));
    });

    // Filtragem de Registros Mensais por Competência (MM/YYYY)
    monthlyRecords = monthlyRecords.filter((item: any) => {
      const itemComp = item.mesReferencia || normalizarParaCompetencia(item.data);
      const [m, y] = itemComp.split('/');
      const itemDate = dayjs(`${y}-${m}-01`);
      return (itemDate.isSame(startLimit) || itemDate.isAfter(startLimit)) && 
             (itemDate.isSame(endLimit) || itemDate.isBefore(endLimit));
    });

    setDataDiaria(dailyRecords);
    setDataMensal(monthlyRecords);
    setLoading(false);
  };

  useEffect(() => {
    loadConsolidatedData();
    if (!initialized) refreshData();
  }, [baseId, initialized, mesInicio, mesFim]);

  // Sync real-time
  useEffect(() => {
    const handleSync = (e: StorageEvent) => {
      if (e.key === 'gol_rep_detalhamento' || e.key === 'gol_rep_mensal_detalhado') {
        loadConsolidatedData();
      }
    };
    window.addEventListener('storage', handleSync);
    return () => window.removeEventListener('storage', handleSync);
  }, []);

  /**
   * CÁLCULO DE KPIS CONSOLIDADOS
   */
  const stats = useMemo(() => {
    // Produtividade Diária (Soma HH:MM:SS de cada registro ou activities)
    const totalDiarioMin = dataDiaria.reduce((acc, curr) => {
      if (curr.activities && curr.activities.length > 0) {
        const sumAct = curr.activities.reduce((s: number, a: any) => s + converterHHMMSSParaMinutos(a.formatted), 0);
        return acc + sumAct;
      }
      return acc + converterHHMMSSParaMinutos(curr.horasProduzida || '00:00:00');
    }, 0);

    // Produtividade Mensal (Soma totalHoras ou activities da coleta mensal)
    const totalMensalMin = dataMensal.reduce((acc, curr) => {
      if (curr.activities && curr.activities.length > 0) {
        const sumAct = curr.activities.reduce((s: number, a: any) => s + converterHHMMSSParaMinutos(a.formatted), 0);
        return acc + sumAct;
      }
      return acc + converterHHMMSSParaMinutos(curr.totalHoras || '00:00:00');
    }, 0);

    const totalConsolidadoMin = totalDiarioMin + totalMensalMin;
    const dispH = parseFloat(capacidadeH) || 1;
    const totalConsolidadoH = totalConsolidadoMin / 60;
    const performance = (totalConsolidadoH / dispH) * 100;

    return {
      totalF: minutesToHhmmss(totalConsolidadoMin),
      totalH: totalConsolidadoH,
      diariaF: minutesToHhmmss(totalDiarioMin),
      diariaH: totalDiarioMin / 60,
      mensalF: minutesToHhmmss(totalMensalMin),
      mensalH: totalMensalMin / 60,
      performance,
      dispH
    };
  }, [dataDiaria, dataMensal, capacidadeH]);

  const capacityChartData = useMemo(() => [
    { name: 'Prod. Diária', value: stats.diariaH, color: '#10b981' },
    { name: 'Prod. Mensal', value: stats.mensalH, color: '#f59e0b' },
    { name: 'Total Produzido', value: stats.totalH, color: '#3b82f6' },
    { name: 'Meta Capacidade', value: stats.dispH, color: '#ef4444' }
  ], [stats]);

  const flowChartData = useMemo(() => {
    const map: Record<string, { nome: string, diaria: number, mensal: number, total: number }> = {};
    const process = (recs: any[], isMensal: boolean) => {
      recs.forEach(rec => {
        (rec.activities || []).forEach((act: any) => {
          const cat = act.categoryNome.toUpperCase();
          if (!map[cat]) map[cat] = { nome: cat, diaria: 0, mensal: 0, total: 0 };
          const hours = converterHHMMSSParaMinutos(act.formatted || '00:00:00') / 60;
          if (isMensal) map[cat].mensal += hours;
          else map[cat].diaria += hours;
          map[cat].total += hours;
        });
      });
    };
    process(dataDiaria, false);
    process(dataMensal, true);
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [dataDiaria, dataMensal]);

  const CustomLabel = (props: any) => {
    const { x, y, width, value } = props;
    if (value === undefined || value === null) return null;
    return (
      <text x={x + width / 2} y={y - 12} fill="#374151" textAnchor="middle" fontSize={10} fontWeight={900}>
        {minutesToHhmmss(value * 60)}
      </text>
    );
  };

  if (loading) return (
    <Box sx={{ p: 10, textAlign: 'center' }}>
      <RefreshCw className="animate-spin mx-auto mb-4 text-orange-600 w-12 h-12" />
      <Typography sx={{ fontWeight: 900, textTransform: 'uppercase', color: 'gray' }}>Consolidando Indicadores...</Typography>
    </Box>
  );

  return (
    <div className="space-y-8 animate-in fade-in pb-16">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tight">Indicadores de Produção</h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Visão Consolidada: Produtividade Diária + Mensal</p>
        </div>
        
        <Box sx={{ bgcolor: 'white', p: 2, px: 3, borderRadius: 5, border: '1px solid #f3f4f6', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
          <TextField 
            label="Meta de Capacidade (H)"
            type="number"
            value={capacidadeH}
            onChange={e => setCapacidadeH(e.target.value)}
            size="small"
            variant="standard"
            InputProps={{ 
              endAdornment: <InputAdornment position="end" sx={{ fontWeight: 900 }}>H</InputAdornment>,
              sx: { fontWeight: 950, color: '#3b82f6', fontSize: '1.2rem' }
            }}
            InputLabelProps={{ sx: { fontWeight: 900, fontSize: '0.65rem', textTransform: 'uppercase' } }}
          />
        </Box>
      </header>

      {/* Seletor de Mês/Ano */}
      <Box sx={{ display: 'flex', gap: 2, bgcolor: 'white', p: 3, borderRadius: 6, border: '1px solid #f3f4f6', alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography sx={{ fontWeight: 900, fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', mr: 2 }}>Período de Análise (Competência):</Typography>
        <TextField 
          type="month" 
          label="Mês Início" 
          value={mesInicio} 
          onChange={e => setMesInicio(e.target.value)} 
          size="small" 
          InputLabelProps={{ shrink: true }} 
          sx={{ '& .MuiInputBase-root': { fontWeight: 800, borderRadius: 3 } }} 
        />
        <TextField 
          type="month" 
          label="Mês Fim" 
          value={mesFim} 
          onChange={e => setMesFim(e.target.value)} 
          size="small" 
          InputLabelProps={{ shrink: true }} 
          sx={{ '& .MuiInputBase-root': { fontWeight: 800, borderRadius: 3 } }} 
        />
        <Button 
          variant="contained" 
          size="small" 
          onClick={loadConsolidatedData}
          startIcon={<RefreshCw size={14} />}
          sx={{ fontWeight: 900, borderRadius: 3, bgcolor: '#FF5A00', ml: 'auto', '&:hover': { bgcolor: '#e04f00' } }}
        >
          Atualizar Dados
        </Button>
      </Box>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Total Produzido" value={stats.totalF} icon={<Sigma className="text-blue-600" />} sub="DIÁRIO + MENSAL" />
        <KpiCard title="Prod. Diária" value={stats.diariaF} icon={<Activity className="text-emerald-600" />} sub="PASSAGENS FINALIZADAS" />
        <KpiCard title="Prod. Mensal" value={stats.mensalF} icon={<Calendar className="text-amber-600" />} sub="COLETAS MENSAIS (REF)" />
        <KpiCard title="Performance" value={`${stats.performance.toFixed(1)}%`} icon={<TrendingUp className="text-rose-600" />} sub="VS META CAPACIDADE" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico 1: Produção vs Meta */}
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100">
          <h3 className="text-sm font-black text-gray-800 mb-8 uppercase tracking-widest flex items-center gap-2">
            <Target size={20} className="text-blue-500" /> Comparativo de Capacidade (Horas)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={capacityChartData} margin={{ top: 30, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }} />
                <YAxis axisLine={false} tickLine={false} style={{ fontSize: '10px', fontWeight: 800 }} tickFormatter={(v) => Math.floor(v) + 'h'} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }} 
                  formatter={(v: number) => [minutesToHhmmss(v * 60), 'Tempo']} 
                  contentStyle={{ borderRadius: '1.2rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="value" radius={[14, 14, 0, 0]} barSize={55}>
                  {capacityChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                  <LabelList dataKey="value" content={<CustomLabel />} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Composição por Fluxo */}
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100">
          <h3 className="text-sm font-black text-gray-800 mb-8 uppercase tracking-widest flex items-center gap-2">
            <CalendarDays size={20} className="text-orange-500" /> Distribuição por Fluxo de Trabalho (H)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={flowChartData} margin={{ top: 30, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="nome" axisLine={false} tickLine={false} style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }} />
                <YAxis axisLine={false} tickLine={false} style={{ fontSize: '10px', fontWeight: 800 }} tickFormatter={(v) => Math.floor(v) + 'h'} />
                <Tooltip 
                  formatter={(v: number) => minutesToHhmmss(v * 60)} 
                  contentStyle={{ borderRadius: '1rem', fontWeight: 900 }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', paddingTop: '20px' }} />
                <Bar dataKey="diaria" stackId="a" fill="#10b981" name="H. Diária" />
                <Bar dataKey="mensal" stackId="a" fill="#f59e0b" name="H. Mensal" />
                <Bar dataKey="total" fill="#e2e8f0" name="Total Acumulado" radius={[6, 6, 0, 0]}>
                  <LabelList dataKey="total" content={<CustomLabel />} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detalhamento por Categoria */}
      <Box sx={{ mt: 10 }}>
        <Typography variant="h5" sx={{ fontWeight: 950, color: '#1f2937', mb: 5, display: 'flex', alignItems: 'center', gap: 2, textTransform: 'uppercase' }}>
          <Hash size={28} className="text-orange-600" /> Distribuição de Horas por Fluxo
        </Typography>
        <Grid container spacing={4}>
          {flowChartData.map((cat, idx) => (
            <Grid item xs={12} md={6} key={idx}>
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 h-full transition-all hover:shadow-md">
                <h4 className="text-xs font-black text-orange-600 mb-6 uppercase tracking-[0.2em] flex items-center gap-3">
                  <ChevronRight size={16} className="bg-orange-50 rounded-full" /> {cat.nome}
                </h4>
                <div className="flex justify-between items-end">
                   <div className="space-y-2">
                      <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Tempo Total Consolidado</p>
                      <p className="text-4xl font-black text-gray-800 tracking-tighter">{minutesToHhmmss(cat.total * 60)}</p>
                   </div>
                   <div className="text-right space-y-2">
                      <div className="flex items-center justify-end gap-3 text-[11px] font-black text-emerald-600 uppercase bg-emerald-50 px-4 py-2 rounded-2xl">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" /> 
                        Diário: {minutesToHhmmss(cat.diaria * 60)}
                      </div>
                      <div className="flex items-center justify-end gap-3 text-[11px] font-black text-amber-500 uppercase bg-amber-50 px-4 py-2 rounded-2xl">
                        <div className="w-2 h-2 rounded-full bg-amber-500" /> 
                        Mensal: {minutesToHhmmss(cat.mensal * 60)}
                      </div>
                   </div>
                </div>
              </div>
            </Grid>
          ))}
          {flowChartData.length === 0 && (
            <Grid item xs={12}>
              <Box sx={{ p: 10, textAlign: 'center', bgcolor: 'white', borderRadius: 10, border: '2px dashed #f3f4f6' }}>
                <Typography sx={{ fontWeight: 800, color: '#d1d5db', textTransform: 'uppercase' }}>Nenhuma produção registrada para o período selecionado</Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </Box>
    </div>
  );
};

const KpiCard: React.FC<{title: string, value: string, icon: React.ReactNode, sub: string}> = ({title, value, icon, sub}) => (
  <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center justify-between transition-all hover:scale-[1.02] hover:shadow-lg">
    <div>
      <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{title}</p>
      <h3 className="text-3xl font-black text-gray-800 tracking-tighter mb-1">{value}</h3>
      <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest bg-orange-50 px-2 py-0.5 rounded-full">{sub}</span>
    </div>
    <div className="p-5 bg-orange-50/50 rounded-3xl text-orange-600 shadow-inner">{icon}</div>
  </div>
);

export default DashboardPage;
