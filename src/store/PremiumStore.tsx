import React, { createContext, useContext, useMemo } from 'react';

import { Entitlement } from '@/premium/BillingService';

/**
 * Estado Pro do app. A versão publicada é 100% GRATUITA com TODOS os recursos
 * antes "Pro" liberados e SEM anúncios — ou seja, `isPro` é sempre `true`.
 *
 * A interface (purchase/restore/setDevPro) é mantida como no-op para não quebrar
 * as telas que ainda a consomem; se um dia voltar a existir um plano pago, basta
 * reintroduzir o billing aqui sem tocar na UI.
 */
interface PremiumValue {
  isPro: boolean;
  loading: boolean;
  /** Metadados da licença (usado só para exibição). */
  entitlement: Entitlement;
  /** Loja real disponível? Sempre false (sem billing). */
  billingAvailable: boolean;
  purchasePro: () => Promise<boolean>;
  restorePurchase: () => Promise<boolean>;
  setDevPro: (value: boolean) => void;
}

/** Todos os usuários têm o direito completo (vitalício), sem loja. */
const UNLOCKED: Entitlement = { pro: true, licenseType: 'lifetime' };

const PremiumContext = createContext<PremiumValue | undefined>(undefined);

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo<PremiumValue>(
    () => ({
      isPro: true,
      loading: false,
      entitlement: UNLOCKED,
      billingAvailable: false,
      purchasePro: async () => true,
      restorePurchase: async () => true,
      setDevPro: () => {},
    }),
    [],
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