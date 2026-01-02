
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Chip, TextField, Box, Typography, Container, CircularProgress, 
  IconButton, Tabs, Tab,
  FormControl, InputLabel, Select, MenuItem, Alert
} from '@mui/material';
import { 
  Edit2, LayoutList, BarChart,
  Calendar, MapPin, Search, Trash2
} from 'lucide-react';
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { PerformanceTurnoReport } from './PerformanceTurnoReport';
import { useStore } from '../hooks/useStore';
import { useAuth } from '../hooks/useAuth';
import { loadAllHandovers, deleteHandover } from '../services';

const ReportsPage: React.FC<{ baseId?: string }> = ({ baseId }) => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { bases, initialized, refreshData } = useStore();
  
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);
  
  const [filters, setFilters] = useState({
    startDate: dayjs().startOf('month').format('YYYY-MM-DD'),
    endDate: dayjs().endOf('month').format('YYYY-MM-DD'),
    baseId: baseId || 'ALL',
    status: 'ALL'
  });

  const basesAcessiveis = useMemo(() => {
    if (!user) return [];
    if (user.permissionLevel === 'ADMINISTRADOR') return bases;
    return bases.filter(b => user.bases.includes(b.id));
  }, [user, bases]);

  const loadReports = async () => {
    if (!user) return;
    setLoading(true);

    try {
      let basesToLoad: string[] = [];
      if (user.permissionLevel === 'ADMINISTRADOR') {
        basesToLoad = bases.map(b => b.id);
      } else {
        basesToLoad = user.bases;
      }

      if (filters.baseId !== 'ALL') {
        basesToLoad = basesToLoad.filter(id => id === filters.baseId);
      }

      if (basesToLoad.length === 0) {
        setReports([]);
        setLoading(false);
        return;
      }

      const rawData = await loadAllHandovers(basesToLoad, filters.startDate, filters.endDate);
      let filteredData = rawData;
      if (filters.status !== 'ALL') {
        filteredData = rawData.filter((r: any) => r.status === filters.status);
      }

      setReports(filteredData);
    } catch (error) {
      console.error("[Reports Error]", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialized && user) {
      loadReports();
    }
  }, [filters, initialized, user]);

  if (authLoading) return null;

  return (
    <Container maxWidth={false} sx={{ py: 4, animateIn: 'fade-in' }}>
      <Box sx={{ mb: 6, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 3 }}>
        <div>
          <Typography variant="h4" sx={{ fontWeight: 950, color: '#1f2937' }}>HISTÓRICO OPERACIONAL</Typography>
          <Typography variant="caption" sx={{ fontWeight: 800, color: '#ea580c', textTransform: 'uppercase' }}>Consulta Cloud Sincronizada</Typography>
        </div>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel children="UNIDADE" sx={{ fontWeight: 800, fontSize: '0.75rem' }} />
            <Select
              value={filters.baseId}
              label="UNIDADE"
              onChange={(e) => setFilters({...filters, baseId: e.target.value})}
              sx={{ borderRadius: 3, fontWeight: 900, bgcolor: 'white' }}
            >
              <MenuItem value="ALL"><em>Minhas Unidades</em></MenuItem>
              {basesAcessiveis.map(b => (
                <MenuItem key={b.id} value={b.id}>{b.sigla}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField type="date" size="small" label="Início" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} InputLabelProps={{ shrink: true }} sx={{ bgcolor: 'white' }} />
          <TextField type="date" size="small" label="Fim" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} InputLabelProps={{ shrink: true }} sx={{ bgcolor: 'white' }} />
          
          <IconButton onClick={loadReports} sx={{ bgcolor: '#fff', border: '1px solid #e5e7eb', borderRadius: 3 }}>
            {loading ? <CircularProgress size={18} color="inherit" /> : <Search size={18} />}
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab icon={<LayoutList size={16} />} iconPosition="start" label="Detalhamento Diário" sx={{ fontWeight: 900 }} />
          <Tab icon={<BarChart size={16} />} iconPosition="start" label="Performance Turnos" sx={{ fontWeight: 900 }} />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <TableContainer component={Paper} sx={{ borderRadius: 4, border: '1px solid #f3f4f6', boxShadow: 'none' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f9fafb' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 950 }}>DATA</TableCell>
                <TableCell sx={{ fontWeight: 950 }}>TURNO</TableCell>
                <TableCell sx={{ fontWeight: 950 }}>BASE</TableCell>
                <TableCell align="right" sx={{ fontWeight: 950 }}>H. DISP.</TableCell>
                <TableCell align="right" sx={{ fontWeight: 950 }}>H. PROD.</TableCell>
                <TableCell align="right" sx={{ fontWeight: 950 }}>PERF.</TableCell>
                <TableCell align="right" sx={{ fontWeight: 950 }}>AÇÕES</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ fontWeight: 800 }}>{row.data}</TableCell>
                  <TableCell>T{row.turnoId}</TableCell>
                  <TableCell>{bases.find(b => b.id === row.baseId)?.sigla || row.baseId}</TableCell>
                  <TableCell align="right">{row.horasDisponivel}</TableCell>
                  <TableCell align="right">{row.horasProduzida}</TableCell>
                  <TableCell align="right">
                    <Chip label={`${row.performance?.toFixed(1) || 0}%`} size="small" color={row.performance >= 80 ? "success" : "warning"} sx={{ fontWeight: 900 }} />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="primary" onClick={() => navigate(`/shift-handover?editId=${row.id}&baseId=${row.baseId}`)}>
                      <Edit2 size={16} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {reports.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, fontWeight: 800, color: 'gray' }}>Nenhum registro encontrado.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {activeTab === 1 && <PerformanceTurnoReport baseId={filters.baseId === 'ALL' ? undefined : filters.baseId} />}
    </Container>
  );
};

export default ReportsPage;
