
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Plane, Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { authService } from '../services/authService';

interface LoginPageProps {
  onLoginSuccess: (usuario: any) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !senha) return;

    setCarregando(true);
    setErro('');

    try {
      const usuario = await authService.fazerLogin({ email, senha });

      if (usuario) {
        onLoginSuccess(usuario);
      } else {
        setErro('Credenciais inválidas ou conta inativa no Supabase.');
      }
    } catch (err) {
      setErro('Ocorreu um erro ao tentar conectar com o servidor.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #FF5A00 0%, #ff8e4d 100%)',
      p: 2
    }}>
      <Container maxWidth="xs">
        <Card sx={{ 
          borderRadius: 8, 
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          overflow: 'visible'
        }}>
          <CardContent sx={{ p: 5 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
              <Box sx={{ 
                bgcolor: '#FF5A00', 
                borderRadius: 4, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'white',
                mb: 2,
                boxShadow: '0 10px 20px rgba(255, 90, 0, 0.3)',
                width: 64, height: 64
              }}>
                <Plane size={32} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 950, color: '#1f2937', tracking: '-0.02em' }}>
                ShiftFlow
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                GOL Operações Logísticas
              </Typography>
            </Box>

            {erro && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 3, fontWeight: 700 }}>
                {erro}
              </Alert>
            )}

            <form onSubmit={handleLogin}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField
                  fullWidth
                  label="E-mail"
                  variant="outlined"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={carregando}
                  slotProps={{
                    input: {
                      sx: { borderRadius: 4 },
                      startAdornment: (
                        <InputAdornment position="start">
                          <Mail size={18} className="text-gray-400" />
                        </InputAdornment>
                      ),
                    }
                  }}
                />

                <TextField
                  fullWidth
                  label="Senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  variant="outlined"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  disabled={carregando}
                  slotProps={{
                    input: {
                      sx: { borderRadius: 4 },
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock size={18} className="text-gray-400" />
                        </InputAdornment>
                      ),
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

                <Button
                  fullWidth
                  size="large"
                  type="submit"
                  variant="contained"
                  disabled={carregando || !email || !senha}
                  sx={{ 
                    mt: 2, 
                    py: 2, 
                    borderRadius: 4, 
                    fontWeight: 900, 
                    textTransform: 'uppercase',
                    bgcolor: '#FF5A00',
                    '&:hover': { bgcolor: '#e65100' },
                    boxShadow: '0 8px 16px rgba(255, 90, 0, 0.2)'
                  }}
                  startIcon={carregando ? <CircularProgress size={20} color="inherit" /> : <LogIn size={20} />}
                >
                  {carregando ? 'Acessando...' : 'Entrar na Plataforma'}
                </Button>
              </Box>
            </form>

            <Box sx={{ mt: 5, p: 2, bgcolor: '#f9fafb', borderRadius: 4, textAlign: 'center' }}>
               <Typography variant="caption" sx={{ fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', display: 'block', mb: 1 }}>
                 Integração Supabase Cloud Ativa
               </Typography>
               <Typography variant="caption" sx={{ fontWeight: 700, color: '#4b5563', display: 'block' }}>
                 Utilize credenciais cadastradas no seu projeto Supabase.
               </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};
