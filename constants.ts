
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
    metaVermelho: 20,
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
    metaVermelho: 30,
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
  // CATEGORIAS OPERACIONAIS (DIÁRIAS)
  { id: 'cat_recebimento', nome: 'RECEBIMENTO', tipo: 'operacional', ordem: 1, status: 'Ativa' },
  { id: 'cat_fornecer', nome: 'FORNECER', tipo: 'operacional', ordem: 2, status: 'Ativa' },
  { id: 'cat_despacho', nome: 'DESPACHO', tipo: 'operacional', ordem: 3, status: 'Ativa' },
  { id: 'cat_devolucao', nome: 'DEVOLUÇÃO DE MATERIAIS', tipo: 'operacional', ordem: 4, status: 'Ativa' },
  
  // CATEGORIAS MENSAIS (SOLICITAÇÃO 60.0)
  { id: 'cat_m_recebimento', nome: 'RECEBIMENTO', tipo: 'mensal', ordem: 1, status: 'Ativa' },
  { id: 'cat_m_fornecer', nome: 'FORNECER', tipo: 'mensal', ordem: 2, status: 'Ativa' },
  { id: 'cat_m_preservar', nome: 'PRESERVAR / CONTROLAR', tipo: 'mensal', ordem: 3, status: 'Ativa' },
  { id: 'cat_m_armazenar', nome: 'ARMAZENAR', tipo: 'mensal', ordem: 4, status: 'Ativa' },
];

