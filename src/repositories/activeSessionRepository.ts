import { storage } from '@/services/storage';
import { ActiveSession } from '@/types';

/**
 * Persiste o treino em andamento (um só por vez). Permite sair da tela — ou até
 * fechar o app — e retomar depois de onde parou.
 */
const STORAGE_KEY = '@workout_planner/active_session';

export const activeSessionRepository = {
  async get(): Promise<ActiveSession | null> {
    return storage.get<ActiveSession>(STORAGE_KEY);
  },

  async save(session: ActiveSession): Promise<void> {
    await storage.set(STORAGE_KEY, session);
  },

  async clear(): Promise<void> {
    await storage.remove(STORAGE_KEY);
  },
};
