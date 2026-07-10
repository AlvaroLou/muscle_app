import { storage } from '@/services/storage';
import { LibraryExercise } from '@/types';

/**
 * Persistência da Biblioteca de Exercícios: exercícios personalizados do
 * usuário e a lista de favoritos (ids). O catálogo padrão é estático (bundled)
 * e não é persistido aqui.
 */
const CUSTOM_KEY = '@workout_planner/custom_exercises';
const FAVORITES_KEY = '@workout_planner/exercise_favorites';

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
};
