/**
 * Design tokens. Tema escuro; a cor de destaque (accent) é trocável entre os
 * presets Free (Dark/rosa, Blue, Green). Os tons com alpha do accent são
 * derivados do próprio accent por `buildColors`, então trocar de tema recolore
 * tudo de forma consistente. O fundo permanece escuro em todos os presets.
 */
import { ThemeId } from '@/repositories/preferencesRepository';

/** hex (#rrggbb) → "rgba(r,g,b,a)". */
function rgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Cores neutras — iguais em todos os temas (base escura). */
const neutral = {
  // fundos
  bg: '#121212',
  bgDeep: '#0a0a0a',
  card: '#1e1e1e',
  cardAlt: '#242424',
  inputAlt: '#2a2a2a',
  onAccent: '#0a0a0a',

  // acentos secundários (badges dos treinos)
  blue: '#3996FF',
  orange: '#FF7839',
  danger: '#ff3b30',

  // texto
  text: '#ffffff',
  textDim: '#cccccc',
  textDim2: '#aaaaaa',
  textSecondary: '#888888',
  textMuted: '#666666',
  textFaint: '#444444',
  handle: '#555555',

  // linhas / bordas
  border: 'rgba(255,255,255,0.06)',
  borderSoft: 'rgba(255,255,255,0.05)',
  borderStrong: 'rgba(255,255,255,0.08)',
  borderInput: 'rgba(255,255,255,0.1)',
  divider: 'rgba(255,255,255,0.05)',

  // tints das badges
  blueTint: 'rgba(57,150,255,0.15)',
  orangeTint: 'rgba(255,120,57,0.15)',

  // superfícies neutras com alpha
  white04: 'rgba(255,255,255,0.04)',
  white05: 'rgba(255,255,255,0.05)',
  white06: 'rgba(255,255,255,0.06)',
  white07: 'rgba(255,255,255,0.07)',
  white15: 'rgba(255,255,255,0.15)',

  navBar: '#181818',
} as const;

/** Definição mínima de cada preset: o accent e sua variação escura. */
export interface ThemeDef {
  id: ThemeId;
  accent: string;
  accentDim: string;
}

export const THEME_DEFS: Record<ThemeId, ThemeDef> = {
  dark: { id: 'dark', accent: '#ff149d', accentDim: '#c810d9' },
  blue: { id: 'blue', accent: '#3996ff', accentDim: '#1e6fd6' },
  green: { id: 'green', accent: '#20c95a', accentDim: '#12984a' },
};

/** Monta a paleta completa a partir de um accent. */
export function buildColors(def: ThemeDef) {
  const { accent, accentDim } = def;
  return {
    ...neutral,
    accent,
    accentDim,
    accentGreen: accentDim,

    // variações do accent com alpha (derivadas — nada hardcoded)
    accentBorder: rgba(accent, 0.2),
    accentBorderStrong: rgba(accent, 0.35),
    accentTint: rgba(accent, 0.1),
    accentTintSoft: rgba(accent, 0.08),
    accentTintSofter: rgba(accent, 0.04),
    accentTint12: rgba(accent, 0.12),
    accentGlow: rgba(accent, 0.3),
    greenTint15: rgba(accent, 0.15),
  };
}

export function buildGradients(def: ThemeDef) {
  return {
    accent: [def.accent, def.accentDim] as const,
    accentAvatar: [def.accent, def.accentDim] as const,
    card: ['#1e1e1e', '#242424'] as const,
    exercisePlaceholder: ['#2a2a2a', '#222222'] as const,
  };
}

export type ThemeColors = ReturnType<typeof buildColors>;
export type ThemeGradients = ReturnType<typeof buildGradients>;

/** Paletas pré-computadas por tema. */
export const themes: Record<ThemeId, { colors: ThemeColors; gradients: ThemeGradients }> = {
  dark: { colors: buildColors(THEME_DEFS.dark), gradients: buildGradients(THEME_DEFS.dark) },
  blue: { colors: buildColors(THEME_DEFS.blue), gradients: buildGradients(THEME_DEFS.blue) },
  green: { colors: buildColors(THEME_DEFS.green), gradients: buildGradients(THEME_DEFS.green) },
};

/**
 * Exports estáticos = tema padrão (dark). Mantidos para compatibilidade e como
 * fallback fora de componentes (ex.: `navTheme` inicial). Dentro de componentes,
 * prefira `useTheme()` para reagir à troca de tema.
 */
export const colors = themes.dark.colors;
export const gradients = themes.dark.gradients;

/**
 * Famílias de fonte — precisam bater com as chaves carregadas no App via
 * @expo-google-fonts. Barlow Condensed = títulos, DM Sans = corpo, DM Mono =
 * rótulos/números.
 */
export const fonts = {
  heading: 'BarlowCondensed_700Bold',
  headingSemi: 'BarlowCondensed_600SemiBold',
  body: 'DMSans_400Regular',
  bodyMed: 'DMSans_500Medium',
  bodyBold: 'DMSans_700Bold',
  mono: 'DMMono_400Regular',
  monoMed: 'DMMono_500Medium',
} as const;

/** Escala de espaçamento (múltiplos de 4) para padding/margin/gap consistentes. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

/** Escala de raios de borda — cards, botões, chips. */
export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;
