
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel,
  Select, MenuItem, Alert, Chip, Paper, Grid, Card
} from '@mui/material';
import { UserCog, ChevronRight } from 'lucide-react';
import { authService } from '../services/authService';
import { Usuario } from '../types';
import { nivelAcessoService, NivelAcesso } from '../services/nivelAcessoService';
import { dataIsolationService } from '../services/dataIsolationService';

export const GerenciamentoUsuariosPage: React.FC<{ usuarioAutenticado: any }> = ({ usuarioAutenticado }) => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [bases, setBases] = useState<any[]>([]);
  const [baseAtual, setBaseAtual] = useState<string>('');
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null);
  const [novoNivel, setNovoNivel] = useState<NivelAcesso>('OPERACIONAL');
  const [dialogAberto, setDialogAberto] = useState(false);
  const [niveisDisponiveis, setNiveisDisponiveis] = useState<NivelAcesso[]>([]);

  useEffect(() => {
    /**
     * Fix for line 24: Expected 0 arguments, but got 1.
     * Also handled the async nature of listarUsuarios.
     */
    authService.listarUsuarios().then(setUsuarios);
    const basesCarregadas = dataIsolationService.obterDadosIsolados('ADMIN', 'bases') || [];
    setBases(basesCarregadas);
    if (basesCarregadas.length > 0) setBaseAtual(basesCarregadas[0].id);
  }, [usuarioAutenticado.perfil]);

  useEffect(() => {
    if (baseAtual) {
      const currentU = usuarios.find(u => u.id === usuarioAutenticado.id);
      if (currentU) {
        setNiveisDisponiveis(nivelAcessoService.obterNiveisDisponiveis(currentU, baseAtual));
      }
    }
  }, [baseAtual, usuarioAutenticado, usuarios]);

  const handleAbrirDialogo = (usuario: Usuario) => {
    const currentU = usuarios.find(u => u.id === usuarioAutenticado.id);
    if (!currentU || !nivelAcessoService.podeGerenciarUsuario(currentU, usuario, baseAtual)) {
      alert('Você não tem permissão para gerenciar este usuário nesta base');
      return;
    }
    setUsuarioSelecionado(usuario);
    setNovoNivel(nivelAcessoService.obterNivelAcessoEmBase(usuario, baseAtual) || 'OPERACIONAL');
    setDialogAberto(true);
  };

  /**
   * Fix for line 54: Expected 1 arguments, but got 2.
   * Also handled the async nature of atualizarUsuario.
   */
  const handleSalvarNivel = async () => {
    if (!usuarioSelecionado) return;
    const atualizado = nivelAcessoService.atualizarNivelAcesso(usuarioSelecionado, baseAtual, novoNivel);
    await authService.atualizarUsuario(atualizado);
    setUsuarios(usuarios.map(u => u.id === atualizado.id ? atualizado : u));
    setDialogAberto(false);
  };

  const obterCorNivel = (nivel: string) => {
    const cores: Record<string, string> = {
      OPERACIONAL: '#ff9800',
      ANALISTA: '#2196f3',
      LÍDER: '#4caf50',
      ADMINISTRADOR: '#f44336',
    };
    return cores[nivel] || '#9e9e9e';
  };

  const usuariosDaBase = usuarios.filter(u => u.basesAssociadas.some(b => b.baseId === baseAtual));

  return (
    <Box sx={{ p: 4, animateIn: 'fade-in' }}>
      <header className="flex items-center space-x-4 mb-8">
        <div className="p-4 bg-orange-50 rounded-2xl text-orange-600"><UserCog size={32}/></div>
        <div>
          <Typography variant="h4" sx={{ fontWeight: 950 }}>Gestão de Acessos</Typography>
          <Typography variant="caption" sx={{ fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase' }}>Gerenciamento Dinâmico por Unidade</Typography>
        </div>
      </header>

      {usuarioAutenticado.perfil === 'ADMINISTRADOR' && (
        <Alert severity="info" sx={{ mb: 3, borderRadius: 4 }}>
          ℹ️ ADMINISTRADOR: Gestão total de bases e níveis de acesso.
        </Alert>
      )}

      {usuarioAutenticado.perfil === 'LÍDER' && (
        <Alert severity="info" sx={{ mb: 3, borderRadius: 4 }}>
          ℹ️ LÍDER: Gestão apenas de OPERACIONAL e ANALISTA em suas bases.
        </Alert>
      )}

      <Grid container spacing={4}>
        <Grid item xs={12} md={3}>
           <Card sx={{ p: 3, borderRadius: 6, border: '1px solid #f3f4f6', boxShadow: 'none' }}>
              <Typography sx={{ fontWeight: 900, fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', mb: 2 }}>Unidade Operacional</Typography>
              <FormControl fullWidth size="small">
                <Select value={baseAtual} onChange={e => setBaseAtual(e.target.value)} sx={{ borderRadius: 3, fontWeight: 800 }}>
                  {bases.map(b => <MenuItem key={b.id} value={b.id}>{b.sigla} - {b.nome}</MenuItem>)}
                </Select>
              </FormControl>
              <Box sx={{ mt: 4, spaceY: 3 }}>
                 <HierarquiaItem nivel="ADMINISTRADOR" cor="#f44336" />
                 <HierarquiaItem nivel="LÍDER" cor="#4caf50" />
                 <HierarquiaItem nivel="ANALISTA" cor="#2196f3" />
                 <HierarquiaItem nivel="OPERACIONAL" cor="#ff9800" />
              </Box>
           </Card>
        </Grid>

        <Grid item xs={12} md={9}>
          <TableContainer component={Paper} sx={{ borderRadius: 6, border: '1px solid #f3f4f6', boxShadow: 'none' }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f9fafb' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 950, fontSize: '0.7rem' }}>COLABORADOR</TableCell>
                  <TableCell sx={{ fontWeight: 950, fontSize: '0.7rem' }}>NÍVEL EM {baseAtual.toUpperCase()}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 950, fontSize: '0.7rem' }}>AÇÕES</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {usuariosDaBase.map(u => {
                  const nivel = nivelAcessoService.obterNivelAcessoEmBase(u, baseAtual);
                  const currentU = usuarios.find(curr => curr.id === usuarioAutenticado.id);
                  const podeGerenciar = currentU ? nivelAcessoService.podeGerenciarUsuario(currentU, u, baseAtual) : false;
                  
                  return (
                    <TableRow key={u.id} hover>
                      <TableCell>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.9rem' }}>{u.nome}</Typography>
                        <Typography sx={{ color: '#9ca3af', fontSize: '0.7rem', fontWeight: 600 }}>{u.email}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={nivel || 'N/A'} 
                          size="small" 
                          sx={{ fontWeight: 900, fontSize: '0.6rem', color: 'white', bgcolor: obterCorNivel(nivel || '') }} 
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button 
                          variant="outlined" 
                          size="small" 
                          onClick={() => handleAbrirDialogo(u)} 
                          disabled={!podeGerenciar}
                          sx={{ fontWeight: 900, fontSize: '0.65rem', borderRadius: 2 }}
                        >
                          Definir Nível
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      <Dialog open={dialogAberto} onClose={() => setDialogAberto(false)} PaperProps={{ sx: { borderRadius: 6, p: 2 } }}>
        <DialogTitle sx={{ fontWeight: 950 }}>Alterar Nível - {usuarioSelecionado?.nome}</DialogTitle>
        <DialogContent>
           <Typography variant="body2" sx={{ color: '#6b7280', mb: 3 }}>Selecione o acesso na base <strong>{baseAtual.toUpperCase()}</strong>:</Typography>
           <FormControl fullWidth>
              <Select value={novoNivel} onChange={e => setNovoNivel(e.target.value as NivelAcesso)} sx={{ borderRadius: 3, fontWeight: 800 }}>
                 {niveisDisponiveis.map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
              </Select>
           </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
           <Button onClick={() => setDialogAberto(false)} sx={{ fontWeight: 900 }}>Cancelar</Button>
           <Button onClick={handleSalvarNivel} variant="contained" color="warning" sx={{ fontWeight: 900, borderRadius: 2 }}>Salvar Acesso</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const HierarquiaItem: React.FC<{ nivel: string, cor: string }> = ({ nivel, cor }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: cor, marginRight: 8 }} />
    <Typography sx={{ fontWeight: 800, fontSize: '0.65rem', color: '#4b5563' }}>{nivel}</Typography>
  </Box>
);
