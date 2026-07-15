import { RestDurations } from '@/services/rest';
import { storage } from '@/services/storage';

/**
 * Preferências do usuário (idioma, tema, descansos). Fonte única de
 * leitura/gravação — telas e providers nunca falam com o storage direto.
 */
const STORAGE_KEY = '@workout_planner/preferences';

export type LanguageCode = 'en' | 'pt-BR';
export type ThemeId = 'dark' | 'blue' | 'green';

export interface Preferences {
  language?: LanguageCode;
  themeId?: ThemeId;
  /** Durações (segundos) de cada categoria de descanso. */
  restDurations?: RestDurations;
}

export const preferencesRepository = {
  async get(): Promise<Preferences> {
    return (await storage.get<Preferences>(STORAGE_KEY)) ?? {};
  },

  async save(prefs: Preferences): Promise<void> {
    await storage.set(STORAGE_KEY, prefs);
  },
};