export const TASKS: Task[] = [
  // --- TAREFAS OPERACIONAIS (DIÁRIAS) ---
  { id: 't_rec1', categoriaId: 'cat_recebimento', nome: 'Abrir caixas (Volume total)', tipoMedida: MeasureType.QTD, fatorMultiplicador: 5, obrigatoriedade: true, status: 'Ativa', ordem: 1 },
  { id: 't_rec2', categoriaId: 'cat_recebimento', nome: 'Descarregamento de materiais Grande Porte (Rodas/Freios/IDG)', tipoMedida: MeasureType.QTD, fatorMultiplicador: 15, obrigatoriedade: true, status: 'Ativa', ordem: 2 },
  { id: 't_rec3', categoriaId: 'cat_recebimento', nome: 'Triagem Documental e Conferência Técnica', tipoMedida: MeasureType.QTD, fatorMultiplicador: 10, obrigatoriedade: true, status: 'Ativa', ordem: 3 },
  
  { id: 't_for1', categoriaId: 'cat_fornecer', nome: 'Retornar Saldo para Location (Atendimento Fracionado)', tipoMedida: MeasureType.QTD, fatorMultiplicador: 8, obrigatoriedade: true, status: 'Ativa', ordem: 1 },
  { id: 't_for2', categoriaId: 'cat_fornecer', nome: 'Pesquisa de PN para Manutenção (Tempo Gasto)', tipoMedida: MeasureType.TEMPO, fatorMultiplicador: 1, obrigatoriedade: true, status: 'Ativa', ordem: 2 },
  { id: 't_for3', categoriaId: 'cat_fornecer', nome: 'Atendimento de Requisição AOG / Crítica', tipoMedida: MeasureType.QTD, fatorMultiplicador: 25, obrigatoriedade: true, status: 'Ativa', ordem: 3 },
  
  { id: 't_desp1', categoriaId: 'cat_despacho', nome: 'Embalagem e Proteção de Material Sensível', tipoMedida: MeasureType.QTD, fatorMultiplicador: 12, obrigatoriedade: true, status: 'Ativa', ordem: 1 },
  { id: 't_desp2', categoriaId: 'cat_despacho', nome: 'Criação de Manifesto e Etiquetagem de Trânsito', tipoMedida: MeasureType.QTD, fatorMultiplicador: 7, obrigatoriedade: true, status: 'Ativa', ordem: 2 },

  { id: 't_dev1', categoriaId: 'cat_devolucao', nome: 'Recebimento de Material "Removed" (Core Return)', tipoMedida: MeasureType.QTD, fatorMultiplicador: 10, obrigatoriedade: true, status: 'Ativa', ordem: 1 },
  { id: 't_dev2', categoriaId: 'cat_devolucao', nome: 'Processamento de Material Excedente (Surplus)', tipoMedida: MeasureType.QTD, fatorMultiplicador: 8, obrigatoriedade: true, status: 'Ativa', ordem: 2 },

  // --- TAREFAS MENSAIS (SOLICITAÇÃO 60.0) ---
  
  // CATEGORIA - RECEBIMENTO
  { id: 't_m_rec_conf', categoriaId: 'cat_m_recebimento', nome: 'Conferencia Físico x Sistema (ver indicador de rec.)', tipoMedida: MeasureType.QTD, fatorMultiplicador: 2.56666667, obrigatoriedade: false, status: 'Ativa', ordem: 1 }, // 2:34 = 2.56m
  { id: 't_m_rec_sis', categoriaId: 'cat_m_recebimento', nome: 'Recebimento Sistema (ver indicador de rec.)', tipoMedida: MeasureType.QTD, fatorMultiplicador: 1.28333333, obrigatoriedade: false, status: 'Ativa', ordem: 2 }, // 1:17 = 1.28m
  { id: 't_m_rec_ind', categoriaId: 'cat_m_recebimento', nome: 'Preenchimento do indicador Recebimento', tipoMedida: MeasureType.QTD, fatorMultiplicador: 0.75, obrigatoriedade: false, status: 'Ativa', ordem: 3 }, // 0:45 = 0.75m

  // CATEGORIA - FORNECER
  { id: 't_m_for_analise', categoriaId: 'cat_m_fornecer', nome: 'Analisar P/S gerada (Impressa - ver arquivo 375)', tipoMedida: MeasureType.QTD, fatorMultiplicador: 0.5, obrigatoriedade: false, status: 'Ativa', ordem: 1 }, // 0:30 = 0.5m
  { id: 't_m_for_sep', categoriaId: 'cat_m_fornecer', nome: 'Separação do material (Itens - ver arquivo 375)', tipoMedida: MeasureType.QTD, fatorMultiplicador: 1.6, obrigatoriedade: false, status: 'Ativa', ordem: 2 }, // 1:36 = 1.6m
  { id: 't_m_for_conf_ps', categoriaId: 'cat_m_fornecer', nome: 'Confirmação da P/S (ver arquivo 375)', tipoMedida: MeasureType.QTD, fatorMultiplicador: 1.4, obrigatoriedade: false, status: 'Ativa', ordem: 3 }, // 1:24 = 1.4m
  { id: 't_m_for_del', categoriaId: 'cat_m_fornecer', nome: 'P/S deletada', tipoMedida: MeasureType.QTD, fatorMultiplicador: 1.0, obrigatoriedade: false, status: 'Ativa', ordem: 4 }, // 1:00 = 1.0m
  { id: 't_m_for_zero', categoriaId: 'cat_m_fornecer', nome: 'Itens baixados com saldo ZERO', tipoMedida: MeasureType.QTD, fatorMultiplicador: 0.5, obrigatoriedade: false, status: 'Ativa', ordem: 5 }, // 0:30 = 0.5m
  { id: 't_m_for_canc_sis', categoriaId: 'cat_m_fornecer', nome: 'Cancelar no sistema (P/Ss - ver Amos)', tipoMedida: MeasureType.QTD, fatorMultiplicador: 2.0, obrigatoriedade: false, status: 'Ativa', ordem: 6 }, // 2:00 = 2.0m
  { id: 't_m_for_canc_conf', categoriaId: 'cat_m_fornecer', nome: 'CANCELAR- Conferir Saldo (Itens - ver Amos)', tipoMedida: MeasureType.QTD, fatorMultiplicador: 1.0, obrigatoriedade: false, status: 'Ativa', ordem: 7 }, // 1:00 = 1.0m
  { id: 't_m_for_canc_ins', categoriaId: 'cat_m_fornecer', nome: 'CANCELAR - Inspecionar / Embalar material (Itens ver Amos)', tipoMedida: MeasureType.QTD, fatorMultiplicador: 1.0, obrigatoriedade: false, status: 'Ativa', ordem: 8 }, // 1:00 = 1.0m
  { id: 't_m_for_canc_loc', categoriaId: 'cat_m_fornecer', nome: 'CANCELAR - Colocar material na location (Itens ver Amos)', tipoMedida: MeasureType.QTD, fatorMultiplicador: 1.0, obrigatoriedade: false, status: 'Ativa', ordem: 9 }, // 1:00 = 1.0m

  // CATEGORIA - PRESERVAR / CONTROLAR
  { id: 't_m_pres_mensal', categoriaId: 'cat_m_preservar', nome: 'Check Mensal (soma de controles individuais)', tipoMedida: MeasureType.QTD, fatorMultiplicador: 1200.0, obrigatoriedade: false, status: 'Ativa', ordem: 1 }, // 20:00:00 = 1200m
  { id: 't_m_pres_pex', categoriaId: 'cat_m_preservar', nome: 'Check PEX', tipoMedida: MeasureType.QTD, fatorMultiplicador: 360.0, obrigatoriedade: false, status: 'Ativa', ordem: 2 }, // 6:00:00 = 360m
  { id: 't_m_pres_shelf', categoriaId: 'cat_m_preservar', nome: 'Verificação Shelf Life (itens conferidos)', tipoMedida: MeasureType.QTD, fatorMultiplicador: 3.5, obrigatoriedade: false, status: 'Ativa', ordem: 3 }, // 0:3:30 = 3.5m
  { id: 't_m_pres_fin', categoriaId: 'cat_m_preservar', nome: 'Relatório Financial Reports (uma vez ao mês)', tipoMedida: MeasureType.QTD, fatorMultiplicador: 10.0, obrigatoriedade: false, status: 'Ativa', ordem: 4 }, // 0:10:00 = 10m
  { id: 't_m_pres_ps', categoriaId: 'cat_m_preservar', nome: 'Preenchimento da Passagem de serviço', tipoMedida: MeasureType.QTD, fatorMultiplicador: 10.0, obrigatoriedade: false, status: 'Ativa', ordem: 5 }, // 0:10:00 = 10m

  // CATEGORA ARMAZENAR
  { id: 't_m_arm_loc', categoriaId: 'cat_m_armazenar', nome: 'Verificar no sistema/fisico a Location Adequada (Itens)', tipoMedida: MeasureType.QTD, fatorMultiplicador: 1.0, obrigatoriedade: false, status: 'Ativa', ordem: 1 }, // 0:01:00 = 1.0m
  { id: 't_m_arm_bin', categoriaId: 'cat_m_armazenar', nome: 'Binar Fisicamente o Material (Itens)', tipoMedida: MeasureType.QTD, fatorMultiplicador: 1.0, obrigatoriedade: false, status: 'Ativa', ordem: 2 }, // 0:01:00 = 1.0m
];

