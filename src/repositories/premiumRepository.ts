import type { Entitlement } from '@/premium/BillingService';
import { storage } from '@/services/storage';

/**
 * Persistência do direito Premium (entitlement). Guarda o último estado
 * conhecido para o app abrir já sabendo se é Pro, sem esperar a loja. Quando o
 * billing real entrar, ele revalida e sobrescreve isto.
 */
const STORAGE_KEY = '@workout_planner/premium';

export interface PremiumState {
  entitlement?: Entitlement;
}

export const premiumRepository = {
  async get(): Promise<PremiumState> {
    return (await storage.get<PremiumState>(STORAGE_KEY)) ?? {};
  },

  async save(state: PremiumState): Promise<void> {
    await storage.set(STORAGE_KEY, state);
  },
};
