
import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Typography, Alert,
  CircularProgress, Container, InputAdornment, IconButton, List, ListItem, ListItemIcon, ListItemText
} from '@mui/material';
import { Plane, Lock, Eye, EyeOff, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  // Regras de validação
  const validacoes = {
    tamanho: novaSenha.length >= 8,
    numero: /[0-9]/.test(novaSenha),
    maiuscula: /[A-Z]/.test(novaSenha),
    especial: /[!@#$%^&*(),.?":{}|<>]/.test(novaSenha),
    match: novaSenha === confirmarSenha && novaSenha !== ''
  };

  const formValido = Object.values(validacoes).every(v => v === true);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValido) return;

    setCarregando(true);
    setErro('');

    try {
      const result = await authService.redefinirSenha(novaSenha);

      if (result.success) {
        setSucesso(true);
        setTimeout(() => {
          navigate('/login', { state: { message: 'Senha atualizada! Faça login com sua nova senha.' } });
        }, 3000);
      } else {
        setErro(result.message || 'Não foi possível atualizar a senha. O link pode ter expirado.');
      }
    } catch (err) {
      setErro('Erro de conexão com o servidor.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #FF5A00 0%, #ff8e4d 100%)', p: 2
    }}>
      <Container maxWidth="xs">
        <Card sx={{ borderRadius: 8, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
          <CardContent sx={{ p: 5 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
              <Box sx={{ 
                bgcolor: '#FF5A00', borderRadius: 4, display: 'flex', alignItems: 'center', 
                justifyContent: 'center', color: 'white', mb: 2, width: 64, height: 64,
                boxShadow: '0 10px 20px rgba(255, 90, 0, 0.3)'
              }}>
                <ShieldCheck size={32} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 950, color: '#1f2937', textAlign: 'center' }}>
                Definir Nova Senha
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', mt: 1 }}>
                Crie uma senha segura para o ShiftFlow
              </Typography>
            </Box>

            {erro && <Alert severity="error" sx={{ mb: 3, borderRadius: 3, fontWeight: 700 }}>{erro}</Alert>}
            {sucesso && <Alert severity="success" sx={{ mb: 3, borderRadius: 3, fontWeight: 700 }}>Senha alterada! Redirecionando...</Alert>}

            {!sucesso && (
              <form onSubmit={handleReset}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <TextField
                    fullWidth label="Nova Senha" type={mostrarSenha ? 'text' : 'password'}
                    variant="outlined" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)}
                    disabled={carregando}
                    slotProps={{
                      input: {
                        sx: { borderRadius: 4 },
                        startAdornment: <InputAdornment position="start"><Lock size={18} className="text-gray-400" /></InputAdornment>,
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setMostrarSenha(!mostrarSenha)} edge="end">
                              {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                            </IconButton>
                          </InputAdornment>
                        )
                      }
                    }}
                  />

                  <TextField
                    fullWidth label="Confirmar Senha" type={mostrarSenha ? 'text' : 'password'}
                    variant="outlined" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)}
                    disabled={carregando}
                    slotProps={{ input: { sx: { borderRadius: 4 } } }}
                  />

                  <Box sx={{ bgcolor: '#f9fafb', p: 2, borderRadius: 4, mb: 1 }}>
                    <Typography sx={{ fontSize: '10px', fontWeight: 900, color: '#9ca3af', mb: 1, textTransform: 'uppercase' }}>
                      Requisitos de Segurança:
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <ValidationItem label="Mínimo 8 caracteres" valid={validacoes.tamanho} />
                      <ValidationItem label="Pelo menos um número" valid={validacoes.numero} />
                      <ValidationItem label="Uma letra maiúscula" valid={validacoes.maiuscula} />
                      <ValidationItem label="Um caractere especial" valid={validacoes.especial} />
                      <ValidationItem label="As senhas coincidem" valid={validacoes.match} />
                    </Box>
                  </Box>

                  <Button
                    fullWidth size="large" type="submit" variant="contained"
                    disabled={carregando || !formValido}
                    sx={{ 
                      py: 2, borderRadius: 4, fontWeight: 900, bgcolor: '#FF5A00',
                      '&:hover': { bgcolor: '#e65100' }, boxShadow: '0 8px 16px rgba(255, 90, 0, 0.2)'
                    }}
                    startIcon={carregando ? <CircularProgress size={20} color="inherit" /> : <ShieldCheck size={20} />}
                  >
                    Confirmar Nova Senha
                  </Button>
                </Box>
              </form>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

const ValidationItem: React.FC<{ label: string; valid: boolean }> = ({ label, valid }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    {valid ? <CheckCircle2 size={12} className="text-green-500" /> : <XCircle size={12} className="text-gray-300" />}
    <Typography sx={{ fontSize: '11px', fontWeight: 700, color: valid ? '#10b981' : '#9ca3af' }}>{label}</Typography>
  </Box>
);
