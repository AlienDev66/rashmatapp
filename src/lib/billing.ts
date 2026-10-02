/**
 * Billing / monetization feature flags.
 *
 * Soft launch (App Store 1.0): free unlock only — no card UI, no priced IAP.
 * Phase 2: set `storeKitEnabled` to true and wire real StoreKit / RevenueCat.
 * Keep paywall plan UI + checkout card form behind that flag (do not delete).
 */
export const billing = {
  /** Real App Store IAP / subscriptions. Off until StoreKit is live. */
  storeKitEnabled: false,
  /** Soft-launch: enroll / unlock without payment UI. */
  freeUnlockEnabled: true,
} as const;

export function isStoreKitLive() {
  return billing.storeKitEnabled;
}

export function isFreeUnlockSoftLaunch() {
  return !billing.storeKitEnabled && billing.freeUnlockEnabled;
}
