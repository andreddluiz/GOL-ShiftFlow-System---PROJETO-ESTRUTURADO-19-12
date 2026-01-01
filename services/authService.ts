
import { Usuario, UsuarioAutenticado, UsuarioBase } from '../types';

export interface CredenciaisLogin {
  email: string;
  senha: string;
}

class AuthService {
  private chaveUsuariosUnificada = 'gol_shiftflow_users_v2';
  private chaveUsuarioAutenticado = 'gol_usuario_autenticado';
  private chaveToken = 'gol_token_autenticacao';

  constructor() {
    this.inicializarUsuariosTeste();
  }

  private inicializarUsuariosTeste() {
    const agora = new Date().toISOString();
    const usuariosExistentes = this.obterTodosUsuariosBrutos();
    
    // Removido SDU do administrador padrão conforme solicitado
    const usuariosTeste: any[] = [
      {
        id: 'u-admin', email: 'admin@gol.com', senha: 'admin123', nome: 'Administrador Geral',
        status: 'Ativo', ativo: true, dataCriacao: agora, dataAtualizacao: agora, permissao: 'ADMINISTRADOR',
        bases: ['poa', 'gru'],
        basesAssociadas: [
          { baseId: 'poa', nivelAcesso: 'ADMINISTRADOR', ativo: true, dataCriacao: agora, dataAtualizacao: agora },
          { baseId: 'gru', nivelAcesso: 'ADMINISTRADOR', ativo: true, dataCriacao: agora, dataAtualizacao: agora }
        ]
      },
      {
        id: 'u-lider', email: 'lider.poa@gol.com', senha: 'lider123', nome: 'Líder POA',
        status: 'Ativo', ativo: true, dataCriacao: agora, dataAtualizacao: agora, permissao: 'LÍDER',
        bases: ['poa', 'gru'],
        basesAssociadas: [
          { baseId: 'poa', nivelAcesso: 'LÍDER', ativo: true, dataCriacao: agora, dataAtualizacao: agora },
          { baseId: 'gru', nivelAcesso: 'OPERACIONAL', ativo: true, dataCriacao: agora, dataAtualizacao: agora }
        ]
      }
    ];

    let novosUsuarios = [...usuariosExistentes];
    let alterou = false;

    usuariosTeste.forEach(uTeste => {
      const idx = usuariosExistentes.findIndex((u: any) => u.email === uTeste.email);
      if (idx === -1) {
        novosUsuarios.push(uTeste);
        alterou = true;
      } else if (uTeste.id === 'u-admin') {
        // Forçar atualização do admin para remover SDU se já existir
        const adminExistente = novosUsuarios[idx];
        if (adminExistente.bases && adminExistente.bases.includes('sdu')) {
            novosUsuarios[idx] = uTeste;
            alterou = true;
        }
      }
    });

    if (alterou) {
      localStorage.setItem(this.chaveUsuariosUnificada, JSON.stringify(novosUsuarios));
    }
  }

  private obterTodosUsuariosBrutos(): any[] {
    try {
      const data = localStorage.getItem(this.chaveUsuariosUnificada);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  }

  fazerLogin(credenciais: CredenciaisLogin): UsuarioAutenticado | null {
    try {
      const usuarios = this.obterTodosUsuariosBrutos();
      const usuario = usuarios.find(u => u.email === credenciais.email);
      
      if (!usuario || (usuario.senha !== credenciais.senha && usuario.password !== credenciais.senha)) return null;
      if (usuario.status === 'Inativo') return null;

      const usuarioProcessado = this.mapearParaUsuario(usuario);

      let perfilMaior = 'OPERACIONAL';
      const hierarquia = { OPERACIONAL: 0, ANALISTA: 1, LÍDER: 2, ADMINISTRADOR: 3 };

      usuarioProcessado.basesAssociadas.forEach(base => {
        const nivel = base.nivelAcesso as keyof typeof hierarquia;
        if (hierarquia[nivel] > hierarquia[perfilMaior as keyof typeof hierarquia]) {
          perfilMaior = base.nivelAcesso;
        }
      });

      const usuarioAutenticado: UsuarioAutenticado = {
        id: usuarioProcessado.id,
        email: usuarioProcessado.email,
        nome: usuarioProcessado.nome,
        perfil: perfilMaior,
        basesAssociadas: usuarioProcessado.basesAssociadas,
        baseAtual: usuarioProcessado.basesAssociadas[0]?.baseId || '',
      };

      localStorage.setItem(this.chaveUsuarioAutenticado, JSON.stringify(usuarioAutenticado));
      localStorage.setItem(this.chaveToken, `token_${Date.now()}`);

      return usuarioAutenticado;
    } catch (error) {
      return null;
    }
  }

  private mapearParaUsuario(u: any): Usuario {
    if (u.basesAssociadas && u.basesAssociadas.length > 0) {
      return u as Usuario;
    }

    const agora = new Date().toISOString();
    const basesIniciais: UsuarioBase[] = (u.bases || []).map((bId: string) => ({
      baseId: bId,
      nivelAcesso: (u.permissao || 'OPERACIONAL') as any,
      ativo: true,
      dataCriacao: agora,
      dataAtualizacao: agora
    }));

    return {
      id: u.id,
      nome: u.nome,
      email: u.email,
      senha: u.senha || u.password || 'gol123',
      ativo: u.status !== 'Inativo',
      dataCriacao: u.dataCriacao || agora,
      dataAtualizacao: agora,
      basesAssociadas: basesIniciais.length > 0 ? basesIniciais : []
    };
  }

  fazerLogout(): void {
    localStorage.removeItem(this.chaveUsuarioAutenticado);
    localStorage.removeItem(this.chaveToken);
  }

  obterUsuarioAutenticado(): UsuarioAutenticado | null {
    try {
      const u = localStorage.getItem(this.chaveUsuarioAutenticado);
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  }

  listarUsuarios(perfilCriador: string): Usuario[] {
    const usuarios = this.obterTodosUsuariosBrutos();
    return usuarios.map(u => this.mapearParaUsuario(u));
  }

  atualizarUsuario(u: Usuario, perfilExecutor: string): boolean {
    const usuarios = this.obterTodosUsuariosBrutos();
    const index = usuarios.findIndex(usr => usr.id === u.id);
    
    if (index !== -1) {
      const original = usuarios[index];
      usuarios[index] = {
        ...original,
        ...u,
        status: u.ativo ? 'Ativo' : 'Inativo',
        bases: u.basesAssociadas.map(ba => ba.baseId),
        dataAtualizacao: new Date().toISOString()
      };
      localStorage.setItem(this.chaveUsuariosUnificada, JSON.stringify(usuarios));
      return true;
    }
    return false;
  }
}

export const authService = new AuthService();
