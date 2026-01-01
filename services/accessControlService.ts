
import { permissaoCustomizavelService } from './permissaoCustomizavelService';

export interface Permissoes {
  passagemServico: boolean;
  coletaMensal: boolean;
  gerenciamento: boolean;
  relatorios: boolean;
  indicadores: boolean;
  visualizarOutrasBases: boolean;
  criarUsuarios: boolean;
  [key: string]: boolean;
}

class AccessControlService {
  temPermissao(perfil: string, funcionalidade: string): boolean {
    return permissaoCustomizavelService.temPermissao(perfil, funcionalidade);
  }

  obterPermissoes(perfil: string): Permissoes {
    const nivel = permissaoCustomizavelService.obterNivel(perfil);
    return (nivel?.permissoes || {}) as unknown as Permissoes;
  }

  podeAcessarPagina(perfil: string, path: string): boolean {
    const p = this.obterPermissoes(perfil);
    
    if (path.includes('shift-handover')) return !!p.passagemServico;
    if (path.includes('monthly-collection')) return !!p.coletaMensal;
    if (path.includes('management/users')) return !!p.criarUsuarios || perfil === 'ADMINISTRADOR';
    if (path.includes('management/permissions')) return perfil === 'ADMINISTRADOR'; 
    if (path.includes('management')) return !!p.gerenciamento;
    if (path.includes('reports')) return !!p.relatorios;
    if (path.includes('dashboard')) return !!p.indicadores;
    
    return true;
  }
}

export const accessControlService = new AccessControlService();
