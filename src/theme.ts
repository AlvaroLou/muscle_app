/**
 * Design tokens extraídos do protótipo Figma (Bodybuilding Workout Planner).
 * Tema escuro com destaque verde-neon. Centralizados aqui para consistência.
 */

export const colors = {
  // fundos
  bg: '#121212',
  bgDeep: '#0a0a0a',
  card: '#1e1e1e',
  cardAlt: '#242424',
  inputAlt: '#2a2a2a',

  // destaque neon
  accent: '#ff149d',
  accentDim: '#c810d9',
  accentGreen: '#cc00bb',
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

  // variações do neon com alpha
  accentBorder: 'rgba(255, 20, 251, 0.2)',
  accentBorderStrong: 'rgba(255, 20, 251, 0.35)',
  accentTint: 'rgba(255, 20, 251, 0.1)',
  accentTintSoft: 'rgba(255, 20, 251, 0.08)',
  accentTintSofter: 'rgba(255, 20, 251, 0.04)',
  accentTint12: 'rgba(255, 20, 251, 0.12)',
  accentGlow: 'rgba(255, 20, 251, 0.3)',

  // tints das badges
  blueTint: 'rgba(57,150,255,0.15)',
  orangeTint: 'rgba(255,120,57,0.15)',
  greenTint15: 'rgba(255, 20, 251, 0.15)',

  // superfícies neutras com alpha
  white04: 'rgba(255,255,255,0.04)',
  white05: 'rgba(255,255,255,0.05)',
  white06: 'rgba(255,255,255,0.06)',
  white07: 'rgba(255,255,255,0.07)',
  white15: 'rgba(255,255,255,0.15)',

  navBar: '#181818',
} as const;

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

/** Gradientes reutilizáveis (para expo-linear-gradient). */
export const gradients = {
  accent: ['#ff149d', '#c810d9'] as const,
  accentAvatar: ['#ff149d', '#cc00bb'] as const,
  card: ['#1e1e1e', '#242424'] as const,
  exercisePlaceholder: ['#2a2a2a', '#222222'] as const,
};
