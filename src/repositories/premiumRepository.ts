import { storage } from '@/services/storage';

/**
 * Persistência do estado Premium. Por enquanto guarda só um override de
 * desenvolvimento (para testar Free vs Pro sem billing). Quando o Google Play
 * Billing entrar, o direito real de compra também será resolvido aqui.
 */
const STORAGE_KEY = '@workout_planner/premium';

export interface PremiumState {
  /** Override manual de dev: força Pro (true) / Free (false). undefined = padrão. */
  devPro?: boolean;
}

export const premiumRepository = {
  async get(): Promise<PremiumState> {
    return (await storage.get<PremiumState>(STORAGE_KEY)) ?? {};
  },

  async save(state: PremiumState): Promise<void> {
    await storage.set(STORAGE_KEY, state);
  },
};
