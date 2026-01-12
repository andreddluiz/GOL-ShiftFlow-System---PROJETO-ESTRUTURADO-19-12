
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

    // Outros perfis dependem da associação ativa (comparação insensível a case)
    return usuario.basesAssociadas.some(
      b => b.baseId.toLowerCase() === baseId.toLowerCase() && b.ativo
    );
  }

  /**
   * Retorna apenas as bases que o usuário tem permissão para visualizar.
   */
  obterBasesAcessiveis(usuario: UsuarioAutenticado | null, todasAsBases: any[]): any[] {
    if (!usuario) return [];

    if (usuario.perfil === 'ADMINISTRADOR') {
      console.debug('[DataAccess] Admin detectado: liberando todas as bases.', todasAsBases.length);
      return todasAsBases;
    }

    const acessiveis = todasAsBases.filter(base =>
      usuario.basesAssociadas.some(b => b.baseId.toLowerCase() === base.id.toLowerCase() && b.ativo)
    );
    
    console.debug(`[DataAccess] Usuário ${usuario.perfil} filtrado: ${acessiveis.length} de ${todasAsBases.length} bases.`);
    return acessiveis;
  }

  /**
   * Valida se a base atual selecionada é permitida, caso contrário retorna a primeira disponível.
   */
  validarBaseAtual(usuario: UsuarioAutenticado | null, baseIdDesejada: string): string {
    if (!usuario) return '';

    if (baseIdDesejada !== 'all' && this.podeAcessarBase(usuario, baseIdDesejada)) {
      return baseIdDesejada;
    }

    const acessiveis = this.obterBasesAcessiveis(usuario, []); // Apenas para checar perfil
    if (usuario.perfil === 'ADMINISTRADOR') return baseIdDesejada;

    const disponiveis = usuario.basesAssociadas.filter(b => b.ativo);
    return disponiveis.length > 0 ? disponiveis[0].baseId : '';
  }

  /**
   * Filtra um array de dados mantendo apenas os registros das bases permitidas para o usuário.
   */
  filtrarDadosPorPermissao(dados: any[], usuario: UsuarioAutenticado | null): any[] {
    if (!usuario) return [];
    if (usuario.perfil === 'ADMINISTRADOR') return dados;

    const basesPermitidas = new Set(
      usuario.basesAssociadas.filter(b => b.ativo).map(b => b.baseId.toLowerCase())
    );
    return dados.filter(item => basesPermitidas.has(item.baseId?.toLowerCase()));
  }
}

export const dataAccessControlService = new DataAccessControlService();
