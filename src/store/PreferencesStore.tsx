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

/**
 * Store de preferências do usuário: idioma e tema. Carrega o que estiver salvo
 * na montagem, aplica no i18next e persiste a cada mudança. O ThemeProvider
 * consome `themeId` daqui.
 */
interface PreferencesValue {
  language: LanguageCode;
  themeId: ThemeId;
  setLanguage: (lng: LanguageCode) => void;
  setThemeId: (id: ThemeId) => void;
}

const PreferencesContext = createContext<PreferencesValue | undefined>(undefined);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(
    (i18n.language as LanguageCode) ?? 'en',
  );
  const [themeId, setThemeIdState] = useState<ThemeId>('dark');

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

  const value = useMemo<PreferencesValue>(
    () => ({ language, themeId, setLanguage, setThemeId }),
    [language, themeId, setLanguage, setThemeId],
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
