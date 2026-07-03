import { storage } from '@/services/storage';
import { WorkoutSession } from '@/types';

/**
 * Repositório do histórico de sessões concluídas. Mesma responsabilidade única
 * do de treinos: isola COMO o histórico é lido/gravado.
 */
const STORAGE_KEY = '@workout_planner/sessions';

export const sessionRepository = {
  async getAll(): Promise<WorkoutSession[]> {
    return (await storage.get<WorkoutSession[]>(STORAGE_KEY)) ?? [];
  },

  async saveAll(sessions: WorkoutSession[]): Promise<void> {
    await storage.set(STORAGE_KEY, sessions);
  },

  async clear(): Promise<void> {
    await storage.remove(STORAGE_KEY);
  },
};
