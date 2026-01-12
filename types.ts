
export enum PermissionLevel {
  ADMIN = 'ADMINISTRADOR',
  LIDER = 'LÍDER',
  ANALISTA = 'ANALISTA',
  OPERACAO = 'OPERACIONAL'
}

export enum MeasureType {
  QTD = 'QTD',
  TEMPO = 'TEMPO'
}

export type ControlType = 'locations' | 'transito' | 'shelf_life' | 'itens_criticos' | 'TAT' | string;

export interface Shift {
  id: string;
  numero: number;
  horaInicio: string; 
  horaFim: string; 
}

export interface Base {
  id: string;
  nome: string;
  sigla: string;
  jornada: '6h' | '8h' | '12h' | '07:12h';
  numeroTurnos: number;
  turnos: Shift[];
  status: 'Ativa' | 'Inativa';
  metaVerde: number; 
  metaAmarelo: number; 
  metaVermelho: number;
  deletada?: boolean;
  metaHorasDisponiveisAno?: Record<string, number>; 
}

export interface UsuarioBase {
  baseId: string;
  nivelAcesso: 'OPERACIONAL' | 'ANALISTA' | 'LÍDER' | 'ADMINISTRADOR' | string;
  dataCriacao: string;
  dataAtualizacao: string;
  ativo: boolean;
}

// Added missing PermissaoItem interface
export interface PermissaoItem {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
}

// Added missing NivelAcessoCustomizado interface
export interface NivelAcessoCustomizado {
  id: string;
  nome: string;
  descricao: string;
  tipo: 'PADRÃO' | 'CUSTOMIZADO';
  ativo: boolean;
  dataCriacao: string;
  dataAtualizacao: string;
  permissoes: Record<string, boolean>;
}

// Added missing Usuario interface
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  senha?: string;
  ativo: boolean;
  dataCriacao: string;
  dataAtualizacao: string;
  basesAssociadas: UsuarioBase[];
}

// Added missing UsuarioAutenticado interface
export interface UsuarioAutenticado {
  id: string;
  email: string;
  nome: string;
  perfil: string;
  basesAssociadas: UsuarioBase[];
  baseAtual: string;
}

export interface User {
  id: string;
  nome: string;
  email: string;
  loginRE?: string;
  bases: string[]; 
  permissao: PermissionLevel;
  // Fixed typo: Inativa -> Inativo
  status: 'Ativo' | 'Inativo'; 
  jornadaPadrao: number; 
  deletada?: boolean;
}

export interface Category {
  id: string;
  nome: string;
  tipo: 'operacional' | 'mensal';
  exibicao: 'lista' | 'suspensa'; 
  ordem: number;
  status: 'Ativa' | 'Inativa';
  visivel?: boolean; 
  deletada?: boolean; 
  baseId?: string | null;
}

export interface Task {
  id: string;
  categoriaId: string;
  nome: string;
  tipoMedida: MeasureType;
  fatorMultiplicador: number; 
  obrigatoriedade: boolean;
  status: 'Ativa' | 'Inativa';
  visivel?: boolean; 
  deletada?: boolean; 
  ordem: number;
  baseId?: string | null;
  dataExclusao?: string; 
}

export interface MonthlyCollection {
  id: string;
  baseId: string;
  mes: number; 
  ano: number;
  status: 'ABERTO' | 'FINALIZADO';
  tarefasValores: Record<string, string>; 
  dataCriacao: string;
  dataFinalizacao?: string;
  updatedAt: string;
}

export interface ConditionConfig {
  condicao: string; 
  operador: '>' | '<' | '=' | '>=' | '<=' | 'entre' | '!=';
  valor: number | string;
  valorMax?: number | string; 
  habilitado?: boolean; 
}

export interface PopupConfig {
  titulo: string;
  mensagem: string;
  icone?: string;
  cor?: string;
  habilitado?: boolean; 
}

export interface ManagedItem {
  id: string;
  baseId: string | null;
  status: 'ativo' | 'inativo';
  visivel?: boolean; 
  deletada?: boolean;
  cores?: {
    verde: ConditionConfig;
    amarelo: ConditionConfig;
    vermelho: ConditionConfig;
  };
  popups?: {
    verde: PopupConfig;
    amarelo: PopupConfig;
    vermelho: PopupConfig;
  };
}

export interface ShelfLifeItem extends ManagedItem {
  partNumber: string;
  lote: string;
  dataVencimento: string; 
}

export interface DefaultLocationItem extends ManagedItem {
  nomeLocation: string;
}

export interface DefaultTransitItem extends ManagedItem {
  nomeTransito: string;
  diasPadrao: number;
}

export interface DefaultCriticalItem extends ManagedItem {
  partNumber: string;
}

export interface CustomControlItem extends ManagedItem {
  tipoId: string;
  valores: Record<string, any>;
}

export interface CustomControlType {
  id: string;
  nome: string;
  descricao?: string;
  campos: string[]; 
  dataCriacao: string;
  deletada?: boolean;
}

export interface AlertConfig {
  verde: number;
  amarelo: number;
  vermelho: number;
  permitirPopupVerde: boolean;
  permitirPopupAmarelo: boolean;
  permitirPopupVermelho: boolean;
  mensagemVerde: string;
  mensagemAmarelo: string;
  mensagemVermelho: string;
}

export interface Control {
  id: string;
  baseId: string | null; 
  nome: string;
  tipo: ControlType;
  descricao: string;
  unidade: string;
  alertaConfig: AlertConfig;
  status: 'Ativo' | 'Inativo';
  cores?: {
    verde: ConditionConfig;
    amarelo: ConditionConfig;
    vermelho: ConditionConfig;
  };
  popups?: {
    verde: PopupConfig;
    amarelo: PopupConfig;
    vermelho: PopupConfig;
  };
}

export interface LocationRow {
  id: string;
  nomeLocation: string;
  quantidade: number | null; 
  dataMaisAntigo: string;    
  isPadrao?: boolean;
  config?: any;
  corBackground?: 'verde' | 'amarelo' | 'vermelho';
}

export interface TransitRow {
  id: string;
  nomeTransito: string;
  diasPadrao: number;
  quantidade: number | null; 
  dataSaida: string;         
  isPadrao?: boolean;
  config?: any;
  corBackground?: 'verde' | 'amarelo' | 'vermelho';
}

export interface ShelfLifeRow {
  id: string;
  partNumber: string;
  lote: string;
  dataVencimento: string; 
  isPadrao?: boolean;
  config?: any;
  corBackground?: 'verde' | 'amarelo' | 'vermelho';
}

export interface CriticalRow {
  id: string;
  partNumber: string;
  lote: string;
  saldoSistema: number | null; 
  saldoFisico: number | null;  
  isPadrao?: boolean;
  config?: any;
  corBackground?: 'verde' | 'amarelo' | 'vermelho';
}

export interface OutraAtividade {
  id: string;
  nome: string;
  tempo: string; 
  categoriaId?: string; 
  tipoMedida?: MeasureType; 
  fatorMultiplicador?: number; 
}

export interface ShiftHandover {
  id: string;
  baseId: string;
  data: string;
  turnoId: string;
  colaboradores: (string | null)[]; 
  tarefasExecutadas: Record<string, string>;
  nonRoutineTasks?: OutraAtividade[]; 
  locationsData: LocationRow[];
  transitData: TransitRow[];
  shelfLifeData: ShelfLifeRow[];
  criticalData: CriticalRow[];
  informacoesImportantes: string;
  status: 'Rascunho' | 'Finalizado';
  performance: number;
  CriadoEm: string;
  updatedAt: string;
}
