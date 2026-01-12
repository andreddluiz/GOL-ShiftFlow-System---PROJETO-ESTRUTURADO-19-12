
import React, { useMemo, useEffect, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LabelList,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, Sigma, Activity, Calendar, 
  Target, RefreshCw, Layers,
  BarChart3, ArrowRightLeft, Globe, MapPin, ListChecks,
  Search, Layout, History
} from 'lucide-react';
import { 
  Box, Typography, TextField, Grid, 
  Button, Tabs, Tab,
  MenuItem, Divider, Alert, FormControl, InputLabel, Select, OutlinedInput, Chip
} from '@mui/material';
import { useStore } from '../hooks/useStore';
import { minutesToHhmmss, CustomLabel } from '../modals';
import dayjs from 'dayjs';
import { baseService } from '../services';
import { authService } from '../services/authService';
import { dataAccessControlService } from '../services/dataAccessControlService';

function converterHHMMSSParaMinutos(hhmmss: string): number {
  if (!hhmmss || typeof hhmmss !== 'string') return 0;
  try {
    const trimmed = hhmmss.trim();
    if (trimmed === '00:00:00' || trimmed === '00:00' || trimmed === '') return 0;
    const partes = trimmed.split(':');
    let horas = 0, minutos = 0, segundos = 0;
    if (partes.length === 3) { horas = parseInt(partes[0]) || 0; minutos = parseInt(partes[1]) || 0; segundos = parseInt(partes[2]) || 0; }
    else if (partes.length === 2) { horas = parseInt(partes[0]) || 0; minutos = parseInt(partes[1]) || 0; }
    else if (partes.length === 1) { horas = parseInt(partes[0]) || 0; }
    return (horas * 60) + minutos + (segundos / 60);
  } catch (error) { return 0; }
}

function normalizarParaCompetencia(dataStr: string): string {
  if (!dataStr) return '';
  if (dataStr.includes('/') && dataStr.split('/').length === 3) { const parts = dataStr.split('/'); return `${parts[1]}/${parts[2]}`; }
  if (dataStr.includes('-')) { const parts = dataStr.split('-'); return `${parts[1]}/${parts[0]}`; }
  return dataStr;
}

