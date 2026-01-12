
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
    jornada: '07:12h', 
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
  { id: 'u-admin', nome: 'Administrador Geral', email: 'admin@gol.com', bases: ['poa', 'gru'], permissao: PermissionLevel.ADMIN, status: 'Ativo', jornadaPadrao: 8 },
  { id: 'u-lider', nome: 'Líder POA', email: 'lider.poa@gol.com', bases: ['poa', 'gru'], permissao: PermissionLevel.LIDER, status: 'Ativo', jornadaPadrao: 6 },
  { id: 'u-analista', nome: 'Analista de Dados', email: 'analista@gol.com', bases: ['poa', 'gru'], permissao: PermissionLevel.ANALISTA, status: 'Ativo', jornadaPadrao: 8 },
  { id: 'u-operacional', nome: 'Operador de Base', email: 'operacional@gol.com', bases: ['poa', 'gru'], permissao: PermissionLevel.OPERACAO, status: 'Ativo', jornadaPadrao: 6 },
];

export const CATEGORIES: Category[] = [
  { id: 'cat_receber', nome: 'RECEBER', tipo: 'operacional', exibicao: 'lista', ordem: 1, status: 'Ativa' },
  { id: 'cat_fornecer', nome: 'FORNECER', tipo: 'operacional', exibicao: 'lista', ordem: 2, status: 'Ativa' },
  { id: 'cat_expedir', nome: 'EXPEDIR', tipo: 'operacional', exibicao: 'lista', ordem: 3, status: 'Ativa' },
  { id: 'cat_logistica', nome: 'LOGÍSTICA', tipo: 'operacional', exibicao: 'lista', ordem: 4, status: 'Ativa' },
  { id: 'cat_preservar', nome: 'PRESERVAR / CONTROLAR', tipo: 'operacional', exibicao: 'lista', ordem: 5, status: 'Ativa' },
  { id: 'cat_nao_operacional', nome: 'TAREFAS NÃO OPERACIONAIS', tipo: 'operacional', exibicao: 'suspensa', ordem: 6, status: 'Ativa' },
  { id: 'cat_outras', nome: 'OUTRAS TAREFAS', tipo: 'operacional', exibicao: 'suspensa', ordem: 7, status: 'Ativa' },
  
  { id: 'cat_m_recebimento', nome: 'RECEBER', tipo: 'mensal', exibicao: 'lista', ordem: 1, status: 'Ativa' },
  { id: 'cat_m_fornecer', nome: 'FORNECER', tipo: 'mensal', exibicao: 'lista', ordem: 2, status: 'Ativa' },
  { id: 'cat_m_preservar', nome: 'PRESERVAR / CONTROLAR', tipo: 'mensal', exibicao: 'lista', ordem: 3, status: 'Ativa' },
  { id: 'cat_m_armazenar', nome: 'ARMAZENAR', tipo: 'mensal', exibicao: 'lista', ordem: 4, status: 'Ativa' },
];

