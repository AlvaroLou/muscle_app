/**
 * Abstração de cobrança. Hoje há uma implementação de DESENVOLVIMENTO
 * (placeholder, sem loja real) para validar a versão Pro pelo toggle. Quando o
 * Google Play Billing entrar, basta criar um `playBillingService` que implemente
 * esta mesma interface — o PremiumStore e as telas NÃO mudam.
 */

/** Tipo de licença Pro. `dev` = liberado manualmente para teste. */
export type LicenseType = 'lifetime' | 'monthly' | 'yearly' | 'dev';

/** Direito atual do usuário (Pro ou não) + metadados da licença. */
export interface Entitlement {
  pro: boolean;
  licenseType?: LicenseType;
  /** Epoch ms da compra, quando disponível. */
  purchasedAt?: number;
}

export interface BillingService {
  /** A loja real está disponível neste build? (dev = false) */
  readonly available: boolean;
  /** Reconsulta a loja e devolve o direito, ou null se nada a restaurar. */
  restore(): Promise<Entitlement | null>;
  /** Inicia a compra vitalícia; resolve com o direito concedido. */
  purchaseLifetime(): Promise<Entitlement>;
}

/**
 * Implementação de desenvolvimento: concede Pro imediatamente (sem loja). Serve
 * para validar toda a UI/gating antes de o billing real existir.
 */
export const devBillingService: BillingService = {
  available: false,

  async restore() {
    // Sem loja real: nada a restaurar automaticamente.
    return null;
  },

  async purchaseLifetime() {
    return { pro: true, licenseType: 'lifetime', purchasedAt: Date.now() };
  },
};

/** Serviço de billing ativo. Trocar por `playBillingService` no futuro. */
export const billingService: BillingService = devBillingService;
