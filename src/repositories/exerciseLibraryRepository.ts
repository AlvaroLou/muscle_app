import { storage } from '@/services/storage';
import { LibraryExercise } from '@/types';

/**
 * Persistência da Biblioteca de Exercícios: exercícios personalizados do
 * usuário e a lista de favoritos (ids). O catálogo padrão é estático (bundled)
 * e não é persistido aqui.
 */
const CUSTOM_KEY = '@workout_planner/custom_exercises';
const FAVORITES_KEY = '@workout_planner/exercise_favorites';
const OVERRIDES_KEY = '@workout_planner/exercise_overrides';

/** Edições do usuário sobre exercícios PADRÃO (texto e mídia), por id. */
export type ExerciseOverride = NonNullable<LibraryExercise['custom']>;

export const exerciseLibraryRepository = {
  async getCustom(): Promise<LibraryExercise[]> {
    return (await storage.get<LibraryExercise[]>(CUSTOM_KEY)) ?? [];
  },
  async saveCustom(list: LibraryExercise[]): Promise<void> {
    await storage.set(CUSTOM_KEY, list);
  },
  async getFavorites(): Promise<string[]> {
    return (await storage.get<string[]>(FAVORITES_KEY)) ?? [];
  },
  async saveFavorites(ids: string[]): Promise<void> {
    await storage.set(FAVORITES_KEY, ids);
  },
  async getOverrides(): Promise<Record<string, ExerciseOverride>> {
    return (await storage.get<Record<string, ExerciseOverride>>(OVERRIDES_KEY)) ?? {};
  },
  async saveOverrides(map: Record<string, ExerciseOverride>): Promise<void> {
    await storage.set(OVERRIDES_KEY, map);
  },
};
