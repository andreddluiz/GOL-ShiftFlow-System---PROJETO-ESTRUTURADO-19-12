
import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, Switch, FormControlLabel, 
  Alert, Chip, Grid, Paper, IconButton, Divider
} from '@mui/material';
import { ShieldCheck, Plus, Trash2, ChevronRight, Lock, Save, Copy } from 'lucide-react';
import { permissaoCustomizavelService } from '../services/permissaoCustomizavelService';
import { NivelAcessoCustomizado, PermissaoItem } from '../types';

interface Props {
  usuarioAutenticado: any;
}

export const GerenciamentoPermissoesPage: React.FC<Props> = ({ usuarioAutenticado }) => {
  const [niveis, setNiveis] = useState<NivelAcessoCustomizado[]>([]);
  const [nivelSelecionado, setNivelSelecionado] = useState<NivelAcessoCustomizado | null>(null);
  const [dialogNovoAberto, setDialogNovoAberto] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoDesc, setNovoDesc] = useState('');
  const [duplicarId, setDuplicarId] = useState('');

  const carregarNiveis = () => {
    const data = permissaoCustomizavelService.listarNiveis();
    setNiveis(data);
    if (data.length > 0 && !nivelSelecionado) setNivelSelecionado(data[0]);
  };

  useEffect(() => {
    carregarNiveis();
  }, []);

  const handleCriar = () => {
    if (!novoNome) return;
    const novoId = `CUSTOM_${Date.now()}`;
    
    if (duplicarId) {
      permissaoCustomizavelService.duplicarNivel(duplicarId, novoId, novoNome);
    } else {
      const novoNivel: NivelAcessoCustomizado = {
        id: novoId,
        nome: novoNome,
        descricao: novoDesc,
        tipo: 'CUSTOMIZADO',
        ativo: true,
        dataCriacao: new Date().toISOString(),
        dataAtualizacao: new Date().toISOString(),
        permissoes: {}
      };
      permissaoCustomizavelService.salvarNivel(novoNivel);
    }
    
    carregarNiveis();
    setDialogNovoAberto(false);
    setNovoNome(''); setNovoDesc(''); setDuplicarId('');
  };

  const handleDeletar = (id: string) => {
    if (window.confirm('Excluir permanentemente este nível de acesso?')) {
      permissaoCustomizavelService.deletarNivel(id);
      carregarNiveis();
      setNivelSelecionado(niveis[0]);
    }
  };

  const handleTogglePermissao = (permId: string, value: boolean) => {
    if (!nivelSelecionado || nivelSelecionado.tipo === 'PADRÃO') return;
    
    const atualizado = {
      ...nivelSelecionado,
      permissoes: { ...nivelSelecionado.permissoes, [permId]: value }
    };
    
    permissaoCustomizavelService.salvarNivel(atualizado);
    setNivelSelecionado(atualizado);
    setNiveis(niveis.map(n => n.id === atualizado.id ? atualizado : n));
  };

  const agrupadas = permissaoCustomizavelService.obterPermissoesPorCategoria();

  return (
    <Box sx={{ p: 4 }}>
      <header className="flex items-center space-x-4 mb-8">
        <div className="p-4 bg-orange-50 rounded-2xl text-orange-600"><ShieldCheck size={32}/></div>
        <div>
          <Typography variant="h4" sx={{ fontWeight: 950 }}>Níveis e Permissões</Typography>
          <Typography variant="caption" sx={{ fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase' }}>Configuração dinâmica de perfis de acesso</Typography>
        </div>
      </header>

      <Grid spacing={4}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 6, border: '1px solid #f3f4f6', boxShadow: 'none' }}>
            <CardContent sx={{ p: 3 }}>
              <Button 
                fullWidth 
                variant="contained" 
                color="warning" 
                startIcon={<Plus size={18}/>} 
                onClick={() => setDialogNovoAberto(true)} 
                sx={{ borderRadius: 3, fontWeight: 900, mb: 3 }}
              >
                Novo Perfil
              </Button>
              
              <Typography sx={{ fontWeight: 950, fontSize: '0.65rem', color: '#9ca3af', textTransform: 'uppercase', mb: 2, px: 1 }}>Lista de Perfis</Typography>
              
              <Box className="space-y-2">
                {niveis.map(n => (
                  <Paper 
                    key={n.id} 
                    onClick={() => setNivelSelecionado(n)}
                    sx={{ 
                      p: 2, cursor: 'pointer', borderRadius: 4, border: '2px solid',
                      borderColor: nivelSelecionado?.id === n.id ? '#FF5A00' : 'transparent',
                      bgcolor: nivelSelecionado?.id === n.id ? '#fff7ed' : '#fff',
                      transition: 'all 0.2s', boxShadow: 'none',
                      '&:hover': { bgcolor: '#fffcf9' }
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <Typography sx={{ fontWeight: 900, fontSize: '0.85rem' }}>{n.nome}</Typography>
                        <Chip label={n.tipo} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 900, mt: 0.5, bgcolor: n.tipo === 'PADRÃO' ? '#f3f4f6' : '#e0f2fe' }} />
                      </div>
                      {n.tipo === 'CUSTOMIZADO' && (
                        <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDeletar(n.id); }}>
                          <Trash2 size={14}/>
                        </IconButton>
                      )}
                    </div>
                  </Paper>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          {nivelSelecionado && (
            <Card sx={{ borderRadius: 6, border: '1px solid #f3f4f6', boxShadow: 'none' }}>
              <CardContent sx={{ p: 4 }}>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <Typography variant="h6" sx={{ fontWeight: 950 }}>{nivelSelecionado.nome}</Typography>
                    <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 600 }}>{nivelSelecionado.descricao}</Typography>
                  </div>
                  {nivelSelecionado.tipo === 'PADRÃO' && (
                    <Chip icon={<Lock size={14}/>} label="Perfil Protegido" size="small" sx={{ fontWeight: 900, bgcolor: '#fef3c7', color: '#92400e' }} />
                  )}
                </div>

                {nivelSelecionado.tipo === 'PADRÃO' && (
                  <Alert severity="warning" sx={{ mb: 4, borderRadius: 3, fontWeight: 700 }}>
                    Perfis do sistema não podem ser alterados. Para customizar, crie um novo perfil duplicando este.
                  </Alert>
                )}

                <Box className="space-y-6">
                  {Object.entries(agrupadas).map(([cat, perms]) => (
                    <Box key={cat}>
                      <Typography sx={{ fontWeight: 950, fontSize: '0.7rem', color: '#ea580c', textTransform: 'uppercase', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ChevronRight size={14}/> {cat}
                      </Typography>
                      <Grid spacing={2}>
                        {perms.map(p => (
                          <Grid size={{ xs: 12, sm: 6 }} key={p.id}>
                            <Paper sx={{ p: 2.5, borderRadius: 4, border: '1px solid #f3f4f6', boxShadow: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Box>
                                <Typography sx={{ fontWeight: 800, fontSize: '0.8rem' }}>{p.nome}</Typography>
                                <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 600 }}>{p.descricao}</Typography>
                              </Box>
                              <Switch 
                                color="warning"
                                checked={!!nivelSelecionado.permissoes[p.id]} 
                                onChange={e => handleTogglePermissao(p.id, e.target.checked)}
                                disabled={nivelSelecionado.tipo === 'PADRÃO'}
                              />
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      <Dialog open={dialogNovoAberto} onClose={() => setDialogNovoAberto(false)} PaperProps={{ sx: { borderRadius: 6, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 950 }}>Criar Novo Perfil de Acesso</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Nome do Perfil" margin="normal" value={novoNome} onChange={e => setNovoNome(e.target.value)} placeholder="Ex: Supervisor Operacional" sx={{ mt: 1 }} />
          <TextField fullWidth label="Descrição" margin="normal" value={novoDesc} onChange={e => setNovoDesc(e.target.value)} multiline rows={2} />
          
          <Typography sx={{ fontWeight: 900, fontSize: '0.65rem', color: '#9ca3af', textTransform: 'uppercase', mt: 3, mb: 1 }}>Duplicar de</Typography>
          <TextField select fullWidth value={duplicarId} onChange={e => setDuplicarId(e.target.value)} SelectProps={{ native: true }}>
            <option value="">Nível Vazio</option>
            {niveis.map(n => <option key={n.id} value={n.id}>{n.nome} ({n.tipo})</option>)}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDialogNovoAberto(false)} sx={{ fontWeight: 900 }}>Cancelar</Button>
          <Button variant="contained" color="warning" onClick={handleCriar} sx={{ fontWeight: 900, borderRadius: 3, px: 4 }}>Criar Perfil</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
