
import React, { useMemo, useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LabelList
} from 'recharts';
import { 
  TrendingUp, Sigma, Activity, Target, RefreshCw, 
  BarChart3, Globe, MapPin
} from 'lucide-react';
import { Box, Typography, Grid, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useStore } from '../hooks/useStore';
import { useAuth } from '../hooks/useAuth';
import { minutesToHhmmss, hhmmssToMinutes } from '../modals';
import dayjs from 'dayjs';
import { baseService, loadHandovers } from '../services';

const DashboardPage: React.FC<{baseId?: string}> = ({ baseId }) => {
  const { user, loading: authLoading } = useAuth();
  const { initialized, bases } = useStore();
  
  const [loading, setLoading] = useState(false);
  const [baseSelecionadaFiltro, setBaseSelecionadaFiltro] = useState<string>('');
  const [dashboardData, setDashboardData] = useState<any[]>([]);
  const [metaBaseAtual, setMetaBaseAtual] = useState<number>(160);

  // Sincroniza filtro inicial
  useEffect(() => {
    if (baseId) setBaseSelecionadaFiltro(baseId);
    else if (user && user.bases.length > 0 && !baseSelecionadaFiltro) {
      setBaseSelecionadaFiltro(user.bases[0]);
    }
  }, [baseId, user]);

  const loadDashboardData = async () => {
    if (!baseSelecionadaFiltro) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const today = dayjs().format('YYYY-MM-DD');
      const thirtyDaysAgo = dayjs().subtract(30, 'days').format('YYYY-MM-DD');
      
      const snapshots = await loadHandovers(baseSelecionadaFiltro, thirtyDaysAgo, today);
      setDashboardData(snapshots || []);
      
      const mesNum = dayjs().month() + 1;
      const meta = await baseService.obterMetaHoras(baseSelecionadaFiltro, mesNum);
      setMetaBaseAtual(meta);
    } catch (error) {
      console.error("[Dashboard Error]", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialized && baseSelecionadaFiltro) {
      loadDashboardData();
    }
  }, [baseSelecionadaFiltro, initialized]);

  const stats = useMemo(() => {
    let prodMin = 0;
    let dispMetaMin = (metaBaseAtual || 160) * 60;
    
    dashboardData.forEach(curr => {
      prodMin += hhmmssToMinutes(curr.horasProduzida || curr.horasProduzidas || '00:00:00');
    });

    return { 
      totalProdF: minutesToHhmmss(prodMin), 
      performance: dispMetaMin > 0 ? (prodMin / dispMetaMin) * 100 : 0 
    };
  }, [dashboardData, metaBaseAtual]);

  const basesAcessiveis = useMemo(() => {
    if (!user) return [];
    if (user.permissionLevel === 'ADMINISTRADOR') return bases;
    return bases.filter(b => user.bases.includes(b.id));
  }, [user, bases]);

  if (authLoading) return null;

  if (loading && dashboardData.length === 0) {
    return (
      <Box sx={{ p: 10, textAlign: 'center' }}>
        <RefreshCw className="animate-spin mx-auto mb-4 text-orange-600 w-12 h-12" />
        <Typography sx={{ fontWeight: 900, textTransform: 'uppercase', color: 'gray' }}>Sincronizando com Firestore...</Typography>
      </Box>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in pb-16">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-800 dark:text-white uppercase tracking-tight">Análise de Produção</h2>
          <div className="flex items-center gap-2 mt-1">
             <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sincronizado Cloud</p>
             <span className="w-1 h-1 bg-gray-300 rounded-full" />
             <p className="text-xs font-black text-orange-600 uppercase tracking-widest">
               {baseSelecionadaFiltro === 'all' ? 'Consolidado' : `Base: ${bases.find(b => b.id === baseSelecionadaFiltro)?.sigla || '...'}`}
             </p>
          </div>
        </div>
        
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel sx={{ fontWeight: 800, fontSize: '0.7rem' }}>Filtrar Unidade</InputLabel>
            <Select
              value={baseSelecionadaFiltro}
              label="Filtrar Unidade"
              onChange={(e) => setBaseSelecionadaFiltro(e.target.value)}
              sx={{ borderRadius: 3, fontWeight: 900, bgcolor: 'white', fontSize: '0.75rem' }}
            >
              {basesAcessiveis.map(b => (
                <MenuItem key={b.id} value={b.id}><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><MapPin size={14} className="text-orange-500" />{b.sigla}</Box></MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ bgcolor: 'white', p: 2, px: 3, borderRadius: 5, border: '1px solid #f3f4f6', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box>
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 950, color: '#9ca3af', textTransform: 'uppercase', mb: 0.5 }}>Meta Mensal</Typography>
              <Typography variant="h4" sx={{ fontWeight: 950, color: '#2563eb' }}>{metaBaseAtual}h</Typography>
            </Box>
            <Target className="text-blue-100" size={40} />
          </Box>
        </Box>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <KpiCard title="Produção (30d)" value={stats.totalProdF} icon={<Sigma className="text-blue-600" />} sub="TURNOS" />
        <KpiCard title="Registros" value={String(dashboardData.length)} icon={<Activity className="text-emerald-600" />} sub="CLOUD" />
        <KpiCard title="Performance" value={`${stats.performance.toFixed(1)}%`} icon={<TrendingUp className="text-rose-600" />} sub="EFICIÊNCIA" />
      </div>

      {!loading && dashboardData.length === 0 && (
        <Box sx={{ p: 10, textAlign: 'center', bgcolor: 'white', borderRadius: 8, border: '2px dashed #e5e7eb' }}>
           <BarChart3 size={48} className="mx-auto mb-4 text-gray-200" />
           <Typography sx={{ fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase' }}>Nenhum dado encontrado para esta base nos últimos 30 dias.</Typography>
        </Box>
      )}
    </div>
  );
};

const KpiCard: React.FC<{title: string, value: string, icon: React.ReactNode, sub: string}> = ({title, value, icon, sub}) => (
  <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center justify-between">
    <div>
      <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{title}</p>
      <h3 className="text-3xl font-black text-gray-800 tracking-tighter mb-1">{value}</h3>
      <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest bg-orange-50 px-2 py-0.5 rounded-full">{sub}</span>
    </div>
    <div className="p-5 bg-orange-50/50 rounded-3xl text-orange-600">{icon}</div>
  </div>
);

export default DashboardPage;
