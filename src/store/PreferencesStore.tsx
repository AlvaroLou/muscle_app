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
  ThemeMode,
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
  themeMode: ThemeMode;
  /** Cor de destaque custom (Pro) ou undefined = usar o preset. */
  customAccent?: string;
  restDurations: RestDurations;
  setLanguage: (lng: LanguageCode) => void;
  /** Seleciona um preset de accent (limpa a cor custom). */
  setThemeId: (id: ThemeId) => void;
  setThemeMode: (mode: ThemeMode) => void;
  /** Define a cor de destaque custom (null limpa e volta ao preset). */
  setCustomAccent: (hex: string | null) => void;
  setRestDuration: (type: RestType, seconds: number) => void;
}

const PreferencesContext = createContext<PreferencesValue | undefined>(undefined);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(
    (i18n.language as LanguageCode) ?? 'en',
  );
  const [themeId, setThemeIdState] = useState<ThemeId>('dark');
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');
  const [customAccent, setCustomAccentState] = useState<string | undefined>(undefined);
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
      if (stored.themeMode) setThemeModeState(stored.themeMode);
      if (stored.customAccent) setCustomAccentState(stored.customAccent);
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
      // Escolher um preset limpa a cor custom (o preset volta a valer).
      setThemeIdState(id);
      setCustomAccentState(undefined);
      persist({ themeId: id, customAccent: undefined });
    },
    [persist],
  );

  const setThemeMode = useCallback(
    (mode: ThemeMode) => {
      setThemeModeState(mode);
      persist({ themeMode: mode });
    },
    [persist],
  );

  const setCustomAccent = useCallback(
    (hex: string | null) => {
      const value = hex ?? undefined;
      setCustomAccentState(value);
      persist({ customAccent: value });
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
    () => ({
      language,
      themeId,
      themeMode,
      customAccent,
      restDurations,
      setLanguage,
      setThemeId,
      setThemeMode,
      setCustomAccent,
      setRestDuration,
    }),
    [
      language,
      themeId,
      themeMode,
      customAccent,
      restDurations,
      setLanguage,
      setThemeId,
      setThemeMode,
      setCustomAccent,
      setRestDuration,
    ],
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
