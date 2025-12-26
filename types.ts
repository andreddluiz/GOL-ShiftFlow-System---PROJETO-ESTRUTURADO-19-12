
export enum PermissionLevel {
  ADMIN = 'Admin',
  GESTOR = 'Gestor',
  LIDER = 'Líder',
  OPERACAO = 'Operação'
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
  jornada: '6h' | '8h' | '12h';
  numeroTurnos: number;
  turnos: Shift[];
  status: 'Ativa' | 'Inativa';
  metaVerde: number; 
  metaAmarelo: number; 
  metaVermelho: number;
  deletada?: boolean;
}

export interface User {
  id: string;
  nome: string;
  email: string;
  loginRE?: string;
  bases: string[]; 
  permissao: PermissionLevel;
  status: 'Ativo' | 'Inativo';
  jornadaPadrao: number; 
  deletada?: boolean;
}

export interface Category {
  id: string;
  nome: string;
  tipo: 'operacional' | 'mensal';
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
  mes: number; // 1-12
  ano: number;
  status: 'ABERTO' | 'FINALIZADO';
  tarefasValores: Record<string, string>; // ID da tarefa -> Valor string (qty ou tempo)
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
  quantidade: number | null; // OBRIGATÓRIO
  dataMaisAntigo: string;    // OBRIGATÓRIO SE QUANTIDADE > 0
  isPadrao?: boolean;
  config?: any;
}

export interface TransitRow {
  id: string;
  nomeTransito: string;
  diasPadrao: number;
  quantidade: number | null; // OBRIGATÓRIO
  dataSaida: string;         // OBRIGATÓRIO SE QUANTIDADE > 0
  isPadrao?: boolean;
  config?: any;
}

export interface ShelfLifeRow {
  id: string;
  partNumber: string;
  lote: string;
  dataVencimento: string; 
  isPadrao?: boolean;
  config?: any;
}

export interface CriticalRow {
  id: string;
  partNumber: string;
  lote: string;
  saldoSistema: number | null; 
  saldoFisico: number | null;  
  isPadrao?: boolean;
  config?: any;
}

export interface OutraAtividade {
  id: string;
  nome: string;
  tempo: string; // HH:MM:SS
}

export interface ShiftHandover {
  id: string;
  baseId: string;
  data: string;
  turnoId: string;
  colaboradores: (string | null)[]; 
  tarefasExecutadas: Record<string, string>;
  nonRoutineTasks?: OutraAtividade[]; // Corrigido para usar a nova interface de OutraAtividade
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

export interface Indicator {
  id: string;
  baseId: string;
  turno: string;
  data: string;
  totalHoras: number;
  totalMinutos: number;
  horasPorCategoria: {
    categoryId: string;
    categoryNome: string;
    horas: number;
    minutos: number;
    percentual: number;
  }[];
  horasDisponivel: number;
  horasProduzida: number;
  percentualProdutividade: number;
  distribuicaoTempo: {
    categoryId: string;
    categoryNome: string;
    valor: number;
  }[];
  dataCriacao: string;
}

export interface Report {
  id: string;
  baseId: string;
  turno: string;
  data: string;
  statusPreenchimento: 'completo' | 'incompleto' | 'pendente';
  responsavel?: string;
  resumoGeral: {
    categoryId: string;
    categoryNome: string;
    totalHoras: number;
    totalMinutos: number;
  }[];
  detalhamento: {
    data: string;
    turno: string;
    colaborador: string;
    categoryId: string;
    categoryNome: string;
    horas: number;
    minutos: number;
  }[];
  dataCriacao: string;
}
