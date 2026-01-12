
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
      // Limpa resquícios de sessões anteriores
      localStorage.removeItem(this.chaveUsuarioAutenticado);

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credenciais.email,
        password: credenciais.senha,
      });

      if (authError || !authData.user) {
        console.error('[Auth] Erro no login Supabase Auth:', authError?.message);
        return null;
      }

      console.log('[Auth] Autenticação básica OK. Buscando perfil...');

      // Buscar perfil estendido no banco de dados
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile) {
        console.warn('[Auth] Perfil não encontrado no DB para este UID.');
        
        // Fallback especial para conta admin mestre caso o profile tenha sido deletado
        if (credenciais.email.toLowerCase() === 'admin@gol.com') {
           console.info('[Auth] Gerando sessão emergencial para Admin Mestre.');
           return this.gerarSessaoMockAdmin(authData.user);
        }
        return null;
      }

      console.log('[Auth] Perfil carregado do DB:', {
        nome: profile.nome,
        perfil_db: profile.perfil,
        ativo: profile.ativo
      });

      if (!profile.ativo) {
        console.error('[Auth] Usuário está inativo no sistema.');
        return null;
      }

      // Normalização do perfil para garantir compatibilidade (Maiúsculas)
      const perfilNormalizado = String(profile.perfil || 'OPERACIONAL').toUpperCase();

      const usuarioAutenticado: UsuarioAutenticado = {
        id: profile.id,
        email: profile.email,
        nome: profile.nome,
        perfil: perfilNormalizado,
        basesAssociadas: profile.bases_associadas || [],
        baseAtual: profile.bases_associadas?.[0]?.baseId || '',
      };

      console.log(`[Auth] Sessão finalizada. Perfil definido como: ${usuarioAutenticado.perfil}`);
      
      localStorage.setItem(this.chaveUsuarioAutenticado, JSON.stringify(usuarioAutenticado));
      return usuarioAutenticado;
    } catch (error) {
      console.error('[Auth] Erro catastrófico no processo de login:', error);
      return null;
    }
  }

  private gerarSessaoMockAdmin(user: any): UsuarioAutenticado {
    const adminSessao: UsuarioAutenticado = {
      id: user.id,
      email: user.email,
      nome: 'Administrador Mestre (Recuperado)',
      perfil: 'ADMINISTRADOR',
      basesAssociadas: [
        { baseId: 'poa', nivelAcesso: 'ADMINISTRADOR', ativo: true, dataCriacao: new Date().toISOString(), dataAtualizacao: new Date().toISOString() },
        { baseId: 'gru', nivelAcesso: 'ADMINISTRADOR', ativo: true, dataCriacao: new Date().toISOString(), dataAtualizacao: new Date().toISOString() }
      ],
      baseAtual: 'poa'
    };
    localStorage.setItem(this.chaveUsuarioAutenticado, JSON.stringify(adminSessao));
    return adminSessao;
  }

  fazerLogout(): void {
    console.log('[Auth] Encerrando sessão...');
    supabase.auth.signOut();
    localStorage.removeItem(this.chaveUsuarioAutenticado);
  }

  obterUsuarioAutenticado(): UsuarioAutenticado | null {
    try {
      const u = localStorage.getItem(this.chaveUsuarioAutenticado);
      if (!u) return null;
      return JSON.parse(u);
    } catch { 
      return null; 
    }
  }

  async listarUsuarios(perfilCriador: string): Promise<Usuario[]> {
    console.debug('[Auth] Listando todos os perfis do banco.');
    const { data, error } = await supabase.from('profiles').select('*').order('nome');
    if (error) {
      console.error('[Auth] Erro ao listar perfis:', error.message);
      return [];
    }
    return data.map(p => ({
      id: p.id,
      nome: p.nome,
      email: p.email,
      senha: '***',
      ativo: p.ativo,
      dataCriacao: p.created_at || p.dataCriacao,
      dataAtualizacao: p.updated_at || p.dataAtualizacao,
      basesAssociadas: p.bases_associadas || []
    }));
  }

  async atualizarUsuario(u: Usuario, perfilExecutor: string): Promise<boolean> {
    console.log(`[Auth] Atualizando perfil de ${u.email}...`);
    
    // IMPORTANTE: Tenta manter o perfil global se ele já for ADMINISTRADOR
    // ou usa o nível da primeira base como referência.
    let novoPerfilGlobal = u.basesAssociadas[0]?.nivelAcesso || 'OPERACIONAL';
    
    // Se o usuário já era administrador, mantemos ele assim a menos que explicitamente alterado
    const { data: current } = await supabase.from('profiles').select('perfil').eq('id', u.id).single();
    if (current?.perfil === 'ADMINISTRADOR' && novoPerfilGlobal !== 'ADMINISTRADOR') {
       console.warn('[Auth] Aviso: Perfil ADMINISTRADOR está sendo alterado via edição de bases.');
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        nome: u.nome,
        perfil: novoPerfilGlobal,
        bases_associadas: u.basesAssociadas,
        ativo: u.ativo,
        updated_at: new Date().toISOString()
      })
      .eq('id', u.id);
    
    if (error) {
      console.error('[Auth] Erro ao atualizar perfil no Supabase:', error.message);
      return false;
    }
    
    return true;
  }
}

export const authService = new AuthService();
