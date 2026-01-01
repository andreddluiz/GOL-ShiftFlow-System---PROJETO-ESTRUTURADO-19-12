
import { UsuarioAutenticado } from '../types';

class DataAccessControlService {
  /**
   * Verifica se o usuário tem permissão para acessar os dados de uma base específica.
   */
  podeAcessarBase(usuario: UsuarioAutenticado | null, baseId: string): boolean {
    if (!usuario) return false;

    // Administrador tem acesso irrestrito
    if (usuario.perfil === 'ADMINISTRADOR') {
      return true;
    }

    // Outros perfis dependem da associação ativa
    return usuario.basesAssociadas.some(b => b.baseId === baseId && b.ativo);
  }

  /**
   * Retorna apenas as bases que o usuário tem permissão para visualizar.
   */
  obterBasesAcessiveis(usuario: UsuarioAutenticado | null, todasAsBases: any[]): any[] {
    if (!usuario) return [];

    if (usuario.perfil === 'ADMINISTRADOR') {
      return todasAsBases;
    }

    return todasAsBases.filter(base =>
      usuario.basesAssociadas.some(b => b.baseId === base.id && b.ativo)
    );
  }

  /**
   * Valida se a base atual selecionada é permitida, caso contrário retorna a primeira disponível.
   */
  validarBaseAtual(usuario: UsuarioAutenticado | null, baseIdDesejada: string): string {
    if (!usuario) return '';

    if (this.podeAcessarBase(usuario, baseIdDesejada)) {
      return baseIdDesejada;
    }

    const acessiveis = usuario.basesAssociadas.filter(b => b.ativo);
    return acessiveis.length > 0 ? acessiveis[0].baseId : '';
  }

  /**
   * Filtra um array de dados mantendo apenas os registros das bases permitidas para o usuário.
   */
  filtrarDadosPorPermissao(dados: any[], usuario: UsuarioAutenticado | null): any[] {
    if (!usuario) return [];
    if (usuario.perfil === 'ADMINISTRADOR') return dados;

    const basesPermitidas = new Set(usuario.basesAssociadas.filter(b => b.ativo).map(b => b.baseId));
    return dados.filter(item => basesPermitidas.has(item.baseId));
  }
}

export const dataAccessControlService = new DataAccessControlService();
