
import { Usuario, UsuarioAutenticado, UsuarioBase } from '../types';

export interface CredenciaisLogin {
  email: string;
  senha: string;
}

class AuthService {
  private chaveUsuarios = 'gol_shiftflow_users_v2';
  private chaveSessao = 'gol_usuario_autenticado';

  constructor() {
    this.inicializarUsuariosPadrao();
  }

  private inicializarUsuariosPadrao() {
    const usuariosExistentes = this.obterUsuariosDoStorage();
    if (usuariosExistentes.length === 0) {
      const agora = new Date().toISOString();
      const padrao: any[] = [
        {
          id: 'u-admin',
          email: 'admin@gol.com',
          senha: 'admin',
          nome: 'Administrador GOL',
          status: 'Ativo',
          ativo: true,
          dataCriacao: agora,
          basesAssociadas: [
            { baseId: 'poa', nivelAcesso: 'ADMINISTRADOR', ativo: true },
            { baseId: 'gru', nivelAcesso: 'ADMINISTRADOR', ativo: true }
          ]
        },
        {
          id: 'u-lider',
          email: 'lider@gol.com',
          senha: 'lider',
          nome: 'Líder Operacional',
          status: 'Ativo',
          ativo: true,
          dataCriacao: agora,
          basesAssociadas: [
            { baseId: 'poa', nivelAcesso: 'LÍDER', ativo: true }
          ]
        }
      ];
      localStorage.setItem(this.chaveUsuarios, JSON.stringify(padrao));
    }
  }

  private obterUsuariosDoStorage(): any[] {
    try {
      const data = localStorage.getItem(this.chaveUsuarios);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  }

  async fazerLogin(credenciais: CredenciaisLogin): Promise<UsuarioAutenticado | null> {
    // Simula delay de rede para feedback visual
    await new Promise(r => setTimeout(r, 600));
    
    const usuarios = this.obterUsuariosDoStorage();
    const u = usuarios.find(user => 
      user.email.toLowerCase() === credenciais.email.toLowerCase() && 
      user.senha === credenciais.senha
    );

    if (!u || u.status === 'Inativo') return null;

    // Calcula o nível de permissão mais alto entre todas as bases associadas do usuário
    let perfilSuperior = 'OPERACIONAL';
    const pesos = { 'OPERACIONAL': 0, 'ANALISTA': 1, 'LÍDER': 2, 'ADMINISTRADOR': 3 };
    
    u.basesAssociadas.forEach((ba: any) => {
      if (pesos[ba.nivelAcesso as keyof typeof pesos] > pesos[perfilSuperior as keyof typeof pesos]) {
        perfilSuperior = ba.nivelAcesso;
      }
    });

    const usuarioAutenticado: UsuarioAutenticado = {
      id: u.id,
      email: u.email,
      nome: u.nome,
      perfil: perfilSuperior,
      basesAssociadas: u.basesAssociadas,
      baseAtual: u.basesAssociadas[0]?.baseId || ''
    };

    // USANDO SESSION STORAGE: A sessão expira quando fechar o navegador
    sessionStorage.setItem(this.chaveSessao, JSON.stringify(usuarioAutenticado));
    // Limpa possível lixo do localStorage antigo
    localStorage.removeItem(this.chaveSessao);
    
    return usuarioAutenticado;
  }

  async criarConta(dados: { email: string, senha: string, nome: string }): Promise<UsuarioAutenticado | null> {
    const usuarios = this.obterUsuariosDoStorage();
    if (usuarios.some(u => u.email.toLowerCase() === dados.email.toLowerCase())) {
      throw new Error('E-mail já cadastrado no sistema.');
    }

    const novoUsuario = {
      id: `u-${Date.now()}`,
      ...dados,
      status: 'Ativo',
      ativo: true,
      dataCriacao: new Date().toISOString(),
      basesAssociadas: [{ baseId: 'poa', nivelAcesso: 'OPERACIONAL', ativo: true }]
    };

    usuarios.push(novoUsuario);
    localStorage.setItem(this.chaveUsuarios, JSON.stringify(usuarios));

    return this.fazerLogin({ email: dados.email, senha: dados.senha });
  }

  fazerLogout(): void {
    sessionStorage.removeItem(this.chaveSessao);
    localStorage.removeItem(this.chaveSessao);
  }

  obterUsuarioAutenticado(): UsuarioAutenticado | null {
    try {
      // Prioriza session storage para segurança
      const u = sessionStorage.getItem(this.chaveSessao);
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  }

  listarUsuarios(perfilLogado: string): Usuario[] {
    const usuarios = this.obterUsuariosDoStorage();
    return usuarios.map(u => ({
      ...u,
      ativo: u.status === 'Ativo'
    })) as Usuario[];
  }

  atualizarUsuario(u: Usuario, perfilExecutor: string): boolean {
    const usuarios = this.obterUsuariosDoStorage();
    const idx = usuarios.findIndex(usr => usr.id === u.id);
    if (idx !== -1) {
      usuarios[idx] = { ...usuarios[idx], ...u, status: u.ativo ? 'Ativo' : 'Inativo' };
      localStorage.setItem(this.chaveUsuarios, JSON.stringify(usuarios));
      return true;
    }
    return false;
  }
}

export const authService = new AuthService();
