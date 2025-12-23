
import { Base, Category, Task, MeasureType, Control, User, PermissionLevel, DefaultLocationItem, DefaultTransitItem, DefaultCriticalItem } from './types';

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
  { id: 'u1', nome: 'João Silva (POA)', email: 'joao.poa@gol.com.br', bases: ['poa'], permissao: PermissionLevel.OPERACAO, status: 'Ativo', jornadaPadrao: 6 },
  { id: 'u2', nome: 'Maria Santos (POA)', email: 'maria.poa@gol.com.br', bases: ['poa'], permissao: PermissionLevel.LIDER, status: 'Ativo', jornadaPadrao: 6 },
  { id: 'u5', nome: 'Fernanda Lima (GRU)', email: 'fernanda.gru@gol.com.br', bases: ['gru'], permissao: PermissionLevel.GESTOR, status: 'Ativo', jornadaPadrao: 12 },
];

export const CATEGORIES: Category[] = [
  { id: 'cat_recebimento', nome: 'RECEBIMENTO', tipo: 'operacional', ordem: 1, status: 'Ativa' },
  { id: 'cat_fornecer', nome: 'FORNECER', tipo: 'operacional', ordem: 2, status: 'Ativa' },
  { id: 'cat_despacho', nome: 'DESPACHO', tipo: 'operacional', ordem: 3, status: 'Ativa' },
];

export const TASKS: Task[] = [
  // RECEBIMENTO
  { id: 't_rec1', categoriaId: 'cat_recebimento', nome: 'Abrir caixas (Número de caixas abertas)', tipoMedida: MeasureType.QTD, fatorMultiplicador: 5, obrigatoriedade: true, status: 'Ativa', ordem: 1 },
  { id: 't_rec2', categoriaId: 'cat_recebimento', nome: 'Descarregamento de materiais de grande porte (Roda, Freio, IDG, Janela, Chapa de ...', tipoMedida: MeasureType.QTD, fatorMultiplicador: 15, obrigatoriedade: true, status: 'Ativa', ordem: 2 },
  
  // FORNECER
  { id: 't_for1', categoriaId: 'cat_fornecer', nome: 'Retornar Saldo para a Location original (Atendimento FRACIONADO)', tipoMedida: MeasureType.QTD, fatorMultiplicador: 8, obrigatoriedade: true, status: 'Ativa', ordem: 1 },
  { id: 't_for2', categoriaId: 'cat_fornecer', nome: 'Colocação e remoção dos prefixos nas caixas para atendimento no pernoite (Se rea...', tipoMedida: MeasureType.QTD, fatorMultiplicador: 10, obrigatoriedade: true, status: 'Ativa', ordem: 2 },
  { id: 't_for3', categoriaId: 'cat_fornecer', nome: "Pesquisa de PN's para a manutenção (Tempo gasto)", tipoMedida: MeasureType.TEMPO, fatorMultiplicador: 1, obrigatoriedade: true, status: 'Ativa', ordem: 3 },
  { id: 't_for4', categoriaId: 'cat_fornecer', nome: 'Pesquisa de materiais endereçados ao MX/MF (Tempo gasto)', tipoMedida: MeasureType.TEMPO, fatorMultiplicador: 1, obrigatoriedade: true, status: 'Ativa', ordem: 4 },
];

export const DEFAULT_LOCATIONS: DefaultLocationItem[] = [
  { id: 'loc1', nomeLocation: 'ITENS EM "INV"', baseId: null, status: 'ativo', visivel: true },
  { id: 'loc2', nomeLocation: 'ITENS EM "TEMPRARY" (5 DIAS)', baseId: null, status: 'ativo', visivel: true },
  { id: 'loc3', nomeLocation: 'ITENS EM "NDOT" (5 DIAS)', baseId: null, status: 'ativo', visivel: true },
  { id: 'loc4', nomeLocation: 'ITENS EM "RELEASE" (7 DIAS)', baseId: null, status: 'ativo', visivel: true },
  { id: 'loc5', nomeLocation: 'ITENS EM "VRG-QTN" (QUARENTENA 7 DIAS)', baseId: null, status: 'ativo', visivel: true },
];

export const DEFAULT_TRANSITS: DefaultTransitItem[] = [
  { id: 'trans1', nomeTransito: 'AÉREO (5 DIAS)', diasPadrao: 5, baseId: null, status: 'ativo', visivel: true },
  { id: 'trans2', nomeTransito: 'TERRESTRE (20 DIAS)', diasPadrao: 20, baseId: null, status: 'ativo', visivel: true },
];

export const DEFAULT_CRITICALS: DefaultCriticalItem[] = [
  { id: 'crit1', partNumber: 'BPT02197', baseId: null, status: 'ativo', visivel: true },
  { id: 'crit2', partNumber: 'SKYDROLY', baseId: null, status: 'ativo', visivel: true },
  { id: 'crit3', partNumber: 'BPT02380', baseId: null, status: 'ativo', visivel: true },
];

export const CONTROLS: Control[] = [
  {
    id: 'c1',
    baseId: null,
    nome: 'TAT de Recebimento',
    tipo: 'TAT',
    descricao: 'Tempo médio de processamento em horas',
    unidade: 'horas',
    status: 'Ativo',
    alertaConfig: {
      verde: 2,
      amarelo: 5,
      vermelho: 8,
      permitirPopupVerde: false,
      permitirPopupAmarelo: true,
      permitirPopupVermelho: true,
      mensagemVerde: '',
      mensagemAmarelo: 'Atenção: TAT acima do limite!',
      mensagemVermelho: 'Atenção: TAT em nível crítico!'
    }
  }
];
