
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

export type ControlType = 'locations' | 'transito' | 'shelf_life' | 'itens_criticos' | 'TAT';

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
  dataExclusao?: string; // Para soft delete
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
  baseId: string | null; // null = Global
  nome: string;
  tipo: ControlType;
  descricao: string;
  unidade: string;
  alertaConfig: AlertConfig;
  status: 'Ativo' | 'Inativo';
}

// ITENS PADRÃO (Configurados em Gerenciamento)
export interface DefaultLocationItem {
  id: string;
  baseId: string | null;
  nomeLocation: string;
  status: 'ativo' | 'inativo';
}

export interface DefaultTransitItem {
  id: string;
  baseId: string | null;
  nomeTransito: string;
  diasPadrao: number;
  status: 'ativo' | 'inativo';
}

export interface DefaultCriticalItem {
  id: string;
  baseId: string | null;
  partNumber: string;
  status: 'ativo' | 'inativo';
}

// Interfaces para a Execução dos Painéis na Passagem de Serviço
export interface LocationRow {
  id: string;
  nomeLocation: string;
  quantidade: number;
  dataMaisAntigo: string; // DD/MM/AAAA
  isPadrao?: boolean;
}

export interface TransitRow {
  id: string;
  nomeTransito: string;
  diasPadrao: number;
  quantidade: number;
  dataSaida: string; // DD/MM/AAAA
  isPadrao?: boolean;
}

export interface ShelfLifeRow {
  id: string;
  partNumber: string;
  lote: string;
  dataVencimento: string; // DD/MM/AAAA
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
  atualizadoEm: string;
}
