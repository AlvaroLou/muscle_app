import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import i18n from '@/i18n';
import {
  LanguageCode,
  Preferences,
  preferencesRepository,
  ThemeId,
} from '@/repositories/preferencesRepository';
import { DEFAULT_REST_DURATIONS, RestDurations } from '@/services/rest';
import { RestType } from '@/types';

/**
 * Store de preferências do usuário: idioma, tema e descansos. Carrega o que
 * estiver salvo na montagem, aplica no i18next e persiste a cada mudança. O
 * ThemeProvider consome `themeId` daqui; o app inteiro consome `restDurations`.
 */
interface PreferencesValue {
  language: LanguageCode;
  themeId: ThemeId;
  restDurations: RestDurations;
  setLanguage: (lng: LanguageCode) => void;
  setThemeId: (id: ThemeId) => void;
  setRestDuration: (type: RestType, seconds: number) => void;
}

const PreferencesContext = createContext<PreferencesValue | undefined>(undefined);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(
    (i18n.language as LanguageCode) ?? 'en',
  );
  const [themeId, setThemeIdState] = useState<ThemeId>('dark');
  const [restDurations, setRestDurationsState] =
    useState<RestDurations>(DEFAULT_REST_DURATIONS);

  // Carrega preferências salvas na montagem e aplica o idioma no i18next.
  useEffect(() => {
    let active = true;
    (async () => {
      const stored = await preferencesRepository.get();
      if (!active) return;
      if (stored.language) {
        setLanguageState(stored.language);
        void i18n.changeLanguage(stored.language);
      }
      if (stored.themeId) setThemeIdState(stored.themeId);
      if (stored.restDurations) {
        setRestDurationsState({ ...DEFAULT_REST_DURATIONS, ...stored.restDurations });
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const persist = useCallback((patch: Preferences) => {
    void preferencesRepository.get().then((prev) =>
      preferencesRepository.save({ ...prev, ...patch }),
    );
  }, []);

  const setLanguage = useCallback(
    (lng: LanguageCode) => {
      setLanguageState(lng);
      void i18n.changeLanguage(lng);
      persist({ language: lng });
    },
    [persist],
  );

  const setThemeId = useCallback(
    (id: ThemeId) => {
      setThemeIdState(id);
      persist({ themeId: id });
    },
    [persist],
  );

  const setRestDuration = useCallback(
    (type: RestType, seconds: number) => {
      setRestDurationsState((prev) => {
        const next = { ...prev, [type]: seconds };
        persist({ restDurations: next });
        return next;
      });
    },
    [persist],
  );

  const value = useMemo<PreferencesValue>(
    () => ({ language, themeId, restDurations, setLanguage, setThemeId, setRestDuration }),
    [language, themeId, restDurations, setLanguage, setThemeId, setRestDuration],
  );

  return (
    <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
  );
}

/** Hook de acesso às preferências. Lança se usado fora do provider. */
export function usePreferences(): PreferencesValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error('usePreferences deve ser usado dentro de <PreferencesProvider>.');
  }
  return ctx;
}