const DashboardPage: React.FC<{baseId?: string}> = ({ baseId }) => {
  const { initialized, refreshData, bases } = useStore();
  const [usuario] = useState(() => authService.obterUsuarioAutenticado());
  const [activeTab, setActiveTab] = useState(0);
  const [dataFilter] = useState<'todos' | 'diario' | 'mensal'>('todos');
  const [exibirRotulos, setExibirRotulos] = useState<boolean>(false);
  const [dataDiaria, setDataDiaria] = useState<any[]>([]);
  const [dataMensal, setDataMensal] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mesInicio, setMesInicio] = useState(dayjs().subtract(3, 'month').format('YYYY-MM'));
  const [mesFim, setMesFim] = useState(dayjs().format('YYYY-MM'));
  const [metaBaseAtual, setMetaBaseAtual] = useState<number>(160);
  const [baseSelecionadaFiltro, setBaseSelecionadaFiltro] = useState<string>('all');
  
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>('all');
  const [visaoGeralFiltro, setVisaoGeralFiltro] = useState<'todos' | 'categoria' | 'mes'>('todos');
  const [categoriasEvolucaoSelecionadas, setCategoriasEvolucaoSelecionadas] = useState<string[]>([]);

  const basesAcessiveis = useMemo(() => dataAccessControlService.obterBasesAcessiveis(usuario, bases), [usuario, bases]);

  useEffect(() => {
    if (baseId) {
      setBaseSelecionadaFiltro(baseId);
    } else if (usuario && usuario.perfil !== 'ADMINISTRADOR') {
      const bValida = dataAccessControlService.validarBaseAtual(usuario, 'all');
      setBaseSelecionadaFiltro(bValida);
    }
  }, [baseId, usuario]);

  useEffect(() => {
    if (baseSelecionadaFiltro !== 'all' && mesFim) {
      const mesNum = dayjs(mesFim).month() + 1;
      baseService.obterMetaHoras(baseSelecionadaFiltro, mesNum).then(setMetaBaseAtual);
    } else {
      setMetaBaseAtual(160);
    }
  }, [baseSelecionadaFiltro, mesFim]);

  const loadConsolidatedData = () => {
    if (!initialized || bases.length === 0) { setLoading(false); return; }
    setLoading(true);
    
    const dailyRaw = localStorage.getItem('gol_rep_detalhamento');
    const monthlyRaw = localStorage.getItem('gol_rep_mensal_detalhado');
    let dailyRecords = dailyRaw ? JSON.parse(dailyRaw) : [];
    let monthlyRecords = monthlyRaw ? JSON.parse(monthlyRaw) : [];

    dailyRecords = dataAccessControlService.filtrarDadosPorPermissao(dailyRecords, usuario);
    monthlyRecords = dataAccessControlService.filtrarDadosPorPermissao(monthlyRecords, usuario);

    const baseParaFiltrar = baseSelecionadaFiltro;
    if (baseParaFiltrar && baseParaFiltrar !== 'all') { 
      dailyRecords = dailyRecords.filter((item: any) => item.baseId === baseParaFiltrar); 
      monthlyRecords = monthlyRecords.filter((item: any) => item.baseId === baseParaFiltrar); 
    }
    
    const startLimit = dayjs(mesInicio + '-01').startOf('month');
    const endLimit = dayjs(mesFim + '-01').endOf('month');
    
    const dailyFiltrado = dailyRecords.filter((item: any) => { 
      const itemComp = normalizarParaCompetencia(item.data); 
      const [m, y] = itemComp.split('/'); 
      const itemDate = dayjs(`${y}-${m}-01`); 
      return (itemDate.isSame(startLimit) || itemDate.isAfter(startLimit)) && (itemDate.isSame(endLimit) || itemDate.isBefore(endLimit)); 
    });
    
    const monthlyFiltrado = monthlyRecords.filter((item: any) => { 
      const itemComp = item.mesReferencia || normalizarParaCompetencia(item.data); 
      if (!itemComp) return false; 
      const [m, y] = itemComp.split('/'); 
      const itemDate = dayjs(`${y}-${m}-01`); 
      return (itemDate.isSame(startLimit) || itemDate.isAfter(startLimit)) && (itemDate.isSame(endLimit) || itemDate.isBefore(endLimit)); 
    });
    
    setDataDiaria(dailyFiltrado); 
    setDataMensal(monthlyFiltrado); 
    setLoading(false);
  };

  useEffect(() => { 
    loadConsolidatedData(); 
    if (!initialized) refreshData(); 
  }, [baseSelecionadaFiltro, initialized, mesInicio, mesFim, bases, dataFilter, usuario]);

  const stats = useMemo(() => {
    let diariaMin = 0; let mensalMin = 0; let dispMetaMin = (metaBaseAtual || 160) * 60;
    dataDiaria.forEach(curr => { diariaMin += converterHHMMSSParaMinutos(curr.horasProduzida || '00:00:00'); });
    dataMensal.forEach(curr => { mensalMin += converterHHMMSSParaMinutos(curr.totalHoras || '00:00:00'); });
    
    let displayProdMin = 0;
    if (dataFilter === 'diario') displayProdMin = diariaMin;
    else if (dataFilter === 'mensal') displayProdMin = mensalMin;
    else displayProdMin = diariaMin + mensalMin;

    return { 
      totalProdF: minutesToHhmmss(displayProdMin), 
      diariaF: minutesToHhmmss(diariaMin), 
      mensalF: minutesToHhmmss(mensalMin), 
      performance: dispMetaMin > 0 ? (displayProdMin / dispMetaMin) * 100 : 0 
    };
  }, [dataDiaria, dataMensal, metaBaseAtual, dataFilter]);

  const categoryChartData = useMemo(() => {
    const map: Record<string, { nome: string, diario: number, mensal: number, total: number }> = {};
    
    if (dataFilter !== 'mensal') {
      dataDiaria.forEach(rec => { 
        (rec.activities || []).forEach((act: any) => { 
          const cat = act.categoryNome.toUpperCase(); 
          if (!map[cat]) map[cat] = { nome: cat, diario: 0, mensal: 0, total: 0 }; 
          const mins = converterHHMMSSParaMinutos(act.formatted || '00:00:00') / 60;
          map[cat].diario += mins; 
          map[cat].total += mins; 
        }); 
      });
    }
    
    if (dataFilter !== 'diario') {
      dataMensal.forEach(rec => { 
        (rec.activities || []).forEach((act: any) => { 
          const cat = act.categoryNome.toUpperCase(); 
          if (!map[cat]) map[cat] = { nome: cat, diario: 0, mensal: 0, total: 0 }; 
          const mins = converterHHMMSSParaMinutos(act.formatted || '00:00:00') / 60;
          map[cat].mensal += mins; 
          map[cat].total += mins; 
        }); 
      });
    }
    
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [dataDiaria, dataMensal, dataFilter]);

  const taskDetailCharts = useMemo(() => {
    const dailyMap: Record<string, { category: string, tasks: { name: string, value: number }[] }> = {};
    const monthlyMap: Record<string, { category: string, tasks: { name: string, value: number }[] }> = {};

    dataDiaria.forEach(rec => {
      (rec.activities || []).forEach((act: any) => {
        const cat = act.categoryNome.toUpperCase();
        const task = act.taskNome.toUpperCase();
        const val = converterHHMMSSParaMinutos(act.formatted || '00:00:00') / 60;

        if (!dailyMap[cat]) dailyMap[cat] = { category: cat, tasks: [] };
        const taskEntry = dailyMap[cat].tasks.find(t => t.name === task);
        if (taskEntry) taskEntry.value += val;
        else dailyMap[cat].tasks.push({ name: task, value: val });
      });
    });

    dataMensal.forEach(rec => {
      (rec.activities || []).forEach((act: any) => {
        const cat = act.categoryNome.toUpperCase();
        const task = act.taskNome.toUpperCase();
        const val = converterHHMMSSParaMinutos(act.formatted || '00:00:00') / 60;

        if (!monthlyMap[cat]) monthlyMap[cat] = { category: cat, tasks: [] };
        const taskEntry = monthlyMap[cat].tasks.find(t => t.name === task);
        if (taskEntry) taskEntry.value += val;
        else monthlyMap[cat].tasks.push({ name: task, value: val });
      });
    });

    return { 
      daily: Object.values(dailyMap).sort((a, b) => a.category.localeCompare(b.category)), 
      monthly: Object.values(monthlyMap).sort((a, b) => a.category.localeCompare(b.category)) 
    };
  }, [dataDiaria, dataMensal]);

  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    taskDetailCharts.daily.forEach(c => cats.add(c.category));
    taskDetailCharts.monthly.forEach(c => cats.add(c.category));
    return Array.from(cats).sort();
  }, [taskDetailCharts]);

  const comparisonTrendData = useMemo(() => {
    const monthsMap: Record<string, { month: string, produzido: number, disponivel: number, sortKey: string }> = {};
    
    if (dataFilter !== 'mensal') {
      dataDiaria.forEach(rec => { 
        const comp = normalizarParaCompetencia(rec.data); 
        const [m, y] = comp.split('/'); 
        const key = `${y}-${m}`; 
        if (!monthsMap[key]) monthsMap[key] = { month: comp, produzido: 0, disponivel: 0, sortKey: key }; 
        monthsMap[key].produzido += converterHHMMSSParaMinutos(rec.horasProduzida) / 60; 
        monthsMap[key].disponivel += converterHHMMSSParaMinutos(rec.horasDisponivel) / 60; 
      });
    }
    
    if (dataFilter !== 'diario') {
      dataMensal.forEach(rec => { 
        const comp = rec.mesReferencia || normalizarParaCompetencia(rec.data); 
        const [m, y] = comp.split('/'); 
        const key = `${y}-${m}`; 
        if (!monthsMap[key]) monthsMap[key] = { month: comp, produzido: 0, disponivel: 0, sortKey: key }; 
        monthsMap[key].produzido += converterHHMMSSParaMinutos(rec.totalHoras) / 60; 
      });
    }
    
    return Object.values(monthsMap).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [dataDiaria, dataMensal, dataFilter]);

  const categoryEvolutionData = useMemo(() => {
    const monthsMap: Record<string, { month: string, sortKey: string, [cat: string]: any }> = {};
    
    const processRecords = (records: any[], isDiaria: boolean) => {
      records.forEach(rec => {
        const comp = isDiaria ? normalizarParaCompetencia(rec.data) : (rec.mesReferencia || normalizarParaCompetencia(rec.data));
        const [m, y] = comp.split('/');
        const key = `${y}-${m}`;
        if (!monthsMap[key]) monthsMap[key] = { month: comp, sortKey: key };
        
        (rec.activities || []).forEach((act: any) => {
          const cat = act.categoryNome.toUpperCase();
          const mins = converterHHMMSSParaMinutos(act.formatted || '00:00:00') / 60;
          monthsMap[key][cat] = (monthsMap[key][cat] || 0) + mins;
        });
      });
    };

    if (dataFilter !== 'mensal') processRecords(dataDiaria, true);
    if (dataFilter !== 'diario') processRecords(dataMensal, false);

    const sortedData = Object.values(monthsMap).sort((a: any, b: any) => a.sortKey.localeCompare(b.sortKey));
    return sortedData;
  }, [dataDiaria, dataMensal, dataFilter]);

  if (loading) return <Box sx={{ p: 10, textAlign: 'center' }}><RefreshCw className="animate-spin mx-auto mb-4 text-orange-600 w-12 h-12" /><Typography sx={{ fontWeight: 900, textTransform: 'uppercase', color: 'gray' }}>Gerando Indicadores...</Typography></Box>;

  return (
    <div className="space-y-8 animate-in fade-in pb-16">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-800 dark:text-white uppercase tracking-tight">Análise de Produção</h2>
          <div className="flex items-center gap-2 mt-1">
             <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Consolidação e Performance</p>
             <span className="w-1 h-1 bg-gray-300 rounded-full" />
             <p className="text-xs font-black text-orange-600 uppercase tracking-widest">
               {baseSelecionadaFiltro === 'all' ? 'Consolidado' : `Base: ${bases.find(b => b.id === baseSelecionadaFiltro)?.sigla}`}
             </p>
          </div>
        </div>
        
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel children="Selecionar Base" sx={{ fontWeight: 800, fontSize: '0.7rem' }} />
            <Select
              value={baseSelecionadaFiltro}
              label="Selecionar Base"
              onChange={(e) => setBaseSelecionadaFiltro(e.target.value)}
              sx={{ borderRadius: 3, fontWeight: 900, bgcolor: 'white', fontSize: '0.75rem' }}
            >
              {usuario?.perfil === 'ADMINISTRADOR' && (
                <MenuItem value="all">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Globe size={14} className="text-blue-500" />
                    <strong>TODAS AS BASES</strong>
                  </Box>
                </MenuItem>
              )}
              {basesAcessiveis.map(b => (
                <MenuItem key={b.id} value={b.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MapPin size={14} className="text-orange-500" />
                    {b.sigla} - {b.nome}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ bgcolor: 'white', p: 2, px: 3, borderRadius: 5, border: '1px solid #f3f4f6', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box>
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 950, color: '#9ca3af', textTransform: 'uppercase', mb: 0.5 }}>HH Disponível (HH:MM:SS)</Typography>
              <Typography variant="h4" sx={{ fontWeight: 950, color: '#2563eb' }}>{minutesToHhmmss(metaBaseAtual * 60)}</Typography>
            </Box>
            <Target className="text-blue-100" size={40} />
          </Box>
        </Box>
      </header>

      {usuario?.perfil !== 'ADMINISTRADOR' && (
        <Alert severity="info" sx={{ borderRadius: 4, mb: 2, fontWeight: 700 }}>
          Exibindo indicadores das bases onde você possui acesso ({basesAcessiveis.length}).
        </Alert>
      )}

      {basesAcessiveis.length === 0 && usuario?.perfil !== 'ADMINISTRADOR' ? (
        <Alert severity="error" sx={{ borderRadius: 4 }}>Você não possui acesso a nenhuma base operacional.</Alert>
      ) : (
        <>
          <Box sx={{ display: 'flex', gap: 2, bgcolor: 'white', p: 1.5, borderRadius: 6, border: '1px solid #f3f4f6', alignItems: 'center', flexWrap: 'wrap' }}>
            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mr: 'auto' }}>
              <Tab icon={<BarChart3 size={16}/>} iconPosition="start" label="Visão Geral" sx={{ fontWeight: 900, fontSize: '0.7rem' }} />
              <Tab icon={<ArrowRightLeft size={16}/>} iconPosition="start" label="Evolução" sx={{ fontWeight: 900, fontSize: '0.7rem' }} />
            </Tabs>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2 }}>
              <Calendar size={14} className="text-gray-400" />
              <TextField type="month" value={mesInicio} onChange={e => setMesInicio(e.target.value)} size="small" variant="standard" InputProps={{ disableUnderline: true, sx: { fontSize: '0.75rem', fontWeight: 800 } }} />
              <Typography sx={{ fontWeight: 900, color: '#d1d5db' }}>—</Typography>
              <TextField type="month" value={mesFim} onChange={e => setMesFim(e.target.value)} size="small" variant="standard" InputProps={{ disableUnderline: true, sx: { fontSize: '0.75rem', fontWeight: 800 } }} />
            </Box>
            
            <Button variant={exibirRotulos ? "contained" : "outlined"} color="warning" size="small" onClick={() => setExibirRotulos(!exibirRotulos)} sx={{ fontWeight: 900, fontSize: '0.65rem', borderRadius: 2 }}>
              {exibirRotulos ? "Ocultar Rótulos" : "Exibir Rótulos"}
            </Button>
          </Box>

          {activeTab === 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard title="Total Produzido" value={stats.totalProdF} icon={<Sigma className="text-blue-600" />} sub={dataFilter.toUpperCase()} />
                <KpiCard title="Dados Diários" value={stats.diariaF} icon={<Activity className="text-emerald-600" />} sub="PROCESSOS" />
                <KpiCard title="Dados Mensais" value={stats.mensalF} icon={<Calendar className="text-amber-600" />} sub="INDICADORES" />
                <KpiCard title="Performance Meta" value={`${stats.performance.toFixed(1)}%`} icon={<TrendingUp className="text-rose-600" />} sub="CALCULADO" />
              </div>

              <Box sx={{ mt: 4, p: 3, bgcolor: 'white', borderRadius: 8, border: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Layout size={20} className="text-orange-500" />
                    <Typography sx={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.8rem', color: '#374151' }}>Filtro de Gráficos de Visão Geral:</Typography>
                </Box>
                <FormControl size="small" sx={{ minWidth: 300 }}>
                    <Select
                      value={visaoGeralFiltro}
                      onChange={(e) => setVisaoGeralFiltro(e.target.value as any)}
                      sx={{ borderRadius: 4, fontWeight: 800, bgcolor: '#f9fafb' }}
                    >
                      <MenuItem value="todos"><strong>VER AMBOS OS GRÁFICOS</strong></MenuItem>
                      <MenuItem value="categoria">PRODUÇÃO POR CATEGORIA</MenuItem>
                      <MenuItem value="mes">DETALHAMENTO POR MÊS</MenuItem>
                    </Select>
                </FormControl>
              </Box>

              <div className="flex flex-col gap-8 mt-2">
                {(visaoGeralFiltro === 'todos' || visaoGeralFiltro === 'categoria') && (
                  <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 w-full animate-in fade-in slide-in-from-bottom-2">
                    <h3 className="text-xs font-black text-gray-400 mb-8 uppercase tracking-[0.2em] flex items-center gap-2"><Layers size={16} className="text-orange-500" /> Produção por Categoria (HH:MM:SS)</h3>
                    {/* FIXED: Wrapper div with inline style to prevent width(-1) and height(-1) */}
                    <div style={{ width: '100%', height: 500, minHeight: 500, minWidth: 0 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryChartData} layout="vertical" margin={{ top: 10, right: 100, left: 100, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                          <XAxis type="number" hide />
                          <YAxis type="category" dataKey="nome" axisLine={false} tickLine={false} style={{ fontSize: '9px', fontWeight: 900 }} width={120} />
                          <Tooltip 
                            cursor={{ fill: '#f8fafc' }} 
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-white p-4 border border-gray-100 rounded-2xl shadow-xl">
                                    <p className="font-black text-xs uppercase mb-2 text-gray-500">{label}</p>
                                    <div className="space-y-1">
                                      <p className="text-xs font-bold text-orange-600">Diário: {minutesToHhmmss(data.diario * 60)}</p>
                                      <p className="text-xs font-bold text-blue-600">Mensal: {minutesToHhmmss(data.mensal * 60)}</p>
                                      <div className="pt-1 mt-1 border-t border-gray-50">
                                          <p className="text-sm font-black text-gray-800">Total Consolidado: {minutesToHhmmss(data.total * 60)}</p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="diario" name="Diário" stackId="a" fill="#FF5A00" />
                          <Bar dataKey="mensal" name="Mensal" stackId="a" fill="#0ea5e9" radius={[0, 4, 4, 0]}>
                            <LabelList dataKey="total" position="right" content={<CustomLabel exibir={exibirRotulos} formato="horas" />} />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
                
                {(visaoGeralFiltro === 'todos' || visaoGeralFiltro === 'mes') && (
                  <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 w-full animate-in fade-in slide-in-from-bottom-2">
                    <h3 className="text-xs font-black text-gray-400 mb-8 uppercase tracking-[0.2em] flex items-center gap-2"><Target size={16} className="text-blue-500" /> Detalhamento por Mês (HH:MM:SS)</h3>
                    {/* FIXED: Wrapper div with inline style to prevent width(-1) and height(-1) */}
                    <div style={{ width: '100%', height: 500, minHeight: 500, minWidth: 0 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={comparisonTrendData} margin={{ top: 20, right: 40, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} style={{ fontSize: '10px', fontWeight: 900 }} />
                          <YAxis axisLine={false} tickLine={false} style={{ fontSize: '10px' }} />
                          <Tooltip formatter={(v: number) => minutesToHhmmss(v * 60)} />
                          <Area type="monotone" dataKey="produzido" name="Produção" stroke="#FF5A00" fill="#FF5A00" fillOpacity={0.1}>
                            <LabelList dataKey="produzido" position="top" content={<CustomLabel exibir={exibirRotulos} formato="horas" />} />
                          </Area>
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>

              <Box sx={{ mt: 10, mb: 4, p: 3, bgcolor: 'white', borderRadius: 8, border: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Search size={20} className="text-orange-500" />
                    <Typography sx={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.8rem', color: '#374151' }}>Filtro de Gráficos Específicos:</Typography>
                </Box>
                <FormControl size="small" sx={{ minWidth: 350 }}>
                    <Select
                      value={categoriaSelecionada}
                      onChange={(e) => setCategoriaSelecionada(e.target.value)}
                      sx={{ borderRadius: 4, fontWeight: 800, bgcolor: '#f9fafb' }}
                    >
                      <MenuItem value="all"><strong>TODOS OS GRÁFICOS (UM EMBAIXO DO OUTRO)</strong></MenuItem>
                      <Divider />
                      {availableCategories.map(cat => (
                        <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                      ))}
                    </Select>
                </FormControl>
              </Box>

              {dataFilter !== 'mensal' && taskDetailCharts.daily.length > 0 && (
                <div className="space-y-6 mt-6">
                  <div className="flex items-center gap-3 px-4">
                      <div className="w-1.5 h-8 bg-orange-600 rounded-full" />
                      <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Indicadores Detalhamento Diário</h3>
                  </div>
                  <div className="flex flex-col gap-8">
                      {taskDetailCharts.daily
                        .filter(c => categoriaSelecionada === 'all' || c.category === categoriaSelecionada)
                        .map((catData, idx) => (
                        <CategoryTaskChart 
                          key={`daily-${idx}`} 
                          title={catData.category} 
                          data={catData.tasks} 
                          color="#FF5A00" 
                          exibirRotulos={exibirRotulos} 
                        />
                      ))}
                  </div>
                </div>
              )}

              {dataFilter !== 'diario' && taskDetailCharts.monthly.length > 0 && (
                <div className="space-y-6 mt-12">
                  <div className="flex items-center gap-3 px-4">
                      <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
                      <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Indicadores Detalhamento Mensal</h3>
                  </div>
                  <div className="flex flex-col gap-8">
                      {taskDetailCharts.monthly
                        .filter(c => categoriaSelecionada === 'all' || c.category === categoriaSelecionada)
                        .map((catData, idx) => (
                        <CategoryTaskChart 
                          key={`monthly-${idx}`} 
                          title={catData.category} 
                          data={catData.tasks} 
                          color="#0ea5e9" 
                          exibirRotulos={exibirRotulos} 
                        />
                      ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-12">
              <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-gray-100">
                <h3 className="text-sm font-black text-gray-400 mb-10 uppercase tracking-[0.2em] flex items-center gap-3"><TrendingUp size={20} className="text-orange-500" /> Histórico Evolutivo Global (HH:MM:SS)</h3>
                {/* FIXED: Wrapper div with inline style to prevent width(-1) and height(-1) */}
                <div style={{ width: '100%', height: 400, minHeight: 400, minWidth: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonTrendData} margin={{ top: 30, right: 30, left: 20, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} style={{ fontSize: '11px', fontWeight: 900 }} />
                      <YAxis axisLine={false} tickLine={false} style={{ fontSize: '11px' }} />
                      <Tooltip formatter={(v: number) => minutesToHhmmss(v * 60)} />
                      <Bar dataKey="produzido" name="Horas Produzidas" fill="#FF5A00" radius={[4, 4, 0, 0]}>
                        <LabelList dataKey="produzido" position="insideTop" content={<CustomLabel exibir={exibirRotulos} formato="horas" />} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <Box sx={{ mt: 10, spaceY: 6 }}>
                <div className="flex items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex-wrap">
                  <div className="flex items-center gap-3">
                      <div className="p-3 bg-orange-50 rounded-2xl">
                        <History size={24} className="text-orange-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Evolutivo por Categoria</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Análise temporal individualizada.</p>
                      </div>
                  </div>
                  
                  <FormControl size="small" sx={{ minWidth: 400 }}>
                      <InputLabel children="Selecionar Categorias para Evolução" sx={{ fontSize: '0.75rem', fontWeight: 800 }} />
                      <Select
                        multiple
                        value={categoriasEvolucaoSelecionadas}
                        onChange={(e) => setCategoriasEvolucaoSelecionadas(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                        input={<OutlinedInput label="Selecionar Categorias para Evolução" sx={{ borderRadius: 4 }} />}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip key={value} label={value} size="small" sx={{ fontWeight: 900, fontSize: '0.65rem' }} />
                            ))}
                          </Box>
                        )}
                        sx={{ fontWeight: 800, bgcolor: '#f9fafb' }}
                      >
                        {availableCategories.map((name) => (
                          <MenuItem key={name} value={name} sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                            {name}
                          </MenuItem>
                        ))}
                      </Select>
                  </FormControl>
                </div>

                <div className="flex flex-col gap-8 mt-8">
                  {categoriasEvolucaoSelecionadas.length > 0 ? (
                    categoriasEvolucaoSelecionadas.map((cat, idx) => (
                      <CategoryEvolutionChart 
                        key={`evol-${idx}`}
                        title={cat}
                        data={categoryEvolutionData.map(d => ({
                          month: d.month,
                          value: d[cat] || 0
                        }))}
                        color={idx % 2 === 0 ? "#FF5A00" : "#0ea5e9"}
                        exibirRotulos={exibirRotulos}
                      />
                    ))
                  ) : (
                    <Box sx={{ p: 10, textAlign: 'center', bgcolor: 'white', borderRadius: 10, border: '2px dashed #e5e7eb' }}>
                        <History size={48} className="mx-auto mb-4 text-gray-200" />
                        <Typography sx={{ fontWeight: 900, color: '#9ca3af', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em' }}>
                          Selecione uma ou mais categorias acima para visualizar o histórico evolutivo mensal.
                        </Typography>
                    </Box>
                  )}
                </div>
              </Box>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const CategoryEvolutionChart: React.FC<{
  title: string,
  data: { month: string, value: number }[],
  color: string,
  exibirRotulos: boolean
}> = ({ title, data, color, exibirRotulos }) => {
  return (
    <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 w-full animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gray-50 rounded-2xl">
            <TrendingUp size={20} className="text-orange-500" />
          </div>
          <div>
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Tendência Mensal</h4>
            <p className="text-xl font-black text-gray-800 uppercase tracking-tight">{title}</p>
          </div>
        </div>
      </div>
      {/* FIXED: Wrapper div with inline style to prevent width(-1) and height(-1) */}
      <div style={{ width: '100%', height: 320, minHeight: 320, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 30, right: 30, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} style={{ fontSize: '10px', fontWeight: 900 }} />
            <YAxis axisLine={false} tickLine={false} style={{ fontSize: '10px' }} />
            <Tooltip formatter={(v: number) => [minutesToHhmmss(v * 60), 'Tempo']} />
            <Area type="monotone" dataKey="value" name="Produção" stroke={color} fill={color} fillOpacity={0.1}>
               <LabelList dataKey="value" position="top" content={<CustomLabel exibir={exibirRotulos} formato="horas" />} />
            </Area>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const CategoryTaskChart: React.FC<{ 
  title: string, 
  data: { name: string, value: number }[], 
  color: string, 
  exibirRotulos: boolean 
}> = ({ title, data, color, exibirRotulos }) => {
  const chartHeight = Math.max(350, data.length * 45);

  return (
    <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col w-full animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gray-50 rounded-2xl">
            <ListChecks size={20} className="text-orange-500" />
          </div>
          <div>
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Categoria Selecionada</h4>
            <p className="text-xl font-black text-gray-800 uppercase tracking-tight">{title}</p>
          </div>
        </div>
      </div>
      {/* FIXED: Wrapper div with inline style to prevent width(-1) and height(-1) */}
      <div style={{ height: `${chartHeight}px`, width: '100%', minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={[...data].sort((a,b) => b.value - a.value)} 
            layout="vertical" 
            margin={{ top: 5, right: 80, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis type="number" hide />
            <YAxis 
              type="category" 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              width={250}
              style={{ fontSize: '10px', fontWeight: 850, fill: '#374151' }} 
            />
            <Tooltip 
              cursor={{ fill: '#f8fafc' }} 
              formatter={(v: number) => [minutesToHhmmss(v * 60), 'Tempo Total']} 
            />
            <Bar dataKey="value" fill={color} radius={[0, 8, 8, 0]}>
              <LabelList dataKey="value" position="insideRight" content={<CustomLabel exibir={exibirRotulos} formato="horas" />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
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