export const TASKS: Task[] = [
  // --- RECEBER ---
  { id: 'op_rec_1', categoriaId: 'cat_receber', nome: 'Abrir caixas', tipoMedida: MeasureType.QTD, fatorMultiplicador: 1, obrigatoriedade: false, status: 'Ativa', ordem: 1 },
  { id: 'op_rec_2', categoriaId: 'cat_receber', nome: 'Descarregar materiais de grande porte (Roda, Freio, IDG, Janela, Chapa de porão, HMU, Cilindros)', tipoMedida: MeasureType.QTD, fatorMultiplicador: 13, obrigatoriedade: false, status: 'Ativa', ordem: 2 },
  { id: 'op_rec_3', categoriaId: 'cat_receber', nome: 'Abrir caixas (Número de caixas abertas) DTX', tipoMedida: MeasureType.QTD, fatorMultiplicador: 1, obrigatoriedade: false, status: 'Ativa', ordem: 3 },
  { id: 'op_rec_4', categoriaId: 'cat_receber', nome: 'Descarregar materiais de grande porte (Slat, Janela, Chapa de porão) DTX', tipoMedida: MeasureType.QTD, fatorMultiplicador: 13, obrigatoriedade: false, status: 'Ativa', ordem: 4 },

  // --- FORNECER ---
  { id: 'op_for_1', categoriaId: 'cat_fornecer', nome: 'Retornar Saldo para a Location original (Atendimento FRACIONADO)', tipoMedida: MeasureType.QTD, fatorMultiplicador: 1, obrigatoriedade: false, status: 'Ativa', ordem: 1 },
  { id: 'op_for_2', categoriaId: 'cat_fornecer', nome: 'Colocar e retirar prefixos nas caixas para atendimento no pernoite', tipoMedida: MeasureType.QTD, fatorMultiplicador: 5, obrigatoriedade: false, status: 'Ativa', ordem: 2 },
  { id: 'op_for_3', categoriaId: 'cat_fornecer', nome: "Pesquisar de PN's para a manutenção", tipoMedida: MeasureType.TEMPO, fatorMultiplicador: 0, obrigatoriedade: false, status: 'Ativa', ordem: 3 },
  { id: 'op_for_4', categoriaId: 'cat_fornecer', nome: 'Pesquisa de materiais endereçados ao MX/MF', tipoMedida: MeasureType.TEMPO, fatorMultiplicador: 0, obrigatoriedade: false, status: 'Ativa', ordem: 4 },

  // --- EXPEDIR ---
  { id: 'op_exp_1', categoriaId: 'cat_expedir', nome: 'Gerar/Cancelar AWB', tipoMedida: MeasureType.QTD, fatorMultiplicador: 3, obrigatoriedade: false, status: 'Ativa', ordem: 1 },
  { id: 'op_exp_2', categoriaId: 'cat_expedir', nome: 'Preparar material DG (Consulta manual, Shipper declararion, Autorização, Declar. Exped.)', tipoMedida: MeasureType.QTD, fatorMultiplicador: 30, obrigatoriedade: false, status: 'Ativa', ordem: 2 },
  { id: 'op_exp_3', categoriaId: 'cat_expedir', nome: 'Embalar', tipoMedida: MeasureType.QTD, fatorMultiplicador: 2.5, obrigatoriedade: false, status: 'Ativa', ordem: 3 },
  { id: 'op_exp_4', categoriaId: 'cat_expedir', nome: 'Carregar materiais de grande porte (Roda, Freio, IDG, Janela, Chapa de porão, HMU, Cilindros)', tipoMedida: MeasureType.QTD, fatorMultiplicador: 15, obrigatoriedade: false, status: 'Ativa', ordem: 4 },
  { id: 'op_exp_5', categoriaId: 'cat_expedir', nome: 'Gerar TO (scrap, item U/S CR ou R)', tipoMedida: MeasureType.QTD, fatorMultiplicador: 5, obrigatoriedade: false, status: 'Ativa', ordem: 5 },
  { id: 'op_exp_6', categoriaId: 'cat_expedir', nome: "Completar T'O, NF Amos (Inserir dados, book, webdrive e imprimir)", tipoMedida: MeasureType.QTD, fatorMultiplicador: 3, obrigatoriedade: false, status: 'Ativa', ordem: 6 },
  { id: 'op_exp_7', categoriaId: 'cat_expedir', nome: 'Embalar (Número de caixas embaladas) DTX', tipoMedida: MeasureType.QTD, fatorMultiplicador: 5, obrigatoriedade: false, status: 'Ativa', ordem: 7 },
  { id: 'op_exp_8', categoriaId: 'cat_expedir', nome: 'Carregar materiais de grande porte (Slat, Janela, Chapa de porão) DTX', tipoMedida: MeasureType.QTD, fatorMultiplicador: 13, obrigatoriedade: false, status: 'Ativa', ordem: 8 },
  { id: 'op_exp_9', categoriaId: 'cat_expedir', nome: 'Organizar processo DTX - Planilha de valores NF , chamado NF , Enviar email NF, protocolo, Arquivar NF - DTX', tipoMedida: MeasureType.TEMPO, fatorMultiplicador: 0, obrigatoriedade: false, status: 'Ativa', ordem: 9 },
  { id: 'op_exp_10', categoriaId: 'cat_expedir', nome: 'PC - Recebimento do componente, conferir documento e movimentação no AMOS (150/1206 e 1335)', tipoMedida: MeasureType.QTD, fatorMultiplicador: 2, obrigatoriedade: false, status: 'Ativa', ordem: 10 },
  { id: 'op_exp_11', categoriaId: 'cat_expedir', nome: 'PC - Preencher Reminder MX', tipoMedida: MeasureType.QTD, fatorMultiplicador: 1, obrigatoriedade: false, status: 'Ativa', ordem: 11 },
  { id: 'op_exp_12', categoriaId: 'cat_expedir', nome: "PC - Emitir NF Manual (Número de NF's emitidas para materiais U/S S/V)", tipoMedida: MeasureType.QTD, fatorMultiplicador: 5, obrigatoriedade: false, status: 'Ativa', ordem: 12 },
  { id: 'op_exp_13', categoriaId: 'cat_expedir', nome: 'TERRESTRE - Envio de Email (Notas fiscais)', tipoMedida: MeasureType.QTD, fatorMultiplicador: 5, obrigatoriedade: false, status: 'Ativa', ordem: 13 },
  { id: 'op_exp_14', categoriaId: 'cat_expedir', nome: 'TERRESTRE - Entrega/recebimento de material do terrestre', tipoMedida: MeasureType.QTD, fatorMultiplicador: 60, obrigatoriedade: false, status: 'Ativa', ordem: 14 },
  { id: 'op_exp_15', categoriaId: 'cat_expedir', nome: 'TERRESTRE - Tirar foto e enviar', tipoMedida: MeasureType.QTD, fatorMultiplicador: 5, obrigatoriedade: false, status: 'Ativa', ordem: 15 },

  // --- LOGÍSTICA ---
  { id: 'op_log_1', categoriaId: 'cat_logistica', nome: 'Embarcar de AOG / IAOG', tipoMedida: MeasureType.QTD, fatorMultiplicador: 21, obrigatoriedade: false, status: 'Ativa', ordem: 1 },
  { id: 'op_log_2', categoriaId: 'cat_logistica', nome: 'Resgatar AOG / IAOG', tipoMedida: MeasureType.QTD, fatorMultiplicador: 21.933, obrigatoriedade: false, status: 'Ativa', ordem: 2 },
  { id: 'op_log_3', categoriaId: 'cat_logistica', nome: "Resgatar MTL's na Gollog", tipoMedida: MeasureType.QTD, fatorMultiplicador: 35, obrigatoriedade: false, status: 'Ativa', ordem: 3 },
  { id: 'op_log_4', categoriaId: 'cat_logistica', nome: 'Entregar de material para MF na pista', tipoMedida: MeasureType.QTD, fatorMultiplicador: 18.217, obrigatoriedade: false, status: 'Ativa', ordem: 4 },
  { id: 'op_log_5', categoriaId: 'cat_logistica', nome: 'Abastecer viatura', tipoMedida: MeasureType.QTD, fatorMultiplicador: 40, obrigatoriedade: false, status: 'Ativa', ordem: 5 },
  { id: 'op_log_6', categoriaId: 'cat_logistica', nome: 'Descartar resíduos no lonado (Scrap)', tipoMedida: MeasureType.TEMPO, fatorMultiplicador: 0, obrigatoriedade: false, status: 'Ativa', ordem: 6 },
  { id: 'op_log_7', categoriaId: 'cat_logistica', nome: 'Entregar/coletar de materiais DTX', tipoMedida: MeasureType.TEMPO, fatorMultiplicador: 0, obrigatoriedade: false, status: 'Ativa', ordem: 7 },

  // --- PRESERVAR / CONTROLAR ---
  { id: 'op_pre_1', categoriaId: 'cat_preservar', nome: 'Drenar Desumidificador / Preencher Controle Umidade e temperatura', tipoMedida: MeasureType.QTD, fatorMultiplicador: 1, obrigatoriedade: false, status: 'Ativa', ordem: 1 },
  { id: 'op_pre_2', categoriaId: 'cat_preservar', nome: 'Verificar 100%', tipoMedida: MeasureType.QTD, fatorMultiplicador: 1, obrigatoriedade: false, status: 'Ativa', ordem: 2 },
  { id: 'op_pre_3', categoriaId: 'cat_preservar', nome: "SCRAP's realizados", tipoMedida: MeasureType.QTD, fatorMultiplicador: 5, obrigatoriedade: false, status: 'Ativa', ordem: 3 },
  { id: 'op_pre_4', categoriaId: 'cat_preservar', nome: 'Organizar estoque (Troca de lixos, embalagens guardadas, área desobstruída)', tipoMedida: MeasureType.QTD, fatorMultiplicador: 5, obrigatoriedade: false, status: 'Ativa', ordem: 4 },
  { id: 'op_pre_5', categoriaId: 'cat_preservar', nome: 'Preparar relatório Indicador diário', tipoMedida: MeasureType.QTD, fatorMultiplicador: 20, obrigatoriedade: false, status: 'Ativa', ordem: 5 },
  { id: 'op_pre_6', categoriaId: 'cat_preservar', nome: 'Preencher Passagem de serviço', tipoMedida: MeasureType.QTD, fatorMultiplicador: 10, obrigatoriedade: false, status: 'Ativa', ordem: 6 },
  { id: 'op_pre_7', categoriaId: 'cat_preservar', nome: 'Rebinar, Trocar identificações ou embalagens e limpar locations', tipoMedida: MeasureType.TEMPO, fatorMultiplicador: 0, obrigatoriedade: false, status: 'Ativa', ordem: 7 },
  { id: 'op_pre_8', categoriaId: 'cat_preservar', nome: 'Organizar container papelaria, recortes para uso em calota', tipoMedida: MeasureType.TEMPO, fatorMultiplicador: 0, obrigatoriedade: false, status: 'Ativa', ordem: 8 },
  { id: 'op_pre_9', categoriaId: 'cat_preservar', nome: 'Emitir nova Label / Corrigir documentos', tipoMedida: MeasureType.TEMPO, fatorMultiplicador: 0, obrigatoriedade: false, status: 'Ativa', ordem: 9 },
  { id: 'op_pre_10', categoriaId: 'cat_preservar', nome: 'Realizar Contagem Cíclica', tipoMedida: MeasureType.TEMPO, fatorMultiplicador: 0, obrigatoriedade: false, status: 'Ativa', ordem: 10 },
  { id: 'op_pre_11', categoriaId: 'cat_preservar', nome: 'Ajustar Fechamento do mês ou alterações na Passagem de serviço/Indicadores bases', tipoMedida: MeasureType.TEMPO, fatorMultiplicador: 0, obrigatoriedade: false, status: 'Ativa', ordem: 11 },
  { id: 'op_pre_12', categoriaId: 'cat_preservar', nome: 'Abrir/Fechar Technical Assistance', tipoMedida: MeasureType.TEMPO, fatorMultiplicador: 0, obrigatoriedade: false, status: 'Ativa', ordem: 12 },
  { id: 'op_pre_13', categoriaId: 'cat_preservar', nome: 'Quarentenar material', tipoMedida: MeasureType.TEMPO, fatorMultiplicador: 0, obrigatoriedade: false, status: 'Ativa', ordem: 13 },
  { id: 'op_pre_14', categoriaId: 'cat_preservar', nome: 'Análise de temperatura para materiais controlados', tipoMedida: MeasureType.TEMPO, fatorMultiplicador: 0, obrigatoriedade: false, status: 'Ativa', ordem: 14 },
  { id: 'op_pre_15', categoriaId: 'cat_preservar', nome: 'Atualizar/Alterar forms mês seguinte - Controle de temperatura', tipoMedida: MeasureType.TEMPO, fatorMultiplicador: 0, obrigatoriedade: false, status: 'Ativa', ordem: 15 },
  { id: 'op_pre_16', categoriaId: 'cat_preservar', nome: 'Realizar rotinas itens pré-auditoria', tipoMedida: MeasureType.TEMPO, fatorMultiplicador: 0, obrigatoriedade: false, status: 'Ativa', ordem: 16 },
  { id: 'op_pre_17', categoriaId: 'cat_preservar', nome: 'Ler e analisar processos e procedimentos', tipoMedida: MeasureType.TEMPO, fatorMultiplicador: 0, obrigatoriedade: false, status: 'Ativa', ordem: 17 },
  { id: 'op_pre_18', categoriaId: 'cat_preservar', nome: 'Analisar e movimentação de materiais NDOT 313', tipoMedida: MeasureType.TEMPO, fatorMultiplicador: 0, obrigatoriedade: false, status: 'Ativa', ordem: 18 },

  // --- TAREFAS NÃO OPERACIONAIS ---
  { id: 'op_nop_1', categoriaId: 'cat_nao_operacional', nome: 'Ler/Responder e-mails', tipoMedida: MeasureType.QTD, fatorMultiplicador: 1, obrigatoriedade: false, status: 'Ativa', ordem: 1 },
  { id: 'op_nop_2', categoriaId: 'cat_nao_operacional', nome: 'Efetuar Leitura GOLDOCS / cursos e-learning', tipoMedida: MeasureType.TEMPO, fatorMultiplicador: 0, obrigatoriedade: false, status: 'Ativa', ordem: 2 },
  { id: 'op_nop_3', categoriaId: 'cat_nao_operacional', nome: 'Acompanhar predial/auditoria', tipoMedida: MeasureType.TEMPO, fatorMultiplicador: 0, obrigatoriedade: false, status: 'Ativa', ordem: 3 },
  { id: 'op_nop_4', categoriaId: 'cat_nao_operacional', nome: 'Ir a ADM aeroportuária/PA', tipoMedida: MeasureType.TEMPO, fatorMultiplicador: 0, obrigatoriedade: false, status: 'Ativa', ordem: 4 },
  { id: 'op_nop_5', categoriaId: 'cat_nao_operacional', nome: 'Ir ao credenciamento', tipoMedida: MeasureType.TEMPO, fatorMultiplicador: 0, obrigatoriedade: false, status: 'Ativa', ordem: 5 },
  { id: 'op_nop_6', categoriaId: 'cat_nao_operacional', nome: 'Fazer pedido de material', tipoMedida: MeasureType.TEMPO, fatorMultiplicador: 0, obrigatoriedade: false, status: 'Ativa', ordem: 6 },
  { id: 'op_nop_7', categoriaId: 'cat_nao_operacional', nome: 'Teams - Leitura de comunicados, informações ou Participação em reuniões', tipoMedida: MeasureType.TEMPO, fatorMultiplicador: 0, obrigatoriedade: false, status: 'Ativa', ordem: 7 },
  { id: 'op_nop_8', categoriaId: 'cat_nao_operacional', nome: 'Realizar Logística colaboradores C1, C6, C7', tipoMedida: MeasureType.TEMPO, fatorMultiplicador: 0, obrigatoriedade: false, status: 'Ativa', ordem: 8 },

  // --- OUTRAS TAREFAS ---
  { id: 'out_1', categoriaId: 'cat_outras', nome: 'Abrir chamados', tipoMedida: MeasureType.TEMPO, fatorMultiplicador: 0, obrigatoriedade: false, status: 'Ativa', ordem: 1 },
  { id: 'out_2', categoriaId: 'cat_outras', nome: 'Auxiliar ao PA para envio de uniformes / volumes do T.I', tipoMedida: MeasureType.TEMPO, fatorMultiplicador: 0, obrigatoriedade: false, status: 'Ativa', ordem: 2 },
  { id: 'out_3', categoriaId: 'cat_outras', nome: 'Ajustar e conferir ponto', tipoMedida: MeasureType.TEMPO, fatorMultiplicador: 0, obrigatoriedade: false, status: 'Ativa', ordem: 3 },
  { id: 'out_4', categoriaId: 'cat_outras', nome: 'Ajustar impressora', tipoMedida: MeasureType.TEMPO, fatorMultiplicador: 0, obrigatoriedade: false, status: 'Ativa', ordem: 4 },
  { id: 'out_5', categoriaId: 'cat_outras', nome: 'Conferir planilha ou solicitação de cursos', tipoMedida: MeasureType.TEMPO, fatorMultiplicador: 0, obrigatoriedade: false, status: 'Ativa', ordem: 5 },
  { id: 'out_6', categoriaId: 'cat_outras', nome: 'Contatar RP, GOLLOG, DOV, AOGDESK, outras bases e setores', tipoMedida: MeasureType.TEMPO, fatorMultiplicador: 0, obrigatoriedade: false, status: 'Ativa', ordem: 6 },
  { id: 'out_7', categoriaId: 'cat_outras', nome: 'Drenar fluídos dos componentes', tipoMedida: MeasureType.TEMPO, fatorMultiplicador: 0, obrigatoriedade: false, status: 'Ativa', ordem: 7 },
  { id: 'out_8', categoriaId: 'cat_outras', nome: 'Desenvolver PDI', tipoMedida: MeasureType.TEMPO, fatorMultiplicador: 0, obrigatoriedade: false, status: 'Ativa', ordem: 8 },
  { id: 'out_9', categoriaId: 'cat_outras', nome: 'Desenvolver projetos GOL', tipoMedida: MeasureType.TEMPO, fatorMultiplicador: 0, obrigatoriedade: false, status: 'Ativa', ordem: 9 },
  { id: 'out_10', categoriaId: 'cat_outras', nome: 'Escanear documentos', tipoMedida: MeasureType.TEMPO, fatorMultiplicador: 0, obrigatoriedade: false, status: 'Ativa', ordem: 10 },
  { id: 'out_11', categoriaId: 'cat_outras', nome: "Imprimir TAG'S para etiquetas COMAT", tipoMedida: MeasureType.TEMPO, fatorMultiplicador: 0, obrigatoriedade: false, status: 'Ativa', ordem: 11 },
  { id: 'out_12', categoriaId: 'cat_outras', nome: 'Analisar e Atualizar Indicadores bases', tipoMedida: MeasureType.TEMPO, fatorMultiplicador: 0, obrigatoriedade: false, status: 'Ativa', ordem: 12 },
  { id: 'out_13', categoriaId: 'cat_outras', nome: 'realizar Manutenção viatura', tipoMedida: MeasureType.TEMPO, fatorMultiplicador: 0, obrigatoriedade: false, status: 'Ativa', ordem: 13 },
  { id: 'out_14', categoriaId: 'cat_outras', nome: 'Organizar e Limpar e-mail corporativo', tipoMedida: MeasureType.TEMPO, fatorMultiplicador: 0, obrigatoriedade: false, status: 'Ativa', ordem: 14 },
  { id: 'out_15', categoriaId: 'cat_outras', nome: 'Criar ou alterar escala', tipoMedida: MeasureType.TEMPO, fatorMultiplicador: 0, obrigatoriedade: false, status: 'Ativa', ordem: 15 },
  { id: 'out_16', categoriaId: 'cat_outras', nome: 'Realizar Reparos estruturais da base', tipoMedida: MeasureType.TEMPO, fatorMultiplicador: 0, obrigatoriedade: false, status: 'Ativa', ordem: 16 },
  { id: 'out_17', categoriaId: 'cat_outras', nome: 'Participar de Reuniões', tipoMedida: MeasureType.TEMPO, fatorMultiplicador: 0, obrigatoriedade: false, status: 'Ativa', ordem: 17 },
  { id: 'out_18', categoriaId: 'cat_outras', nome: 'Realizar SAFETY MOMENT', tipoMedida: MeasureType.TEMPO, fatorMultiplicador: 0, obrigatoriedade: false, status: 'Ativa', ordem: 18 },
  { id: 'out_19', categoriaId: 'cat_outras', nome: 'Solicitar passagem e hospedagem, prestação de contas', tipoMedida: MeasureType.TEMPO, fatorMultiplicador: 0, obrigatoriedade: false, status: 'Ativa', ordem: 19 },

  // --- TAREFAS MENSAIS ---
  { id: 't_m_rec_conf', categoriaId: 'cat_m_recebimento', nome: 'Conferencia Físico x Sistema (ver indicador de rec.)', tipoMedida: MeasureType.QTD, fatorMultiplicador: 2.56666667, obrigatoriedade: false, status: 'Ativa', ordem: 1 },
  { id: 't_m_rec_sis', categoriaId: 'cat_m_recebimento', nome: 'Recebimento Sistema (ver indicador de rec.)', tipoMedida: MeasureType.QTD, fatorMultiplicador: 1.28333333, obrigatoriedade: false, status: 'Ativa', ordem: 2 },
  { id: 't_m_rec_ind', categoriaId: 'cat_m_recebimento', nome: 'Preenchimento do indicador Recebimento', tipoMedida: MeasureType.QTD, fatorMultiplicador: 0.75, obrigatoriedade: false, status: 'Ativa', ordem: 3 },

  { id: 't_m_for_analise', categoriaId: 'cat_m_fornecer', nome: 'Analisar P/S gerada (Impressa - ver arquivo 375)', tipoMedida: MeasureType.QTD, fatorMultiplicador: 0.5, obrigatoriedade: false, status: 'Ativa', ordem: 1 },
  { id: 't_m_for_sep', categoriaId: 'cat_m_fornecer', nome: 'Separação do material (Itens - ver arquivo 375)', tipoMedida: MeasureType.QTD, fatorMultiplicador: 1.6, obrigatoriedade: false, status: 'Ativa', ordem: 2 },
  { id: 't_m_for_conf_ps', categoriaId: 'cat_m_fornecer', nome: 'Confirmação da P/S (ver arquivo 375)', tipoMedida: MeasureType.QTD, fatorMultiplicador: 1.4, obrigatoriedade: false, status: 'Ativa', ordem: 3 },
  { id: 't_m_for_del', categoriaId: 'cat_m_fornecer', nome: 'P/S deletada', tipoMedida: MeasureType.QTD, fatorMultiplicador: 1.0, obrigatoriedade: false, status: 'Ativa', ordem: 4 },
  { id: 't_m_for_zero', categoriaId: 'cat_m_fornecer', nome: 'Itens baixados com saldo ZERO', tipoMedida: MeasureType.QTD, fatorMultiplicador: 0.5, obrigatoriedade: false, status: 'Ativa', ordem: 5 },
  { id: 't_m_for_canc_sis', categoriaId: 'cat_m_fornecer', nome: 'Cancelar no sistema (P/Ss - ver Amos)', tipoMedida: MeasureType.QTD, fatorMultiplicador: 2.0, obrigatoriedade: false, status: 'Ativa', ordem: 6 },
  { id: 't_m_for_canc_conf', categoriaId: 'cat_m_fornecer', nome: 'CANCELAR- Conferir Saldo (Itens - ver Amos)', tipoMedida: MeasureType.QTD, fatorMultiplicador: 1.0, obrigatoriedade: false, status: 'Ativa', ordem: 7 },
  { id: 't_m_for_canc_ins', categoriaId: 'cat_m_fornecer', nome: 'CANCELAR - Inspecionar / Embalar material (Itens ver Amos)', tipoMedida: MeasureType.QTD, fatorMultiplicador: 1.0, obrigatoriedade: false, status: 'Ativa', ordem: 8 },
  { id: 't_m_for_canc_loc', categoriaId: 'cat_m_fornecer', nome: 'CANCELAR - Colocar material na location (Itens ver Amos)', tipoMedida: MeasureType.QTD, fatorMultiplicador: 1.0, obrigatoriedade: false, status: 'Ativa', ordem: 9 },

  { id: 't_m_pres_mensal', categoriaId: 'cat_m_preservar', nome: 'Check Mensal (soma de controles individuais)', tipoMedida: MeasureType.QTD, fatorMultiplicador: 1200.0, obrigatoriedade: false, status: 'Ativa', ordem: 1 },
  { id: 't_m_pres_pex', categoriaId: 'cat_m_preservar', nome: 'Check PEX', tipoMedida: MeasureType.QTD, fatorMultiplicador: 360.0, obrigatoriedade: false, status: 'Ativa', ordem: 2 },
  { id: 't_m_pres_shelf', categoriaId: 'cat_m_preservar', nome: 'Verificação Shelf Life (itens conferidos)', tipoMedida: MeasureType.QTD, fatorMultiplicador: 3.5, obrigatoriedade: false, status: 'Ativa', ordem: 3 },
  { id: 't_m_pres_fin', categoriaId: 'cat_m_preservar', nome: 'Relatório Financial Reports (uma vez ao mês)', tipoMedida: MeasureType.QTD, fatorMultiplicador: 10.0, obrigatoriedade: false, status: 'Ativa', ordem: 4 },
  { id: 't_m_pres_ps', categoriaId: 'cat_m_preservar', nome: 'Preenchimento da Passagem de serviço', tipoMedida: MeasureType.QTD, fatorMultiplicador: 10.0, obrigatoriedade: false, status: 'Ativa', ordem: 5 },

  { id: 't_m_arm_loc', categoriaId: 'cat_m_armazenar', nome: 'Verificar no sistema/fisico a Location Adequada (Itens)', tipoMedida: MeasureType.QTD, fatorMultiplicador: 1.0, obrigatoriedade: false, status: 'Ativa', ordem: 1 },
  { id: 't_m_arm_bin', categoriaId: 'cat_m_armazenar', nome: 'Binar Fisicamente o Material (Itens)', tipoMedida: MeasureType.QTD, fatorMultiplicador: 1.0, obrigatoriedade: false, status: 'Ativa', ordem: 2 },
];

