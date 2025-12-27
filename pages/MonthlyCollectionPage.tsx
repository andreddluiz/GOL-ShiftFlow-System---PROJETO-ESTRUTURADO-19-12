
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar, Save, CheckCircle, ArrowLeft, 
  Clock, Hash, Lock, AlertCircle, Info, ChevronRight,
  TrendingUp, BarChart3, Activity, Timer, Edit2
} from 'lucide-react';
import { 
  Box, Typography, Card, CardContent, Grid, FormControl, 
  InputLabel, Select, MenuItem, Button, Alert, Divider,
  TextField, Chip, IconButton, Tooltip
} from '@mui/material';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import { MonthlyCollection, MeasureType } from '../types';
import { TimeInput, minutesToHhmmss, hhmmssToMinutes } from '../modals';

const MonthlyCollectionPage: React.FC<{baseId?: string}> = ({ baseId }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('editId');
  
  const { 
    getMonthlyCategoriesCombinadas, getMonthlyTasksCombinadas, 
    monthlyCollections, saveMonthlyCollection, bases, initialized, refreshData
  } = useStore();

  const currentBase = useMemo(() => bases.find(b => b.id === baseId), [bases, baseId]);
  
  // Seleção de Período
  const [mes, setMes] = useState<number>(new Date().getMonth() + 1);
  const [ano, setAno] = useState<number>(new Date().getFullYear());
  const [coletaAtiva, setColetaAtiva] = useState<MonthlyCollection | null>(null);
  const [valores, setValores] = useState<Record<string, string>>({});

  const categories = useMemo(() => getMonthlyCategoriesCombinadas(baseId), [getMonthlyCategoriesCombinadas, baseId, initialized]);
  const tasks = useMemo(() => getMonthlyTasksCombinadas(baseId), [getMonthlyTasksCombinadas, baseId, initialized]);

  // NOVO: Cálculo de Horas em Tempo Real
  const totalHorasCalculadas = useMemo(() => {
    let totalMins = 0;
    tasks.forEach(task => {
      const val = valores[task.id];
      if (!val) return;
      
      if (task.tipoMedida === MeasureType.TEMPO) {
        totalMins += hhmmssToMinutes(val);
      } else {
        const qty = parseFloat(val) || 0;
        totalMins += qty * task.fatorMultiplicador;
      }
    });
    return minutesToHhmmss(totalMins);
  }, [valores, tasks]);

  useEffect(() => {
    if (!initialized) refreshData();
  }, [initialized, refreshData]);

  // Carrega coleta ao entrar ou via EditId
  useEffect(() => {
    if (!initialized || !baseId) return;

    if (editId) {
      const existing = monthlyCollections.find(c => c.id === editId);
      if (existing) {
        setColetaAtiva(existing);
        setMes(existing.mes);
        setAno(existing.ano);
        setValores(existing.tarefasValores);
        return;
      }
    }

    // Tenta carregar coleta baseada na seleção manual
    const existing = monthlyCollections.find(c => c.baseId === baseId && c.mes === mes && c.ano === ano);
    if (existing) {
      setColetaAtiva(existing);
      setValores(existing.tarefasValores);
    } else {
      setColetaAtiva(null);
      setValores({});
    }
  }, [editId, baseId, mes, ano, monthlyCollections, initialized]);

  const handleCarregar = () => {
    const existing = monthlyCollections.find(c => c.baseId === baseId && c.mes === mes && c.ano === ano);
    if (existing) {
      setColetaAtiva(existing);
      setValores(existing.tarefasValores);
    } else {
      const newId = `monthly_${baseId}_${ano}_${mes}`;
      const newCol: MonthlyCollection = {
        id: newId,
        baseId: baseId || '',
        mes,
        ano,
        status: 'ABERTO',
        tarefasValores: {},
        dataCriacao: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setColetaAtiva(newCol);
      setValores({});
    }
  };

  const handleValueChange = (taskId: string, val: string) => {
    if (coletaAtiva?.status === 'FINALIZADO' && !editId) return;
    setValores(prev => ({ ...prev, [taskId]: val }));
  };

  const handleAction = async (finalizar: boolean) => {
    if (!coletaAtiva || !baseId) return;

    const dataToSave: MonthlyCollection = {
      ...coletaAtiva,
      tarefasValores: valores,
      status: finalizar ? 'FINALIZADO' : 'ABERTO',
      dataFinalizacao: finalizar ? new Date().toISOString() : coletaAtiva.dataFinalizacao,
      updatedAt: new Date().toISOString()
    };

    try {
      await saveMonthlyCollection(dataToSave);
      if (finalizar) {
        alert("Coleta Mensal finalizada com sucesso! Os dados foram bloqueados.");
        if (editId) navigate('/reports');
      } else {
        alert("Rascunho salvo com sucesso.");
      }
    } catch (e) {
      alert("Erro ao salvar os dados.");
    }
  };

  // Se estiver em modo de edição vindo dos relatórios, liberamos os campos mesmo que status seja FINALIZADO
  const isViewOnly = coletaAtiva?.status === 'FINALIZADO' && !editId;
  const isEditMode = !!editId;

  const mesesDisponiveis = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  const anosDisponiveis = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  if (!baseId) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity="info" variant="outlined" sx={{ borderRadius: 4 }}>
          Selecione uma base operacional no menu lateral para iniciar a coleta mensal.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '1000px', mx: 'auto', spaceY: 4, animateIn: 'fade-in' }}>
      {/* Header Período */}
      <Card sx={{ borderRadius: 8, mb: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: 'orange.50', borderRadius: 3 }}>
                <Calendar className="text-orange-600" />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 900, color: '#1f2937' }}>Período de Referência</Typography>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#9ca3af', uppercase: true }}>Seleção de competência para indicadores</Typography>
              </Box>
            </Box>
            {coletaAtiva?.status === 'FINALIZADO' && (
               <Chip 
                icon={isEditMode ? <Edit2 size={14} /> : <Lock size={14} />} 
                label={isEditMode ? "MODO EDIÇÃO (FINALIZADO)" : "MÊS FINALIZADO"} 
                color={isEditMode ? "primary" : "warning"}
                sx={{ fontWeight: 900, fontSize: '0.65rem' }} 
               />
            )}
          </Box>

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
               <FormControl fullWidth size="small">
                  <InputLabel>Mês</InputLabel>
                  <Select 
                    disabled={isViewOnly || isEditMode} 
                    value={mes} 
                    onChange={e => setMes(Number(e.target.value))} 
                    label="Mês"
                    sx={{ borderRadius: 3, fontWeight: 700 }}
                  >
                    {mesesDisponiveis.map((m, i) => <MenuItem key={m} value={i+1}>{m}</MenuItem>)}
                  </Select>
               </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
               <FormControl fullWidth size="small">
                  <InputLabel>Ano</InputLabel>
                  <Select 
                    disabled={isViewOnly || isEditMode} 
                    value={ano} 
                    onChange={e => setAno(Number(e.target.value))} 
                    label="Ano"
                    sx={{ borderRadius: 3, fontWeight: 700 }}
                  >
                    {anosDisponiveis.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
                  </Select>
               </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
               <Button 
                fullWidth 
                variant="contained" 
                color="warning" 
                onClick={handleCarregar} 
                disabled={isEditMode}
                sx={{ borderRadius: 3, py: 1.2, fontWeight: 900, boxShadow: 'none' }}
               >
                 {coletaAtiva ? 'Atualizar Visualização' : 'Iniciar Coleta'}
               </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {coletaAtiva ? (
        <Box sx={{ spaceY: 6 }}>
          {/* NOVO: Resumo de Produção Acumulado em Tempo Real */}
          <Card 
            sx={{ 
              borderRadius: 6, 
              mb: 4, 
              background: 'linear-gradient(135deg, #FF5A00 0%, #ff8e4d 100%)', 
              color: 'white',
              boxShadow: '0 8px 30px rgba(255, 90, 0, 0.2)',
              position: 'sticky',
              top: 16,
              zIndex: 10
            }}
          >
            <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 3 }}>
                  <Timer size={28} />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.9 }}>
                    Total de Horas Calculadas
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1 }}>
                    {totalHorasCalculadas}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography sx={{ fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.8 }}>
                  Base: {currentBase?.sigla}
                </Typography>
                <Typography sx={{ fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.8 }}>
                  Período: {mesesDisponiveis[mes-1]} / {ano}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {coletaAtiva.status === 'FINALIZADO' && (
            <Alert severity={isEditMode ? "info" : "warning"} sx={{ mb: 4, borderRadius: 4, border: `1px solid ${isEditMode ? '#93c5fd' : '#fed7aa'}`, bgcolor: isEditMode ? '#f0f9ff' : '#fffcf9' }}>
               <Typography variant="body2" sx={{ fontWeight: 800 }}>
                 {isEditMode 
                   ? "MODO EDIÇÃO ATIVO: Você pode alterar os valores e salvar novamente para atualizar o histórico."
                   : `DADOS BLOQUEADOS: Esta coleta foi finalizada em ${new Date(coletaAtiva.dataFinalizacao!).toLocaleString('pt-BR')}.`
                 }
                 {!isEditMode && (
                   <>
                    <br />
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>Para correções, utilize o botão Editar no Histórico de Relatórios.</Typography>
                   </>
                 )}
               </Typography>
            </Alert>
          )}

          {categories.map(cat => (
            <Box key={cat.id} sx={{ mb: 6 }}>
               <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 900, mb: 2, px: 2, 
                  display: 'flex', alignItems: 'center', gap: 1.5, 
                  color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' 
                }}
               >
                 <ChevronRight size={20} className="text-orange-500" />
                 {cat.nome}
               </Typography>
               <Grid container spacing={3}>
                  {tasks.filter(t => t.categoriaId === cat.id).map(task => (
                    <Grid item xs={12} md={6} key={task.id}>
                       <Card sx={{ borderRadius: 6, border: '1px solid #f3f4f6', boxShadow: 'none', transition: 'all 0.2s', '&:hover': { border: '1px solid #FF5A00', transform: 'translateY(-2px)' } }}>
                          <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                             <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: '#111827' }}>{task.nome}</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  {task.tipoMedida === MeasureType.TEMPO ? (
                                    <Chip label="Tempo" size="small" icon={<Clock size={12}/>} sx={{ height: 20, fontSize: '0.65rem', fontWeight: 900 }} />
                                  ) : (
                                    <Chip label="Qtde" size="small" icon={<Hash size={12}/>} sx={{ height: 20, fontSize: '0.65rem', fontWeight: 900 }} />
                                  )}
                                  {task.tipoMedida === MeasureType.QTD && (
                                    <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 700, fontStyle: 'italic' }}>
                                      Fator: {minutesToHhmmss(task.fatorMultiplicador)}
                                    </Typography>
                                  )}
                                </Box>
                             </Box>
                             
                             <Box sx={{ minWidth: 140 }}>
                               {task.tipoMedida === MeasureType.TEMPO ? (
                                  <TimeInput 
                                    disabled={isViewOnly}
                                    value={valores[task.id] || ''} 
                                    onChange={v => handleValueChange(task.id, v)}
                                    className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-orange-500 rounded-xl font-black text-orange-600 text-lg"
                                  />
                               ) : (
                                  <TextField 
                                    disabled={isViewOnly}
                                    fullWidth
                                    type="number"
                                    size="small"
                                    placeholder="0"
                                    value={valores[task.id] || ''}
                                    onChange={e => handleValueChange(task.id, e.target.value)}
                                    slotProps={{
                                      input: {
                                        sx: { borderRadius: 3, bgcolor: '#f9fafb', fontWeight: 900, textAlign: 'center' }
                                      }
                                    }}
                                  />
                               )}
                             </Box>
                          </CardContent>
                       </Card>
                    </Grid>
                  ))}
               </Grid>
            </Box>
          ))}

          {tasks.length === 0 && (
             <Box sx={{ p: 10, textAlign: 'center', color: '#d1d5db' }}>
                <Activity size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                <Typography sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Nenhuma tarefa mensal configurada para esta base</Typography>
             </Box>
          )}

          {/* Ações Inferiores */}
          <Divider sx={{ my: 4 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 10 }}>
             <Button 
              variant="outlined" 
              onClick={() => navigate('/reports')} 
              startIcon={<ArrowLeft />}
              sx={{ borderRadius: 4, fontWeight: 900, px: 4 }}
             >
               {isEditMode ? 'Cancelar e Voltar' : 'Voltar aos Relatórios'}
             </Button>

             <Box sx={{ display: 'flex', gap: 2 }}>
               {!isViewOnly && (
                 <>
                   <Button 
                    variant="contained" 
                    sx={{ borderRadius: 4, fontWeight: 900, px: 4, bgcolor: '#4b5563', '&:hover': { bgcolor: '#374151' } }}
                    startIcon={<Save />}
                    onClick={() => handleAction(false)}
                   >
                     {isEditMode ? 'Salvar Alterações' : 'Salvar Rascunho'}
                   </Button>
                   <Button 
                    variant="contained" 
                    color="success"
                    sx={{ borderRadius: 4, fontWeight: 900, px: 4, boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}
                    startIcon={<CheckCircle />}
                    onClick={() => handleAction(true)}
                   >
                     {isEditMode ? 'Finalizar e Re-Salvar' : 'Finalizar Coleta Mensal'}
                   </Button>
                 </>
               )}
             </Box>
          </Box>
        </Box>
      ) : (
        <Box sx={{ p: 12, textAlign: 'center', bgcolor: 'white', borderRadius: 8, border: '2px dashed #e5e7eb' }}>
           <Info size={48} className="mx-auto mb-4 text-gray-200" />
           <Typography sx={{ fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase' }}>
             Selecione o período acima e clique em "Iniciar Coleta" para preencher os indicadores do mês.
           </Typography>
        </Box>
      )}
    </Box>
  );
};

export default MonthlyCollectionPage;