export const DEFAULT_LOCATIONS: DefaultLocationItem[] = [
  { id: 'loc1', nomeLocation: 'ITENS EM "INV" (INVENTÁRIO)', baseId: null, status: 'ativo', visivel: true },
  { id: 'loc2', nomeLocation: 'TEMPORARY (LIMITE 5 DIAS)', baseId: null, status: 'ativo', visivel: true },
  { id: 'loc3', nomeLocation: 'NDOT (MATERIAL NÃO ENDEREÇADO)', baseId: null, status: 'ativo', visivel: true },
  { id: 'loc4', nomeLocation: 'RELEASE (AGUARDANDO LIBERAÇÃO)', baseId: null, status: 'ativo', visivel: true },
  { id: 'loc5', nomeLocation: 'VRG-QTN (QUARENTENA TÉCNICA)', baseId: null, status: 'ativo', visivel: true },
];

export const DEFAULT_TRANSITS: DefaultTransitItem[] = [
  { id: 'trans1', nomeTransito: 'AÉREO (GOL LOG / CARGO)', diasPadrao: 5, baseId: null, status: 'ativo', visivel: true },
  { id: 'trans2', nomeTransito: 'TERRESTRE (TRANSP. EXTERNA)', diasPadrao: 20, baseId: null, status: 'ativo', visivel: true },
  { id: 'trans3', nomeTransito: 'COMAT (MATERIAL COMPANHIA)', diasPadrao: 7, baseId: null, status: 'ativo', visivel: true },
];

export const DEFAULT_CRITICALS: DefaultCriticalItem[] = [
  { id: 'crit1', partNumber: 'BPT02197', baseId: null, status: 'ativo', visivel: true },
  { id: 'crit2', partNumber: 'SKYDROLY', baseId: null, status: 'ativo', visivel: true },
  { id: 'crit3', partNumber: 'BPT02380', baseId: null, status: 'ativo', visivel: true },
  { id: 'crit4', partNumber: 'OIL-MOBILE-JET-II', baseId: null, status: 'ativo', visivel: true },
];

