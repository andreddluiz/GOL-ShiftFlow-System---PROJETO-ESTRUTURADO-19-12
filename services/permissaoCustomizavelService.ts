
import { PermissaoItem, NivelAcessoCustomizado } from '../types';

class PermissaoCustomizavelService {
  private prefixoNiveis = 'gol_nivel_perm_';

  private permissoesDisponiveis: PermissaoItem[] = [
    { id: 'passagemServico', nome: 'Passagem de Serviço', descricao: 'Permite preencher e salvar passagens diárias', categoria: 'Operacional' },
    { id: 'coletaMensal', nome: 'Coleta Mensal', descricao: 'Permite preencher indicadores mensais', categoria: 'Operacional' },
    { id: 'indicadores', nome: 'Visualizar Indicadores', descricao: 'Acesso aos dashboards e gráficos', categoria: 'Relatórios' },
    { id: 'relatorios', nome: 'Visualizar Relatórios', descricao: 'Acesso às tabelas de histórico e exportação', categoria: 'Relatórios' },
    { id: 'gerenciamento', nome: 'Acesso ao Gerenciamento', descricao: 'Permite acessar configurações globais', categoria: 'Administração' },
    { id: 'criarUsuarios', nome: 'Gerir Usuários', descricao: 'Criar e editar contas de usuários', categoria: 'Administração' },
    { id: 'visualizarOutrasBases', nome: 'Visualizar Todas as Bases', descricao: 'Permite ver dados de bases não associadas', categoria: 'Segurança' }
  ];

  private niveisPadrao: NivelAcessoCustomizado[] = [
    {
      id: 'OPERACIONAL', nome: 'Operacional', descricao: 'Perfil básico de operação', tipo: 'PADRÃO', ativo: true,
      dataCriacao: new Date().toISOString(), dataAtualizacao: new Date().toISOString(),
      permissoes: { passagemServico: true, coletaMensal: false, indicadores: true, relatorios: true, gerenciamento: false, criarUsuarios: false, visualizarOutrasBases: false }
    },
    {
      id: 'ANALISTA', nome: 'Analista', descricao: 'Perfil de análise de dados', tipo: 'PADRÃO', ativo: true,
      dataCriacao: new Date().toISOString(), dataAtualizacao: new Date().toISOString(),
      permissoes: { passagemServico: true, coletaMensal: true, indicadores: true, relatorios: true, gerenciamento: false, criarUsuarios: false, visualizarOutrasBases: false }
    },
    {
      id: 'LÍDER', nome: 'Líder', descricao: 'Gestão de base local', tipo: 'PADRÃO', ativo: true,
      dataCriacao: new Date().toISOString(), dataAtualizacao: new Date().toISOString(),
      permissoes: { passagemServico: true, coletaMensal: true, indicadores: true, relatorios: true, gerenciamento: true, criarUsuarios: true, visualizarOutrasBases: false }
    },
    {
      id: 'ADMINISTRADOR', nome: 'Administrador', descricao: 'Gestão total do sistema', tipo: 'PADRÃO', ativo: true,
      dataCriacao: new Date().toISOString(), dataAtualizacao: new Date().toISOString(),
      permissoes: { passagemServico: true, coletaMensal: true, indicadores: true, relatorios: true, gerenciamento: true, criarUsuarios: true, visualizarOutrasBases: true }
    }
  ];

  obterPermissoesDisponiveis(): PermissaoItem[] {
    return this.permissoesDisponiveis;
  }

  obterPermissoesPorCategoria(): Record<string, PermissaoItem[]> {
    return this.permissoesDisponiveis.reduce((acc, curr) => {
      if (!acc[curr.categoria]) acc[curr.categoria] = [];
      acc[curr.categoria].push(curr);
      return acc;
    }, {} as Record<string, PermissaoItem[]>);
  }

  listarNiveis(): NivelAcessoCustomizado[] {
    const customizados: NivelAcessoCustomizado[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const chave = localStorage.key(i);
      if (chave?.startsWith(this.prefixoNiveis)) {
        customizados.push(JSON.parse(localStorage.getItem(chave)!));
      }
    }
    return [...this.niveisPadrao, ...customizados];
  }

  obterNivel(id: string): NivelAcessoCustomizado | null {
    const padrao = this.niveisPadrao.find(n => n.id === id);
    if (padrao) return padrao;
    const custom = localStorage.getItem(`${this.prefixoNiveis}${id}`);
    return custom ? JSON.parse(custom) : null;
  }

  salvarNivel(nivel: NivelAcessoCustomizado): void {
    if (nivel.tipo === 'PADRÃO') return;
    nivel.dataAtualizacao = new Date().toISOString();
    localStorage.setItem(`${this.prefixoNiveis}${nivel.id}`, JSON.stringify(nivel));
    console.debug(`[Permissoes] Nível ${nivel.nome} salvo com sucesso.`);
  }

  deletarNivel(id: string): void {
    localStorage.removeItem(`${this.prefixoNiveis}${id}`);
  }

  // Adicionado: método para duplicar um nível de acesso existente criando um novo perfil customizado
  duplicarNivel(idOrigem: string, novoId: string, novoNome: string): void {
    const origem = this.obterNivel(idOrigem);
    if (!origem) return;

    const novoNivel: NivelAcessoCustomizado = {
      ...origem,
      id: novoId,
      nome: novoNome,
      tipo: 'CUSTOMIZADO',
      dataCriacao: new Date().toISOString(),
      dataAtualizacao: new Date().toISOString(),
      ativo: true
    };

    this.salvarNivel(novoNivel);
  }

  temPermissao(nivelId: string, permissaoId: string): boolean {
    const nivel = this.obterNivel(nivelId);
    return nivel?.permissoes[permissaoId] === true;
  }
}

export const permissaoCustomizavelService = new PermissaoCustomizavelService();
