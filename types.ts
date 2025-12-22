
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
}

export interface Category {
  id: string;
  nome: string;
  tipo: 'operacional' | 'mensal';
  ordem: number;
  status: 'Ativa' | 'Inativa';
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
  ordem: number;
  baseId?: string | null;
  dataExclusao?: string; 
}

export interface ConditionConfig {
  condicao: string; // Ex: "Dias Restantes", "Valor"
  operador: '>' | '<' | '=' | '>=' | '<=';
  valor: number | string;
}

export interface PopupConfig {
  titulo: string;
  mensagem: string;
  icone?: string;
  cor?: string;
}

export interface ManagedItem {
  id: string;
  baseId: string | null;
  status: 'ativo' | 'inativo';
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

/* Renamed to DefaultLocationItem to resolve import errors in other files */
export interface DefaultLocationItem extends ManagedItem {
  nomeLocation: string;
}

/* Renamed to DefaultTransitItem to resolve import errors in other files */
export interface DefaultTransitItem extends ManagedItem {
  nomeTransito: string;
  diasPadrao: number;
}

/* Renamed to DefaultCriticalItem to resolve import errors in other files */
export interface DefaultCriticalItem extends ManagedItem {
  partNumber: string;
}

// Para novos tipos de controle (Solicitação 2)
export interface CustomControlItem extends ManagedItem {
  tipoId: string;
  valores: Record<string, any>;
}

export interface CustomControlType {
  id: string;
  nome: string;
  descricao?: string;
  campos: string[]; // Lista de nomes de campos customizados
  dataCriacao: string;
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
}

export interface LocationRow {
  id: string;
  nomeLocation: string;
  quantidade: number;
  dataMaisAntigo: string; 
  isPadrao?: boolean;
}

export interface TransitRow {
  id: string;
  nomeTransito: string;
  diasPadrao: number;
  quantidade: number;
  dataSaida: string; 
  isPadrao?: boolean;
}

export interface ShelfLifeRow {
  id: string;
  partNumber: string;
  lote: string;
  dataVencimento: string; 
}

export interface CriticalRow {
  id: string;
  partNumber: string;
  lote: string;
  saldoSistema: number; 
  saldoFisico: number;  
  isPadrao?: boolean;
}

export interface OutraAtividade {
  id: string;
  descricao: string;
  tempo: number; 
}

export interface ShiftHandover {
  id: string;
  baseId: string;
  data: string;
  turnoId: string;
  colaboradores: (string | null)[]; 
  tarefasExecutadas: Record<string, string>;
  outrasAtividades: OutraAtividade[];
  locationsData: LocationRow[];
  transitData: TransitRow[];
  shelfLifeData: ShelfLifeRow[];
  criticalData: CriticalRow[];
  informacoesImportantes: string;
  status: 'Rascunho' | 'Finalizado';
  performance: number;
  horasDisponiveis: number;
  horasProduzidas: number;
  criadoEm: string;
  updatedAt: string;
}
