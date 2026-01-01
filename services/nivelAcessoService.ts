
import { Usuario, UsuarioBase } from '../types';

export type NivelAcesso = 'OPERACIONAL' | 'ANALISTA' | 'LÍDER' | 'ADMINISTRADOR';

interface HierarquiaNiveis {
  OPERACIONAL: 0;
  ANALISTA: 1;
  LÍDER: 2;
  ADMINISTRADOR: 3;
}

class NivelAcessoService {
  private hierarquia: HierarquiaNiveis = {
    OPERACIONAL: 0,
    ANALISTA: 1,
    LÍDER: 2,
    ADMINISTRADOR: 3,
  };

  obterNivelAcessoEmBase(usuario: Usuario, baseId: string): NivelAcesso | null {
    console.debug(`[NivelAcesso] Obtendo nível para usuário ${usuario.email} em base ${baseId}`);
    const baseAssociada = usuario.basesAssociadas.find(b => b.baseId === baseId);
    if (!baseAssociada) {
      console.warn(`[NivelAcesso] Usuário não está associado à base ${baseId}`);
      return null;
    }
    return baseAssociada.nivelAcesso as NivelAcesso;
  }

  ehNivelMaiorOuIgual(nivel1: NivelAcesso, nivel2: NivelAcesso): boolean {
    return this.hierarquia[nivel1] >= this.hierarquia[nivel2];
  }

  ehNivelMenor(nivel1: NivelAcesso, nivel2: NivelAcesso): boolean {
    return this.hierarquia[nivel1] < this.hierarquia[nivel2];
  }

  podeGerenciarUsuario(
    usuarioGerenciador: Usuario,
    usuarioAlvo: Usuario,
    baseId: string
  ): boolean {
    console.debug(`[NivelAcesso] Verificando se ${usuarioGerenciador.email} pode gerenciar ${usuarioAlvo.email}`);
    const nivelGerenciador = this.obterNivelAcessoEmBase(usuarioGerenciador, baseId);
    const nivelAlvo = this.obterNivelAcessoEmBase(usuarioAlvo, baseId);

    if (!nivelGerenciador || !nivelAlvo) {
      console.warn(`[NivelAcesso] Um dos usuários não está associado à base`);
      return false;
    }

    if (nivelGerenciador === 'ADMINISTRADOR') return true;
    if (nivelGerenciador === 'LÍDER') {
      return nivelAlvo === 'OPERACIONAL' || nivelAlvo === 'ANALISTA';
    }
    return false;
  }

  obterNiveisDisponiveis(usuarioGerenciador: Usuario, baseId: string): NivelAcesso[] {
    console.debug(`[NivelAcesso] Obtendo níveis disponíveis para ${usuarioGerenciador.email}`);
    const nivelGerenciador = this.obterNivelAcessoEmBase(usuarioGerenciador, baseId);

    if (!nivelGerenciador) return [];
    if (nivelGerenciador === 'ADMINISTRADOR') {
      return ['OPERACIONAL', 'ANALISTA', 'LÍDER', 'ADMINISTRADOR'];
    }
    if (nivelGerenciador === 'LÍDER') {
      return ['OPERACIONAL', 'ANALISTA'];
    }
    return [];
  }

  atualizarNivelAcesso(
    usuarioAlvo: Usuario,
    baseId: string,
    novoNivel: NivelAcesso
  ): Usuario {
    console.debug(`[NivelAcesso] Atualizando nível de ${usuarioAlvo.email} para ${novoNivel}`);
    const basesAtualizadas = usuarioAlvo.basesAssociadas.map(base => {
      if (base.baseId === baseId) {
        return {
          ...base,
          nivelAcesso: novoNivel,
          dataAtualizacao: new Date().toISOString(),
        };
      }
      return base;
    });

    return {
      ...usuarioAlvo,
      basesAssociadas: basesAtualizadas,
      dataAtualizacao: new Date().toISOString(),
    };
  }

  adicionarUsuarioABase(
    usuario: Usuario,
    baseId: string,
    nivelAcesso: NivelAcesso
  ): Usuario {
    console.debug(`[NivelAcesso] Adicionando ${usuario.email} à base ${baseId} com nível ${nivelAcesso}`);
    const jaExiste = usuario.basesAssociadas.some(b => b.baseId === baseId);
    if (jaExiste) return usuario;

    const novaBase: UsuarioBase = {
      baseId,
      nivelAcesso,
      dataCriacao: new Date().toISOString(),
      dataAtualizacao: new Date().toISOString(),
      ativo: true,
    };

    return {
      ...usuario,
      basesAssociadas: [...usuario.basesAssociadas, novaBase],
      dataAtualizacao: new Date().toISOString(),
    };
  }

  removerUsuarioDaBase(usuario: Usuario, baseId: string): Usuario {
    return {
      ...usuario,
      basesAssociadas: usuario.basesAssociadas.filter(b => b.baseId !== baseId),
      dataAtualizacao: new Date().toISOString(),
    };
  }
}

export const nivelAcessoService = new NivelAcessoService();
