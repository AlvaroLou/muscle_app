import { TFunction } from 'i18next';

import { LibraryExercise } from '@/types';

/**
 * Resolve os textos de um exercício da Biblioteca. Um texto customizado
 * (`custom.*`) sempre tem prioridade — vale tanto para exercícios personalizados
 * quanto para exercícios PADRÃO editados pelo usuário (override). Caso não haja
 * override, o padrão é traduzido pelo id (`exercises.<id>.*`).
 */
export function exerciseName(ex: LibraryExercise, t: TFunction): string {
  if (ex.custom?.name) return ex.custom.name;
  return ex.isCustom ? '' : t(`exercises.${ex.id}.name`);
}

export function exerciseInstructions(ex: LibraryExercise, t: TFunction): string {
  if (ex.custom?.instructions) return ex.custom.instructions;
  return ex.isCustom ? '' : t(`exercises.${ex.id}.instructions`, { defaultValue: '' });
}

export function exerciseTips(ex: LibraryExercise, t: TFunction): string {
  if (ex.custom?.tips) return ex.custom.tips;
  return ex.isCustom ? '' : t(`exercises.${ex.id}.tips`, { defaultValue: '' });
}

export function exerciseNotes(ex: LibraryExercise, t: TFunction): string {
  if (ex.custom?.notes) return ex.custom.notes;
  return ex.isCustom ? '' : t(`exercises.${ex.id}.notes`, { defaultValue: '' });
}
