
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

export interface Base {
  id: string;
  nome: string;
  sigla: string;
  jornada: '6h' | '8h' | '12h';
  turnos: number;
  status: 'Ativa' | 'Inativa';
}

export interface User {
  id: string;
  nome: string;
  email: string;
  bases: string[]; // IDs of bases the user can access
  permissao: PermissionLevel;
}

export interface Task {
  id: string;
  nome: string;
  categoriaId: string;
  tipoMedida: MeasureType;
  fatorMultiplicador: number;
  obrigatoriedade: boolean;
}

export interface Category {
  id: string;
  nome: string;
  ordem: number;
}

export interface ShiftHandover {
  id: string;
  data: string;
  turno: number;
  baseId: string;
  colaboradores: string[];
  status: 'Rascunho' | 'Finalizada';
  produzido: number;
  disponivel: number;
  performance: number;
  tat: number;
  itensVencimento: number;
  itensCriticos: number;
  observacoes: string;
  tarefasExecutadas: {
    taskId: string;
    valor: number;
  }[];
}

export interface MonthlyCollection {
  id: string;
  mes: string;
  ano: number;
  baseId: string;
  status: 'Rascunho' | 'Finalizada';
  dados: Record<string, number>;
}
