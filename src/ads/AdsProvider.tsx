import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { AdService } from './AdService';

/**
 * Cola React ↔ AdService. O app é gratuito e os anúncios aparecem para TODOS,
 * então inicializa os anúncios sempre. Nenhuma tela toca no SDK diretamente.
 */
interface AdsValue {
  /** SDK inicializado — banners podem tentar renderizar. */
  ready: boolean;
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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    AdService.start().then((ok) => {
      if (active) setReady(ok);
    });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AdsValue>(
    () => ({
      ready,
      notifyExerciseCompleted: () => AdService.notifyExerciseCompleted(),
      maybeShowInterstitial: () => AdService.maybeShowInterstitial(),
      rewardedReady: AdService.rewardedReady,
      showRewarded: () => AdService.showRewarded(),
    }),
    [ready],
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
