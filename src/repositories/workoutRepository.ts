import { storage } from '@/services/storage';
import { Workout } from '@/types';

/**
 * Repositório de treinos: única fonte de verdade sobre COMO os treinos são
 * lidos/gravados. Store e telas nunca falam com o storage direto.
 */
const STORAGE_KEY = '@workout_planner/workouts';

export const workoutRepository = {
  async getAll(): Promise<Workout[]> {
    return (await storage.get<Workout[]>(STORAGE_KEY)) ?? [];
  },

  async saveAll(workouts: Workout[]): Promise<void> {
    await storage.set(STORAGE_KEY, workouts);
  },

  async clear(): Promise<void> {
    await storage.remove(STORAGE_KEY);
  },
};
