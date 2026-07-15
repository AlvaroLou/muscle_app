import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { usePremium } from '@/store/PremiumStore';
import { AdService } from './AdService';

/**
 * Cola React ↔ AdService. Inicializa (ou encerra) os anúncios conforme a versão
 * Free/Pro e expõe as ações desacopladas da UI. Nenhuma tela toca no SDK.
 */
interface AdsValue {
  /** SDK inicializado e Free — banners podem tentar renderizar. */
  ready: boolean;
  isPro: boolean;
  /** Conta um exercício concluído (controle de frequência do intersticial). */
  notifyExerciseCompleted: () => void;
  /** Exibe intersticial se a frequência permitir; resolve false se não. */
  maybeShowInterstitial: () => Promise<boolean>;
  /** Há recompensado pronto para oferecer? */
  rewardedReady: boolean;
  /** Exibe recompensado; resolve true se ganhou a recompensa. */
  showRewarded: () => Promise<boolean>;
}

const AdsContext = createContext<AdsValue | undefined>(undefined);

export function AdsProvider({ children }: { children: React.ReactNode }) {
  const { isPro, loading } = usePremium();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading) return;
    let active = true;
    AdService.setPro(isPro);
    if (isPro) {
      setReady(false);
      return;
    }
    AdService.start().then((ok) => {
      if (active) setReady(ok);
    });
    return () => {
      active = false;
    };
  }, [isPro, loading]);

  const value = useMemo<AdsValue>(
    () => ({
      ready,
      isPro,
      notifyExerciseCompleted: () => AdService.notifyExerciseCompleted(),
      maybeShowInterstitial: () => AdService.maybeShowInterstitial(),
      rewardedReady: AdService.rewardedReady,
      showRewarded: () => AdService.showRewarded(),
    }),
    [ready, isPro],
  );

  return <AdsContext.Provider value={value}>{children}</AdsContext.Provider>;
}

export function useAds(): AdsValue {
  const ctx = useContext(AdsContext);
  if (!ctx) {
    throw new Error('useAds deve ser usado dentro de <AdsProvider>.');
  }
  return ctx;
}
