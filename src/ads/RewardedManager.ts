import { AD_REQUEST_OPTIONS, adUnitId } from './adConfig';
import { getAdmob, logAdError } from './adModule';

/**
 * Gerencia UM anúncio recompensado com cache. `show` resolve indicando se o
 * usuário ganhou a recompensa (assistiu até o fim). Recarrega o próximo ao
 * fechar. Falhas são silenciosas.
 */
export class RewardedManager {
  private ad: any = null;
  private ready = false;
  private loading = false;

  preload(): void {
    const admob = getAdmob();
    if (!admob || this.loading || this.ready) return;
    try {
      const ad = admob.RewardedAd.createForAdRequest(
        adUnitId('rewarded'),
        AD_REQUEST_OPTIONS,
      );
      this.ad = ad;
      this.loading = true;
      ad.addAdEventListener(admob.RewardedAdEventType.LOADED, () => {
        this.ready = true;
        this.loading = false;
      });
      ad.addAdEventListener(admob.AdEventType.ERROR, (err: unknown) => {
        this.ready = false;
        this.loading = false;
        this.ad = null;
        logAdError('rewarded:load', err);
      });
      ad.addAdEventListener(admob.AdEventType.CLOSED, () => {
        this.ready = false;
        this.ad = null;
        this.preload();
      });
      ad.load();
    } catch (err) {
      this.loading = false;
      logAdError('rewarded:create', err);
    }
  }

  isReady(): boolean {
    return this.ready && this.ad != null;
  }

  /** Exibe o recompensado; resolve true se o usuário ganhou a recompensa. */
  show(): Promise<boolean> {
    return new Promise((resolve) => {
      const admob = getAdmob();
      if (!admob || !this.isReady()) {
        resolve(false);
        return;
      }
      let earned = false;
      try {
        const unReward = this.ad.addAdEventListener(
          admob.RewardedAdEventType.EARNED_REWARD,
          () => {
            earned = true;
          },
        );
        const unClosed = this.ad.addAdEventListener(admob.AdEventType.CLOSED, () => {
          unReward();
          unClosed();
          resolve(earned);
        });
        this.ad.show();
      } catch (err) {
        logAdError('rewarded:show', err);
        resolve(false);
      }
    });
  }

  destroy(): void {
    this.ad = null;
    this.ready = false;
    this.loading = false;
  }
}
