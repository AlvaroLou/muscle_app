import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { DEFAULT_IS_PRO } from '@/ads/adConfig';
import { premiumRepository } from '@/repositories/premiumRepository';

/**
 * PremiumManager: fonte única do estado Pro. Hoje o valor vem de um override de
 * desenvolvimento persistido (ou do padrão da config); no futuro, do Google
 * Play Billing. Todo o resto do app (anúncios inclusive) só depende de `isPro`.
 */
interface PremiumValue {
  isPro: boolean;
  loading: boolean;
  /** Override de dev (Settings) para testar Free vs Pro. */
  setDevPro: (value: boolean) => void;
}

const PremiumContext = createContext<PremiumValue | undefined>(undefined);

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const [devPro, setDevProState] = useState<boolean | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const stored = await premiumRepository.get();
      if (!active) return;
      setDevProState(stored.devPro);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const setDevPro = useCallback((value: boolean) => {
    setDevProState(value);
    void premiumRepository.save({ devPro: value });
  }, []);

  const isPro = devPro ?? DEFAULT_IS_PRO;

  const value = useMemo<PremiumValue>(
    () => ({ isPro, loading, setDevPro }),
    [isPro, loading, setDevPro],
  );

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
}

export function usePremium(): PremiumValue {
  const ctx = useContext(PremiumContext);
  if (!ctx) {
    throw new Error('usePremium deve ser usado dentro de <PremiumProvider>.');
  }
  return ctx;
}
