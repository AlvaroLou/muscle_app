/**
 * Acesso PROTEGIDO ao módulo nativo do AdMob.
 *
 * O `react-native-google-mobile-ads` é um módulo nativo e NÃO existe no Expo Go
 * (nem em qualquer build sem o plugin). O `require` roda dentro de try/catch:
 * se falhar, os anúncios são simplesmente reportados como indisponíveis e o app
 * inteiro continua funcionando normalmente. Só há anúncios reais num dev
 * client / build EAS.
 *
 * Nenhum outro arquivo deve importar o pacote diretamente — sempre via aqui.
 */
type AdmobNamespace = typeof import('react-native-google-mobile-ads');

let cached: AdmobNamespace | null | undefined;

/** Retorna o namespace do AdMob, ou null se o módulo nativo não estiver presente. */
export function getAdmob(): AdmobNamespace | null {
  if (cached !== undefined) return cached;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('react-native-google-mobile-ads') as AdmobNamespace;
  } catch {
    cached = null;
  }
  return cached;
}

/** A SDK nativa está disponível neste runtime? */
export const adsAvailable = (): boolean => getAdmob() != null;

/** Log silencioso de erro de anúncio (nunca deve interromper a navegação). */
export function logAdError(context: string, error: unknown): void {
  if (__DEV__) console.warn(`[ads] ${context}`, error);
}
