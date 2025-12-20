
import { Base, Category, Task, MeasureType, Control, User, PermissionLevel } from './types';

export const BASES: Base[] = [
  { 
    id: 'poa', 
    nome: 'Porto Alegre', 
    sigla: 'POA', 
    jornada: '6h', 
    numeroTurnos: 4, 
    status: 'Ativa',
    metaVerde: 70,
    metaAmarelo: 40,
    turnos: [
      { id: '1', numero: 1, horaInicio: '06:00', horaFim: '12:00' },
      { id: '2', numero: 2, horaInicio: '12:00', horaFim: '18:00' },
      { id: '3', numero: 3, horaInicio: '18:00', horaFim: '00:00' },
      { id: '4', numero: 4, horaInicio: '00:00', horaFim: '06:00' }
    ]
  },
  { 
    id: 'gru', 
    nome: 'Guarulhos', 
    sigla: 'GRU', 
    jornada: '12h', 
    numeroTurnos: 2, 
    status: 'Ativa', 
    metaVerde: 85,
    metaAmarelo: 50,
    turnos: [
      { id: 'g1', numero: 1, horaInicio: '07:00', horaFim: '19:00' },
      { id: 'g2', numero: 2, horaInicio: '19:00', horaFim: '07:00' }
    ] 
  },
];

export const USERS: User[] = [
  // Usuários POA
  { id: 'u1', nome: 'João Silva (POA)', email: 'joao.poa@gol.com.br', bases: ['poa'], permissao: PermissionLevel.OPERACAO, status: 'Ativo', jornadaPadrao: 6 },
  { id: 'u2', nome: 'Maria Santos (POA)', email: 'maria.poa@gol.com.br', bases: ['poa'], permissao: PermissionLevel.LIDER, status: 'Ativo', jornadaPadrao: 6 },
  { id: 'u3', nome: 'Ricardo Souza (POA)', email: 'ricardo.poa@gol.com.br', bases: ['poa'], permissao: PermissionLevel.OPERACAO, status: 'Ativo', jornadaPadrao: 8 },
  
  // Usuários GRU
  { id: 'u4', nome: 'Carlos Oliveira (GRU)', email: 'carlos.gru@gol.com.br', bases: ['gru'], permissao: PermissionLevel.OPERACAO, status: 'Ativo', jornadaPadrao: 12 },
  { id: 'u5', nome: 'Fernanda Lima (GRU)', email: 'fernanda.gru@gol.com.br', bases: ['gru'], permissao: PermissionLevel.GESTOR, status: 'Ativo', jornadaPadrao: 12 },
  { id: 'u6', nome: 'Bruno Costa (GRU)', email: 'bruno.gru@gol.com.br', bases: ['gru'], permissao: PermissionLevel.OPERACAO, status: 'Ativo', jornadaPadrao: 8 },
];

export const CATEGORIES: Category[] = [
  { id: 'cat1', nome: 'RECEBIMENTO', tipo: 'operacional', ordem: 1, status: 'Ativa' },
  { id: 'cat2', nome: 'DESPACHO', tipo: 'operacional', ordem: 2, status: 'Ativa' },
];

export const TASKS: Task[] = [
  { id: 't1', categoriaId: 'cat1', nome: 'Receber Carga', tipoMedida: MeasureType.QTD, fatorMultiplicador: 5, obrigatoriedade: true, status: 'Ativa', ordem: 1 },
  { id: 't2', categoriaId: 'cat1', nome: 'Conferir Docs', tipoMedida: MeasureType.QTD, fatorMultiplicador: 3, obrigatoriedade: true, status: 'Ativa', ordem: 2 },
  { id: 't3', categoriaId: 'cat2', nome: 'Carregamento TECA', tipoMedida: MeasureType.TEMPO, fatorMultiplicador: 1, obrigatoriedade: false, status: 'Ativa', ordem: 1 },
];

export const CONTROLS: Control[] = [
  {
    id: 'c1',
    nome: 'TAT de Recebimento',
    tipo: 'TAT',
    descricao: 'Tempo médio de processamento em horas',
    unidade: 'horas',
    status: 'Ativo',
    alertaConfig: {
      verde: 2,
      amarelo: 5,
      vermelho: 8,
      permitirPopup: true,
      mensagemPopup: 'Atenção: TAT acima do limite!',
      tipoPopup: 'aviso'
    }
  }
];
