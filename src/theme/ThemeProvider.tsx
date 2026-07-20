import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { usePreferences } from '@/store/PreferencesStore';
import { usePremium } from '@/store/PremiumStore';
import {
  buildColors,
  buildGradients,
  darken,
  fonts as staticFonts,
  ThemeBase,
  ThemeColors,
  ThemeGradients,
  THEME_DEFS,
} from '@/theme';

/**
 * Provider de tema. Free = base escura + um dos 3 presets de accent. Pro pode
 * escolher o modo (claro/escuro/automático) e uma cor de destaque livre. Tudo
 * recolore em tempo real porque os consumidores recriam estilos via
 * `useMemo([colors])`.
 */
interface ThemeValue {
  colors: ThemeColors;
  gradients: ThemeGradients;
  fonts: typeof staticFonts;
  themeId: string;
  base: ThemeBase;
}

const ThemeContext = createContext<ThemeValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { themeId, themeMode, customAccent } = usePreferences();
  const { isPro } = usePremium();
  const system = useColorScheme();

  const value = useMemo<ThemeValue>(() => {
    const preset = THEME_DEFS[themeId] ?? THEME_DEFS.dark;

    // Base: recursos claro/auto são Pro; Free fica sempre escuro.
    const base: ThemeBase =
      isPro && themeMode !== 'dark'
        ? themeMode === 'light'
          ? 'light'
          : system === 'light'
            ? 'light'
            : 'dark'
        : 'dark';

    // Accent: cor custom (Pro) sobrepõe o preset; accentDim derivado.
    const def =
      isPro && customAccent
        ? { id: preset.id, accent: customAccent, accentDim: darken(customAccent, 0.18) }
        : preset;

    return {
      colors: buildColors(def, base),
      gradients: buildGradients(def, base),
      fonts: staticFonts,
      themeId,
      base,
    };
  }, [themeId, themeMode, customAccent, isPro, system]);

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
