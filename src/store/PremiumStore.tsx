import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { DEFAULT_IS_PRO } from '@/ads/adConfig';
import { billingService, Entitlement } from '@/premium/BillingService';
import { premiumRepository } from '@/repositories/premiumRepository';

/**
 * PremiumManager: fonte ÚNICA do estado Pro. Carrega o direito salvo ao abrir,
 * expõe `isPro` para todo o app e concentra compra/restauração via o
 * `billingService` (hoje dev/placeholder; Google Play depois — sem mudar a UI).
 */
interface PremiumValue {
  isPro: boolean;
  loading: boolean;
  /** Metadados da licença (tipo, data) para a tela de status. */
  entitlement: Entitlement;
  /** Loja real disponível? (habilita botões de compra reais no futuro) */
  billingAvailable: boolean;
  /** Inicia a compra vitalícia; resolve true se virou Pro. */
  purchasePro: () => Promise<boolean>;
  /** Restaura compra anterior; resolve true se recuperou Pro. */
  restorePurchase: () => Promise<boolean>;
  /** Override de dev (Settings) para testar Free vs Pro sem loja. */
  setDevPro: (value: boolean) => void;
}

const FREE: Entitlement = { pro: DEFAULT_IS_PRO };

const PremiumContext = createContext<PremiumValue | undefined>(undefined);

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const [entitlement, setEntitlement] = useState<Entitlement>(FREE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const stored = await premiumRepository.get();
      if (!active) return;
      if (stored.entitlement) setEntitlement(stored.entitlement);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  /** Aplica um novo direito: atualiza o estado e persiste. */
  const apply = useCallback((next: Entitlement) => {
    setEntitlement(next);
    void premiumRepository.save({ entitlement: next });
  }, []);

  const purchasePro = useCallback(async () => {
    const ent = await billingService.purchaseLifetime();
    apply(ent);
    return ent.pro;
  }, [apply]);

  const restorePurchase = useCallback(async () => {
    const ent = await billingService.restore();
    if (ent) apply(ent);
    return ent?.pro ?? false;
  }, [apply]);

  const setDevPro = useCallback(
    (value: boolean) => apply({ pro: value, licenseType: 'dev' }),
    [apply],
  );

  const value = useMemo<PremiumValue>(
    () => ({
      isPro: entitlement.pro,
      loading,
      entitlement,
      billingAvailable: billingService.available,
      purchasePro,
      restorePurchase,
      setDevPro,
    }),
    [entitlement, loading, purchasePro, restorePurchase, setDevPro],
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
