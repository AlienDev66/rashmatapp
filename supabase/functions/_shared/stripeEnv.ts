/** Shared Stripe env helpers for Edge Functions. */

export type StripeMode = "test" | "live";

export function isDevOrigin(origin: string | null | undefined): boolean {
  if (!origin) return false;
  try {
    const host = new URL(origin).hostname;
    return host === "localhost" || host === "127.0.0.1";
  } catch {
    return false;
  }
}

/** localhost → test; rashmat.com (and anything else allowlisted) → live. */
export function stripeModeForOrigin(origin: string | null | undefined): StripeMode {
  return isDevOrigin(origin) ? "test" : "live";
}

export function resolveSiteOrigin(requested: string | null | undefined) {
  const fallback = (Deno.env.get("SITE_URL") ?? "https://rashmat.com").replace(/\/$/, "");
  if (!requested) return fallback;
  try {
    const u = new URL(requested);
    const host = u.hostname;
    const ok =
      host === "rashmat.com" ||
      host === "www.rashmat.com" ||
      host === "localhost" ||
      host === "127.0.0.1";
    if (!ok || (u.protocol !== "http:" && u.protocol !== "https:")) return fallback;
    return `${u.protocol}//${u.host}`.replace(/\/$/, "");
  } catch {
    return fallback;
  }
}

/**
 * Secret API key for the mode.
 * - test: STRIPE_SECRET_KEY_TEST || STRIPE_SECRET_KEY
 * - live: STRIPE_SECRET_KEY_LIVE || STRIPE_SECRET_KEY (fallback until live is configured)
 */
export function stripeSecretKey(mode: StripeMode): string {
  if (mode === "test") {
    return (
      Deno.env.get("STRIPE_SECRET_KEY_TEST")?.trim() ||
      Deno.env.get("STRIPE_SECRET_KEY")?.trim() ||
      ""
    );
  }
  return (
    Deno.env.get("STRIPE_SECRET_KEY_LIVE")?.trim() ||
    Deno.env.get("STRIPE_SECRET_KEY")?.trim() ||
    ""
  );
}

/** Webhook secrets to try (test + live + legacy). */
export function stripeWebhookSecrets(): string[] {
  const list = [
    Deno.env.get("STRIPE_WEBHOOK_SECRET_TEST"),
    Deno.env.get("STRIPE_WEBHOOK_SECRET_LIVE"),
    Deno.env.get("STRIPE_WEBHOOK_SECRET"),
  ]
    .map((s) => s?.trim())
    .filter((s): s is string => Boolean(s));
  return [...new Set(list)];
}

/** Profile column names for Connect Express (test uses legacy columns). */
export function connectProfileFields(mode: StripeMode) {
  if (mode === "live") {
    return {
      accountId: "stripe_account_id_live" as const,
      chargesEnabled: "stripe_charges_enabled_live" as const,
      detailsSubmitted: "stripe_details_submitted_live" as const,
    };
  }
  return {
    accountId: "stripe_account_id" as const,
    chargesEnabled: "stripe_charges_enabled" as const,
    detailsSubmitted: "stripe_details_submitted" as const,
  };
}
