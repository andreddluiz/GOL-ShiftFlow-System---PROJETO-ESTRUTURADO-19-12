
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

export interface Shift {
  id: string;
  numero: number;
  horaInicio: string; // HH:MM
  horaFim: string; // HH:MM
}

export interface Base {
  id: string;
  nome: string;
  sigla: string;
  jornada: '6h' | '8h' | '12h';
  numeroTurnos: number;
  turnos: Shift[];
  status: 'Ativa' | 'Inativa';
  // Novos campos para metas customizadas
  metaVerde: number; // Ex: 70
  metaAmarelo: number; // Ex: 40
}

export interface User {
  id: string;
  nome: string;
  email: string;
  loginRE?: string;
  bases: string[]; // IDs das bases
  permissao: PermissionLevel;
  status: 'Ativo' | 'Inativo';
  jornadaPadrao: number; // em horas (6, 8, 12) - Tornado obrigatório
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
  fatorMultiplicador: number; // em minutos
  obrigatoriedade: boolean;
  status: 'Ativa' | 'Inativa';
  ordem: number;
  baseId?: string | null;
}

export interface AlertConfig {
  verde: number;
  amarelo: number;
  vermelho: number;
  permitirPopup: boolean;
  mensagemPopup: string;
  tipoPopup: 'aviso' | 'erro' | 'info';
}

export interface Control {
  id: string;
  nome: string;
  tipo: 'TAT' | 'Vencimento' | 'Crítico' | 'Outro';
  descricao: string;
  unidade: string;
  alertaConfig: AlertConfig;
  status: 'Ativo' | 'Inativo';
}

export interface OutraAtividade {
  id: string;
  descricao: string;
  tempo: number; // em minutos
}

export interface ControleExecutado {
  id: string;
  controleId: string;
  valor: number; // dias ou horas
}

export interface ShiftHandover {
  id: string;
  baseId: string;
  data: string;
  turnoId: string;
  colaboradores: (string | null)[]; 
  tarefasExecutadas: Record<string, number>;
  outrasAtividades: OutraAtividade[];
  controles: ControleExecutado[];
  informacoesImportantes: string;
  status: 'Rascunho' | 'Finalizado';
  performance: number;
  horasDisponiveis: number;
  horasProduzidas: number;
  criadoEm: string;
  atualizadoEm: string;
}