// Fix: Adding missing exports required by services.ts
export const CONTROLS: Control[] = [
  {
    id: 'c_locations',
    baseId: null,
    nome: 'LOCATIONS',
    tipo: 'locations',
    descricao: 'Controle de permanência em locations',
    unidade: 'dias',
    status: 'Ativo',
    alertaConfig: { 
      verde: 5, amarelo: 3, vermelho: 0, 
      permitirPopupVerde: false, permitirPopupAmarelo: true, permitirPopupVermelho: true, 
      mensagemVerde: '', mensagemAmarelo: 'Item parado há X dias', mensagemVermelho: 'ALERTA: Item parado além do permitido!' 
    }
  },
  {
    id: 'c_transito',
    baseId: null,
    nome: 'TRÂNSITO',
    tipo: 'transito',
    descricao: 'Controle de materiais em trânsito',
    unidade: 'dias',
    status: 'Ativo',
    alertaConfig: { 
      verde: 3, amarelo: 2, vermelho: 0, 
      permitirPopupVerde: false, permitirPopupAmarelo: true, permitirPopupVermelho: true, 
      mensagemVerde: '', mensagemAmarelo: 'Material em trânsito há X dias', mensagemVermelho: 'CRÍTICO: Material atrasado no trânsito!' 
    }
  },
  {
    id: 'c_shelf_life',
    baseId: null,
    nome: 'SHELF LIFE',
    tipo: 'shelf_life',
    descricao: 'Validade de materiais',
    unidade: 'dias',
    status: 'Ativo',
    alertaConfig: { 
      verde: 30, amarelo: 15, vermelho: 0, 
      permitirPopupVerde: false, permitirPopupAmarelo: true, permitirPopupVermelho: true, 
      mensagemVerde: '', mensagemAmarelo: 'Vencimento em X dias', mensagemVermelho: 'ALERTA: Material Vencido!' 
    }
  },
  {
    id: 'c_itens_criticos',
    baseId: null,
    nome: 'ITENS CRÍTICOS',
    tipo: 'itens_criticos',
    descricao: 'Acuracidade de itens críticos',
    unidade: 'diferença',
    status: 'Ativo',
    alertaConfig: { 
      verde: 0, amarelo: 1, vermelho: 2, 
      permitirPopupVerde: false, permitirPopupAmarelo: true, permitirPopupVermelho: true, 
      mensagemVerde: '', mensagemAmarelo: 'Divergência de X unidade(s)', mensagemVermelho: 'ERRO CRÍTICO DE INVENTÁRIO!' 
    }
  }
];

export const DEFAULT_LOCATIONS: DefaultLocationItem[] = [
  { id: 'loc_aog', baseId: null, status: 'ativo', visivel: true, nomeLocation: 'AOG' },
  { id: 'loc_pernoite', baseId: null, status: 'ativo', visivel: true, nomeLocation: 'PERNOITE' }
];

export const DEFAULT_TRANSITS: DefaultTransitItem[] = [
  { id: 'tra_saida', baseId: null, status: 'ativo', visivel: true, nomeTransito: 'SAÍDA GOL', diasPadrao: 1 },
  { id: 'tra_chegada', baseId: null, status: 'ativo', visivel: true, nomeTransito: 'CHEGADA GOL', diasPadrao: 1 }
];

export const DEFAULT_CRITICALS: DefaultCriticalItem[] = [
  { id: 'crit_oleo', baseId: null, status: 'ativo', visivel: true, partNumber: 'BP TURBO OIL 2380' },
  { id: 'crit_skydrol', baseId: null, status: 'ativo', visivel: true, partNumber: 'SKYDROL LD-4' }
];
