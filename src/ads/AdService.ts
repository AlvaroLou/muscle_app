import { AD_FREQUENCY, AD_REWARD_FREE_MS } from './adConfig';
import { getAdmob, logAdError } from './adModule';
import { InterstitialManager } from './InterstitialManager';
import { RewardedManager } from './RewardedManager';

/**
 * Serviço central de anúncios (AdService). Concentra TODA a lógica de
 * monetização: inicialização do SDK, cache via managers, controle de frequência
 * e tratamento de erros. As telas nunca falam com o SDK diretamente — usam este
 * serviço (via `useAds`) e o `BannerAd`.
 *
 * O app é gratuito e os anúncios aparecem para TODOS (não há versão paga). A
 * única supressão temporária é a recompensa do Rewarded Ad (assistir libera uma
 * janela sem intersticiais) — uma vantagem opcional, não um plano pago.
 */
class AdServiceImpl {
  readonly interstitial = new InterstitialManager();
  readonly rewarded = new RewardedManager();

  private started = false;
  private lastInterstitialAt = 0;
  private exercisesSinceAd = 0;
  /** Enquanto Date.now() < isto, os intersticiais ficam suprimidos (recompensa). */
  private adFreeUntil = 0;

  private get adFree(): boolean {
    return Date.now() < this.adFreeUntil;
  }

  /** Inicializa o SDK e começa o pré-carregamento. Idempotente. */
  async start(): Promise<boolean> {
    if (this.started) return true;
    const admob = getAdmob();
    if (!admob) return false;
    try {
      await admob.default().initialize();
      this.started = true;
      this.interstitial.preload();
      this.rewarded.preload();
      return true;
    } catch (err) {
      logAdError('init', err);
      return false;
    }
  }

  get isReady(): boolean {
    return this.started;
  }

  // ---- Intersticial (entre exercícios, com frequência) ----

  /** Registra a conclusão de um exercício (alimenta o controle de frequência). */
  notifyExerciseCompleted(): void {
    this.exercisesSinceAd += 1;
  }

  /**
   * Exibe um intersticial SE a frequência permitir e houver anúncio em cache.
   * Nunca bloqueia: se não puder, resolve false imediatamente.
   */
  async maybeShowInterstitial(): Promise<boolean> {
    if (!this.isReady || this.adFree) return false;
    const now = Date.now();
    if (this.exercisesSinceAd < AD_FREQUENCY.interstitialEveryExercises) return false;
    if (now - this.lastInterstitialAt < AD_FREQUENCY.interstitialMinIntervalMs) return false;
    if (!this.interstitial.isReady()) return false;
    const shown = await this.interstitial.show();
    if (shown) {
      this.lastInterstitialAt = now;
      this.exercisesSinceAd = 0;
    }
    return shown;
  }

  // ---- Recompensado (ações específicas, opt-in) ----

  /**
   * Exibe um recompensado; resolve true se ganhou a recompensa. Ao ganhar,
   * libera uma janela sem intersticiais (recompensa concreta).
   */
  async showRewarded(): Promise<boolean> {
    if (!this.isReady || !this.rewarded.isReady()) return false;
    const earned = await this.rewarded.show();
    if (earned) this.adFreeUntil = Date.now() + AD_REWARD_FREE_MS;
    return earned;
  }

  /** Há um recompensado pronto para oferecer? */
  get rewardedReady(): boolean {
    return this.isReady && this.rewarded.isReady();
  }
}

export const AdService = new AdServiceImpl();