export const CONTROLS: Control[] = [
  {
    id: 'c_shelf',
    baseId: null,
    nome: 'Controle de Shelf Life',
    tipo: 'shelf_life',
    descricao: 'Monitoramento de vencimento de químicos e descartáveis',
    unidade: 'dias',
    status: 'Ativo',
    alertaConfig: { verde: 31, amarelo: 15, vermelho: 0, permitirPopupVerde: false, permitirPopupAmarelo: true, permitirPopupVermelho: true, mensagemVerde: '', mensagemAmarelo: '', mensagemVermelho: '' },
    cores: {
      verde: { condicao: 'Valor', operador: '>', valor: 30, habilitado: true },
      amarelo: { condicao: 'Valor', operador: 'entre', valor: 15, valorMax: 30, habilitado: true },
      vermelho: { condicao: 'Valor', operador: '<=', valor: 15, habilitado: true }
    },
    popups: {
      verde: { titulo: 'Validade OK', mensagem: 'Item com X dias de validade remanescente.', habilitado: false },
      amarelo: { titulo: 'Atenção: Vencimento Próximo', mensagem: 'Item vence em X dias. Planejar utilização ou troca.', habilitado: true },
      vermelho: { titulo: 'CRÍTICO: Item Vencendo!', mensagem: 'ALERTA: Item vence em X dias ou já expirou!', habilitado: true }
    }
  },
  {
    id: 'c_loc',
    baseId: null,
    nome: 'Controle de Locations',
    tipo: 'locations',
    descricao: 'Tempo de permanência de itens em áreas temporárias',
    unidade: 'dias',
    status: 'Ativo',
    alertaConfig: { verde: 3, amarelo: 7, vermelho: 8, permitirPopupVerde: false, permitirPopupAmarelo: true, permitirPopupVermelho: true, mensagemVerde: '', mensagemAmarelo: '', mensagemVermelho: '' },
    cores: {
      verde: { condicao: 'Valor', operador: '<=', valor: 3, habilitado: true },
      amarelo: { condicao: 'Valor', operador: 'entre', valor: 4, valorMax: 7, habilitado: true },
      vermelho: { condicao: 'Valor', operador: '>', valor: 7, habilitado: true }
    },
    popups: {
      verde: { titulo: 'Fluxo Normal', mensagem: 'Item processado em X dias.', habilitado: false },
      amarelo: { titulo: 'Atenção: Gargalo em Location', mensagem: 'Item parado há X dias nesta localização. Verificar pendência.', habilitado: true },
      vermelho: { titulo: 'CRÍTICO: Material Estagnado', mensagem: 'Material parado há X dias. Requer ação imediata de destinação!', habilitado: true }
    }
  },
  {
    id: 'c_trans',
    baseId: null,
    nome: 'Monitoramento de Trânsito',
    tipo: 'transito',
    descricao: 'Monitoramento de TAT (Turn Around Time) Logístico',
    unidade: 'dias',
    status: 'Ativo',
    alertaConfig: { verde: 5, amarelo: 15, vermelho: 16, permitirPopupVerde: false, permitirPopupAmarelo: true, permitirPopupVermelho: true, mensagemVerde: '', mensagemAmarelo: '', mensagemVermelho: '' },
    cores: {
      verde: { condicao: 'Valor', operador: '<=', valor: 5, habilitado: true },
      amarelo: { condicao: 'Valor', operador: 'entre', valor: 6, valorMax: 15, habilitado: true },
      vermelho: { condicao: 'Valor', operador: '>', valor: 15, habilitado: true }
    },
    popups: {
      verde: { titulo: 'Trânsito OK', mensagem: 'Remessa em deslocamento há X dias.', habilitado: false },
      amarelo: { titulo: 'Atenção: Trânsito Lento', mensagem: 'Remessa em trânsito há X dias. Monitorar chegada.', habilitado: true },
      vermelho: { titulo: 'CRÍTICO: Atraso Logístico', mensagem: 'Remessa em trânsito há X dias. Acionar transportadora!', habilitado: true }
    }
  },
  {
    id: 'c_crit',
    baseId: null,
    nome: 'Acuracidade de Saldo',
    tipo: 'itens_criticos',
    descricao: 'Divergência entre Físico e Sistema (Tolerance Zero)',
    unidade: 'unidade',
    status: 'Ativo',
    alertaConfig: { verde: 0, amarelo: 1, vermelho: 2, permitirPopupVerde: false, permitirPopupAmarelo: true, permitirPopupVermelho: true, mensagemVerde: '', mensagemAmarelo: '', mensagemVermelho: '' },
    cores: {
      verde: { condicao: 'Valor', operador: '=', valor: 0, habilitado: true },
      amarelo: { condicao: 'Valor', operador: '!=', valor: 0, habilitado: false }, // Desativado para forçar o vermelho em qualquer erro
      vermelho: { condicao: 'Valor', operador: '!=', valor: 0, habilitado: true }
    },
    popups: {
      verde: { titulo: 'Acuracidade 100%', mensagem: 'Saldos físico e sistema conferem.', habilitado: false },
      amarelo: { titulo: 'Divergência Detectada', mensagem: 'Diferença de X unidades. Verificar registro.', habilitado: true },
      vermelho: { titulo: 'ERRO DE SALDO CRÍTICO', mensagem: 'Divergência de X unidades. Requer inventário e correção imediata!', habilitado: true }
    }
  }
];
