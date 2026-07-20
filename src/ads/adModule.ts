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
import { NativeModules, TurboModuleRegistry } from 'react-native';

type AdmobNamespace = typeof import('react-native-google-mobile-ads');

let cached: AdmobNamespace | null | undefined;

/**
 * O módulo nativo do AdMob está registrado neste binário? Usa
 * `TurboModuleRegistry.get` (NÃO lança, ao contrário de `getEnforcing`) e o
 * bridge antigo como fallback. No Expo Go retorna false — e aí nem importamos o
 * pacote, evitando o Invariant Violation que ele dispara ao tocar no nativo.
 */
function nativeModulePresent(): boolean {
  try {
    const fromTurbo =
      typeof TurboModuleRegistry?.get === 'function' &&
      TurboModuleRegistry.get('RNGoogleMobileAdsModule') != null;
    const fromBridge = (NativeModules as Record<string, unknown>)
      .RNGoogleMobileAdsModule != null;
    return fromTurbo || fromBridge;
  } catch {
    return false;
  }
}

/** Retorna o namespace do AdMob, ou null se o módulo nativo não estiver presente. */
export function getAdmob(): AdmobNamespace | null {
  if (cached !== undefined) return cached;
  if (!nativeModulePresent()) {
    cached = null;
    return cached;
  }
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
