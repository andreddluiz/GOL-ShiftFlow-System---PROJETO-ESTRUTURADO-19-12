
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, Typography, Button, Container, Paper, Chip } from '@mui/material';
import { authService } from '../services/authService';
import { accessControlService } from '../services/accessControlService';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';

interface RotaProtegidaProps {
  children: React.ReactNode;
}

export const RotaProtegida: React.FC<RotaProtegidaProps> = ({ children }) => {
  const usuario = authService.obterUsuarioAutenticado();
  const location = useLocation();

  const handleLogout = () => {
    authService.fazerLogout();
    window.location.reload();
  };

  if (!usuario) {
    console.warn(`[RotaProtegida] Usuário não autenticado, redirecionando para login`);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar permissão de página por perfil global (calculado no login como o maior nível)
  const temAcessoFuncionalidade = accessControlService.podeAcessarPagina(usuario.perfil, location.pathname);

  if (!temAcessoFuncionalidade) {
    console.warn(`[RotaProtegida] Usuário ${usuario.email} não tem permissão para: ${location.pathname}`);
    return (
      <Container maxWidth="sm" sx={{ mt: 10 }}>
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 6, border: '1px solid #f3f4f6' }}>
          <ShieldAlert size={64} className="text-red-500 mx-auto mb-4" />
          <Typography variant="h5" sx={{ fontWeight: 900, mb: 2 }}>Acesso Negado</Typography>
          <Typography variant="body1" sx={{ color: '#6b7280', mb: 2 }}>
            Seu perfil de <strong>{usuario.perfil}</strong> não tem permissão para esta funcionalidade.
          </Typography>
          
          <Box sx={{ mb: 4 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', display: 'block', mb: 1 }}>
              Suas permissões por base:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
              {usuario.basesAssociadas.map(ba => (
                <Chip 
                  key={ba.baseId} 
                  label={`${ba.baseId.toUpperCase()}: ${ba.nivelAcesso}`} 
                  size="small" 
                  variant="outlined"
                  sx={{ fontWeight: 700, fontSize: '0.65rem' }}
                />
              ))}
            </Box>
          </Box>

          <Button 
            variant="contained" 
            color="warning"
            startIcon={<ArrowLeft size={18} />}
            onClick={() => window.location.href = '#/dashboard'}
            sx={{ borderRadius: 3, fontWeight: 900 }}
          >
            Voltar ao Dashboard
          </Button>
        </Paper>
      </Container>
    );
  }

  // Validar bases acessíveis para perfis não-admin
  const basesAtivas = usuario.basesAssociadas.filter(b => b.ativo);
  if (basesAtivas.length === 0 && usuario.perfil !== 'ADMINISTRADOR') {
    console.warn(`[RotaProtegida] Usuário ${usuario.email} não tem acesso a nenhuma base`);
    return (
      <Container maxWidth="sm" sx={{ mt: 10 }}>
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 6, border: '1px solid #f3f4f6' }}>
          <ShieldAlert size={64} className="text-red-500 mx-auto mb-4" />
          <Typography variant="h5" sx={{ fontWeight: 900, mb: 2 }}>Sem Acesso a Bases</Typography>
          <Typography variant="body1" sx={{ color: '#6b7280', mb: 4 }}>
            Você não está associado a nenhuma base operacional ativa. 
            Contate o administrador do sistema para liberar seu acesso.
          </Typography>
          
          <Button 
            variant="contained" 
            color="error"
            startIcon={<LogOut size={18} />}
            onClick={handleLogout}
            sx={{ borderRadius: 3, fontWeight: 900 }}
          >
            Fazer Logout
          </Button>
        </Paper>
      </Container>
    );
  }

  return <>{children}</>;
};
