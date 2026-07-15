import { AD_REQUEST_OPTIONS, adUnitId } from './adConfig';
import { getAdmob, logAdError } from './adModule';

/**
 * Gerencia UM anúncio intersticial com cache: pré-carrega, informa prontidão,
 * exibe e recarrega o próximo automaticamente ao fechar. Toda falha é tratada
 * silenciosamente — nunca lança para a UI.
 */
export class InterstitialManager {
  // Objeto do anúncio nativo (tipado como unknown p/ não acoplar ao SDK).
  private ad: any = null;
  private ready = false;
  private loading = false;

  /** Pré-carrega o próximo intersticial (no-op sem SDK). */
  preload(): void {
    const admob = getAdmob();
    if (!admob || this.loading || this.ready) return;
    try {
      const ad = admob.InterstitialAd.createForAdRequest(
        adUnitId('interstitial'),
        AD_REQUEST_OPTIONS,
      );
      this.ad = ad;
      this.loading = true;
      ad.addAdEventListener(admob.AdEventType.LOADED, () => {
        this.ready = true;
        this.loading = false;
      });
      ad.addAdEventListener(admob.AdEventType.ERROR, (err: unknown) => {
        this.ready = false;
        this.loading = false;
        this.ad = null;
        logAdError('interstitial:load', err);
      });
      ad.addAdEventListener(admob.AdEventType.CLOSED, () => {
        // Consumido: descarta e já prepara o próximo.
        this.ready = false;
        this.ad = null;
        this.preload();
      });
      ad.load();
    } catch (err) {
      this.loading = false;
      logAdError('interstitial:create', err);
    }
  }

  isReady(): boolean {
    return this.ready && this.ad != null;
  }

  /** Exibe o intersticial; resolve quando fechar (ou false se indisponível). */
  show(): Promise<boolean> {
    return new Promise((resolve) => {
      const admob = getAdmob();
      if (!admob || !this.isReady()) {
        resolve(false);
        return;
      }
      try {
        const unsub = this.ad.addAdEventListener(admob.AdEventType.CLOSED, () => {
          unsub();
          resolve(true);
        });
        this.ad.show();
      } catch (err) {
        logAdError('interstitial:show', err);
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
