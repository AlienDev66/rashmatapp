/** Thin Stripe HTTP helpers (v1 form + v2 JSON). */

/** Preview API version required for Accounts v2 / Account Links v2. */
export function stripeApiVersion(): string {
  return (
    Deno.env.get("STRIPE_API_VERSION")?.trim() ||
    "2026-08-26.preview"
  );
}

function stripeErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;
  const d = data as Record<string, unknown>;
  const err = d.error;
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const e = err as Record<string, unknown>;
    const msg = typeof e.message === "string" ? e.message : null;
    const code = typeof e.code === "string" ? e.code : null;
    if (msg && code) return `${msg} (${code})`;
    if (msg) return msg;
  }
  if (typeof d.message === "string") return d.message;
  try {
    return `${fallback}: ${JSON.stringify(data).slice(0, 280)}`;
  } catch {
    return fallback;
  }
}

export async function stripeV1Form(
  secretKey: string,
  path: string,
  params: Record<string, string>,
) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(stripeErrorMessage(data, `Stripe ${path} failed`));
  }
  return data;
}

export async function stripeV1Get(secretKey: string, path: string) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(stripeErrorMessage(data, `Stripe GET ${path} failed`));
  }
  return data;
}

export async function stripeV2Json(
  secretKey: string,
  path: string,
  body?: Record<string, unknown>,
  method: "GET" | "POST" = "POST",
) {
  const res = await fetch(`https://api.stripe.com/v2/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Stripe-Version": stripeApiVersion(),
      "Content-Type": "application/json",
    },
    body: method !== "GET" && body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(stripeErrorMessage(data, `Stripe v2 ${path} failed (${res.status})`));
  }
  return data;
}

/** True when Connect payouts can receive destination charges. */
export function connectAccountReady(account: {
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
  details_submitted?: boolean;
}): boolean {
  return Boolean(account.charges_enabled || account.payouts_enabled);
}
