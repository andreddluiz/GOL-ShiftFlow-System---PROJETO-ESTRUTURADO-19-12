
import { supabase } from '../supabaseClient';
import { Usuario, UsuarioAutenticado, UsuarioBase } from '../types';

export interface CredenciaisLogin {
  email: string;
  senha: string;
}

class AuthService {
  private chaveUsuarioAutenticado = 'gol_usuario_autenticado';

  async fazerLogin(credenciais: CredenciaisLogin): Promise<UsuarioAutenticado | null> {
    console.log(`[Auth] Tentativa de login para: ${credenciais.email}`);
    
    try {
      localStorage.removeItem(this.chaveUsuarioAutenticado);

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credenciais.email,
        password: credenciais.senha,
      });

      if (authError || !authData.user) {
        console.error('[Auth] Erro no login Supabase Auth:', authError?.message);
        return null;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile) {
        if (credenciais.email.toLowerCase() === 'admin@gol.com') {
           return this.gerarSessaoMockAdmin(authData.user);
        }
        return null;
      }

      if (!profile.ativo) return null;

      const perfilNormalizado = String(profile.perfil || 'OPERACIONAL').toUpperCase();

      const usuarioAutenticado: UsuarioAutenticado = {
        id: profile.id,
        email: profile.email,
        nome: profile.nome,
        perfil: perfilNormalizado,
        basesAssociadas: profile.bases_associadas || [],
        baseAtual: profile.bases_associadas?.[0]?.baseId || '',
      };

      localStorage.setItem(this.chaveUsuarioAutenticado, JSON.stringify(usuarioAutenticado));
      return usuarioAutenticado;
    } catch (error) {
      return null;
    }
  }

  /**
   * Atualiza a senha do usuário atualmente autenticado (usado no fluxo de reset)
   */
  async redefinirSenha(novaSenha: string): Promise<{ success: boolean; message: string }> {
    console.log('[Auth] Solicitando atualização de senha ao Supabase...');
    try {
      const { error } = await supabase.auth.updateUser({
        password: novaSenha
      });

      if (error) {
        console.error('[Auth] Erro ao atualizar senha:', error.message);
        return { success: false, message: error.message };
      }

      console.log('[Auth] Senha atualizada com sucesso!');
      // Desloga após reset para forçar novo login com a senha definitiva
      await supabase.auth.signOut();
      localStorage.removeItem(this.chaveUsuarioAutenticado);
      
      return { success: true, message: 'Senha redefinida com sucesso!' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Erro inesperado.' };
    }
  }

  private gerarSessaoMockAdmin(user: any): UsuarioAutenticado {
    const adminSessao: UsuarioAutenticado = {
      id: user.id, email: user.email, nome: 'Administrador Mestre', perfil: 'ADMINISTRADOR',
      basesAssociadas: [{ baseId: 'poa', nivelAcesso: 'ADMINISTRADOR', ativo: true, dataCriacao: '', dataAtualizacao: '' }],
      baseAtual: 'poa'
    };
    localStorage.setItem(this.chaveUsuarioAutenticado, JSON.stringify(adminSessao));
    return adminSessao;
  }

  fazerLogout(): void {
    supabase.auth.signOut();
    localStorage.removeItem(this.chaveUsuarioAutenticado);
  }

  obterUsuarioAutenticado(): UsuarioAutenticado | null {
    try {
      const u = localStorage.getItem(this.chaveUsuarioAutenticado);
      if (!u) return null;
      return JSON.parse(u);
    } catch { return null; }
  }

  async listarUsuarios(perfilCriador: string): Promise<Usuario[]> {
    const { data, error } = await supabase.from('profiles').select('*').order('nome');
    if (error) return [];
    return data.map(p => ({
      id: p.id, nome: p.nome, email: p.email, senha: '***', ativo: p.ativo,
      dataCriacao: p.created_at || p.dataCriacao, dataAtualizacao: p.updated_at || p.dataAtualizacao,
      basesAssociadas: p.bases_associadas || []
    }));
  }

  async atualizarUsuario(u: Usuario, perfilExecutor: string): Promise<boolean> {
    const { error } = await supabase.from('profiles').update({
        nome: u.nome, perfil: u.basesAssociadas[0]?.nivelAcesso || 'OPERACIONAL',
        bases_associadas: u.basesAssociadas, ativo: u.ativo, updated_at: new Date().toISOString()
      }).eq('id', u.id);
    return !error;
  }
}

export const authService = new AuthService();
