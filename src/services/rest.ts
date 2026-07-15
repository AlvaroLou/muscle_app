import { RestType } from '@/types';

/**
 * Serviço central de descanso. Todo o app consome as categorias e resolve os
 * segundos a partir de UMA fonte (a config global do usuário) — sem valores
 * fixos espalhados pelo código.
 */
export type RestDurations = Record<RestType, number>;

/** Ordem canônica das categorias (para seletores). */
export const REST_TYPES: RestType[] = ['light', 'moderate', 'long'];

/** Padrões de fábrica (segundos). O usuário pode alterar em Settings. */
export const DEFAULT_REST_DURATIONS: RestDurations = {
  light: 45,
  moderate: 90,
  long: 120,
};

/** Categoria de descanso padrão para exercícios novos. */
export const DEFAULT_REST_TYPE: RestType = 'moderate';

/**
 * Resolve os segundos de descanso de um exercício:
 * 1) `restType` → duração configurada da categoria;
 * 2) legado `rest` > 0 → usa os segundos gravados;
 * 3) senão → padrão (moderate).
 */
export function restSeconds(
  exercise: { restType?: RestType; rest?: number },
  durations: RestDurations,
): number {
  if (exercise.restType) return durations[exercise.restType];
  if (exercise.rest && exercise.rest > 0) return exercise.rest;
  return durations[DEFAULT_REST_TYPE];
}

/** Segundos → categoria mais próxima (para migrar dados legados na UI). */
export function nearestRestType(seconds: number, durations: RestDurations): RestType {
  let best: RestType = DEFAULT_REST_TYPE;
  let bestDiff = Infinity;
  for (const type of REST_TYPES) {
    const diff = Math.abs(durations[type] - seconds);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = type;
    }
  }
  return best;
}
