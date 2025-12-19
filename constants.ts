
import { Base, PermissionLevel, Category, Task, MeasureType } from './types';

export const BASES: Base[] = [
  { id: 'poa', nome: 'Porto Alegre', sigla: 'POA', jornada: '6h', turnos: 4, status: 'Ativa' },
  { id: 'fln', nome: 'Florianópolis', sigla: 'FLN', jornada: '6h', turnos: 4, status: 'Ativa' },
  { id: 'gru', nome: 'Guarulhos', sigla: 'GRU', jornada: '12h', turnos: 2, status: 'Ativa' },
  { id: 'gig', nome: 'Galeão', sigla: 'GIG', jornada: '8h', turnos: 3, status: 'Ativa' },
  { id: 'cwb', nome: 'Curitiba', sigla: 'CWB', jornada: '6h', turnos: 4, status: 'Ativa' },
  { id: 'sdu', nome: 'Santos Dumont', sigla: 'SDU', jornada: '8h', turnos: 3, status: 'Ativa' },
];

export const CATEGORIES: Category[] = [
  { id: 'cat1', nome: 'RECEBIMENTO', ordem: 1 },
  { id: 'cat2', nome: 'DESPACHO', ordem: 2 },
  { id: 'cat3', nome: 'ARMAZENAGEM', ordem: 3 },
];

export const TASKS: Task[] = [
  { id: 't1', categoriaId: 'cat1', nome: 'Receber Carga', tipoMedida: MeasureType.QTD, fatorMultiplicador: 5, obrigatoriedade: true },
  { id: 't2', categoriaId: 'cat1', nome: 'Conferir Documentação', tipoMedida: MeasureType.QTD, fatorMultiplicador: 3, obrigatoriedade: true },
  { id: 't3', categoriaId: 'cat2', nome: 'Etiquetagem', tipoMedida: MeasureType.QTD, fatorMultiplicador: 2, obrigatoriedade: false },
];
