/**
 * Catálogo ÚNICO de recursos premium. Cada feature tem uma chave estável usada
 * para gating (`isFeatureEnabled`) e para montar telas (benefícios/comparativo)
 * sem espalhar condicionais pelo código. Novos recursos Pro entram só aqui.
 */
export type PremiumFeatureKey =
  | 'noAds'
  | 'unlimitedThemes'
  | 'colorCustomization'
  | 'workoutExport'
  | 'advancedStats'
  | 'customExerciseVideos'
  | 'priorityFeatures'
  | 'cloudSync'
  | 'backupRestore'
  | 'recordsDashboard';

export interface PremiumFeature {
  key: PremiumFeatureKey;
  /** Ícone (nome do componente Icon). */
  icon: string;
  /** Já disponível no app ou apenas planejado (aparece com selo "em breve"). */
  available: boolean;
}

/** Ordem de exibição na PremiumScreen. Textos vêm do i18n (`premium.feat.<key>.*`). */
export const PREMIUM_FEATURES: PremiumFeature[] = [
  { key: 'noAds', icon: 'star', available: true },
  { key: 'unlimitedThemes', icon: 'settings', available: true },
  { key: 'colorCustomization', icon: 'settings', available: true },
  { key: 'workoutExport', icon: 'share', available: true },
  { key: 'advancedStats', icon: 'chart', available: true },
  { key: 'customExerciseVideos', icon: 'dumbbell', available: true },
  { key: 'priorityFeatures', icon: 'check', available: true },
  { key: 'cloudSync', icon: 'globe', available: false },
  { key: 'backupRestore', icon: 'timer', available: false },
  { key: 'recordsDashboard', icon: 'history', available: false },
];

/**
 * Um recurso está liberado se o usuário é Pro. (Recursos ainda não implementados
 * seguem gated aqui e podem ser ativados quando prontos, sem mudar chamadas.)
 */
export function isFeatureEnabled(_key: PremiumFeatureKey, isPro: boolean): boolean {
  return isPro;
}
