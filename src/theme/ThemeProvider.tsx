import React, { createContext, useContext, useMemo } from 'react';

import { usePreferences } from '@/store/PreferencesStore';
import {
  fonts as staticFonts,
  ThemeColors,
  ThemeGradients,
  themes,
} from '@/theme';

/**
 * Provider de tema: expõe a paleta (`colors`/`gradients`) do preset ativo, que
 * vem das preferências do usuário. Trocar de tema recolore o app em tempo real
 * porque os consumidores recriam seus estilos via `useMemo([colors])`.
 */
interface ThemeValue {
  colors: ThemeColors;
  gradients: ThemeGradients;
  fonts: typeof staticFonts;
  themeId: string;
}

const ThemeContext = createContext<ThemeValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { themeId } = usePreferences();

  const value = useMemo<ThemeValue>(() => {
    const theme = themes[themeId] ?? themes.dark;
    return {
      colors: theme.colors,
      gradients: theme.gradients,
      fonts: staticFonts,
      themeId,
    };
  }, [themeId]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Hook de acesso ao tema ativo. Lança se usado fora do provider. */
export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme deve ser usado dentro de <ThemeProvider>.');
  }
  return ctx;
}
