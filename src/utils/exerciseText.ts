import { TFunction } from 'i18next';

import { LibraryExercise } from '@/types';

/**
 * Resolve os textos de um exercício da Biblioteca. Padrão → traduzido pelo id
 * (`exercises.<id>.*`); personalizado → texto literal do usuário.
 */
export function exerciseName(ex: LibraryExercise, t: TFunction): string {
  return ex.isCustom ? (ex.custom?.name ?? '') : t(`exercises.${ex.id}.name`);
}

export function exerciseInstructions(ex: LibraryExercise, t: TFunction): string {
  if (ex.isCustom) return '';
  return t(`exercises.${ex.id}.instructions`, { defaultValue: '' });
}

export function exerciseTips(ex: LibraryExercise, t: TFunction): string {
  if (ex.isCustom) return '';
  return t(`exercises.${ex.id}.tips`, { defaultValue: '' });
}

export function exerciseNotes(ex: LibraryExercise, t: TFunction): string {
  return ex.isCustom ? (ex.custom?.notes ?? '') : t(`exercises.${ex.id}.notes`, { defaultValue: '' });
}
