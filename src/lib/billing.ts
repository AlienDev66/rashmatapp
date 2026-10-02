/**
 * Billing / monetization feature flags.
 *
 * Soft launch App Store 1.0: no StoreKit IAP.
 * Premium camps: pay on the web (Stripe Connect) — App Store 3.1.1 safe.
 * Free (non-premium) camps: still unlock in-app via enroll.
 */
export const billing = {
  /** Real App Store IAP / subscriptions. Off until StoreKit is live. */
  storeKitEnabled: false,
  /**
   * Free unlock for non-premium camps (and legacy soft-launch when web checkout off).
   */
  freeUnlockEnabled: true,
  /**
   * Premium + priced camps open Safari / rashmat.com for Stripe Checkout
   * (no in-app payment UI).
   */
  webCheckoutEnabled: true,
} as const;

export function isStoreKitLive() {
  return billing.storeKitEnabled;
}

export function isFreeUnlockSoftLaunch() {
  return !billing.storeKitEnabled && billing.freeUnlockEnabled;
}

/** Premium camps that must be purchased on the web. */
export function isWebPaidUnlock(program: {
  isPremium?: boolean;
  priceCents?: number | null;
}) {
  return (
    billing.webCheckoutEnabled &&
    Boolean(program.isPremium) &&
    (program.priceCents ?? 0) > 0
  );
}

export function programWebCheckoutUrl(programId: string) {
  return `https://rashmat.com/p/${encodeURIComponent(programId)}`;
}
