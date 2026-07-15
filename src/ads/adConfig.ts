import { Platform } from 'react-native';

/**
 * Configuração ÚNICA de anúncios (AdConfig). Todos os IDs, ambiente de teste/
 * produção, controle de frequência e o padrão Free/Pro moram aqui — nada de IDs
 * espalhados pelo projeto.
 *
 * AppLovin MAX entra como REDE DE MEDIAÇÃO do AdMob (configurada no painel do
 * AdMob + adaptador no build nativo), então o código do app fala só com o
 * AdMob; a mediação é transparente. Para adicionar redes futuras, basta um novo
 * provider em AdService — nada muda nas telas.
 */

/** true = usa os IDs de teste do Google (obrigatório em dev p/ não violar a política). */
export const AD_TEST_MODE = __DEV__;

/** IDs de teste públicos do Google AdMob (seguros em desenvolvimento). */
const TEST = {
  android: {
    appId: 'ca-app-pub-3940256099942544~3347511713',
    banner: 'ca-app-pub-3940256099942544/6300978111',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
  },
  ios: {
    appId: 'ca-app-pub-3940256099942544~1458002511',
    banner: 'ca-app-pub-3940256099942544/2934735716',
    interstitial: 'ca-app-pub-3940256099942544/4411468910',
    rewarded: 'ca-app-pub-3940256099942544/1712485313',
  },
};

/**
 * IDs de PRODUÇÃO — SUBSTITUA pelos seus do painel do AdMob antes de publicar.
 * O appId também precisa ir para o app.json (`react-native-google-mobile-ads`).
 */
const PROD = {
  android: {
    appId: 'ca-app-pub-0000000000000000~0000000000',
    banner: 'ca-app-pub-0000000000000000/0000000001',
    interstitial: 'ca-app-pub-0000000000000000/0000000002',
    rewarded: 'ca-app-pub-0000000000000000/0000000003',
  },
  ios: {
    appId: 'ca-app-pub-0000000000000000~0000000000',
    banner: 'ca-app-pub-0000000000000000/0000000004',
    interstitial: 'ca-app-pub-0000000000000000/0000000005',
    rewarded: 'ca-app-pub-0000000000000000/0000000006',
  },
};

type AdKind = 'banner' | 'interstitial' | 'rewarded';

/** Retorna o unit id do tipo pedido, conforme plataforma e ambiente. */
export function adUnitId(kind: AdKind): string {
  const env = AD_TEST_MODE ? TEST : PROD;
  const set = Platform.OS === 'ios' ? env.ios : env.android;
  return set[kind];
}

/** Controle de frequência (política/UX): evita excesso de anúncios. */
export const AD_FREQUENCY = {
  /** Mínimo de exercícios concluídos entre dois intersticiais. */
  interstitialEveryExercises: 2,
  /** Intervalo mínimo entre intersticiais (ms). */
  interstitialMinIntervalMs: 90_000,
};

/**
 * Recompensa do Rewarded Ad: assistir libera este período SEM intersticiais.
 * Recompensa genuína (exigência de política do AdMob para anúncios premiados).
 */
export const AD_REWARD_FREE_MS = 30 * 60 * 1000;

/**
 * Padrão da flag Pro quando ainda não há billing. O PremiumManager pode
 * sobrescrever via um toggle de desenvolvimento persistido (Settings).
 */
export const DEFAULT_IS_PRO = false;

/** Opções padrão de request (respeita consentimento — não personalizado). */
export const AD_REQUEST_OPTIONS = {
  requestNonPersonalizedAdsOnly: true,
} as const;
