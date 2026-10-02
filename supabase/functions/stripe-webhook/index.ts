// Stripe webhook → enroll_after_purchase
// Accepts both test + live signing secrets (try until one verifies).
// Secrets: STRIPE_WEBHOOK_SECRET_TEST / _LIVE (or STRIPE_WEBHOOK_SECRET)
// Deploy: supabase functions deploy stripe-webhook --no-verify-jwt

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { stripeWebhookSecrets } from "../_shared/stripeEnv.ts";

async function verifyStripeSignature(
  payload: string,
  header: string | null,
  secret: string,
): Promise<boolean> {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k.trim(), v];
    }),
  );
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${timestamp}.${payload}`),
  );
  const digest = Array.from(new Uint8Array(signed))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (digest.length !== signature.length) return false;
  let ok = 0;
  for (let i = 0; i < digest.length; i++) {
    ok |= digest.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return ok === 0;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const secrets = stripeWebhookSecrets();
  if (secrets.length === 0) {
    return new Response("Webhook secret missing", { status: 500 });
  }

  const payload = await req.text();
  const header = req.headers.get("stripe-signature");
  let verified = false;
  for (const secret of secrets) {
    if (await verifyStripeSignature(payload, header, secret)) {
      verified = true;
      break;
    }
  }
  if (!verified) return new Response("Invalid signature", { status: 400 });

  let event: {
    type: string;
    livemode?: boolean;
    data: { object: Record<string, unknown> };
  };
  try {
    event = JSON.parse(payload);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const session = event.data.object;
  const meta = (session.metadata ?? {}) as Record<string, string>;
  const userId =
    meta.user_id || (session.client_reference_id as string | undefined) || "";
  const programId = meta.program_id || "";
  const sessionId = String(session.id ?? "");
  const paymentIntent =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : null;
  const amount =
    typeof session.amount_total === "number" ? session.amount_total : 0;
  const currency =
    typeof session.currency === "string" ? session.currency : "eur";

  if (!userId || !programId || !sessionId) {
    return new Response("Missing metadata", { status: 400 });
  }

  if (session.payment_status && session.payment_status !== "paid") {
    return new Response(JSON.stringify({ received: true, skipped: "unpaid" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const { error } = await admin.rpc("enroll_after_purchase", {
    p_user_id: userId,
    p_program_id: programId,
    p_session_id: sessionId,
    p_payment_intent: paymentIntent,
    p_amount_cents: amount,
    p_currency: currency,
  });

  if (error) {
    console.error("enroll_after_purchase", error);
    return new Response(error.message, { status: 500 });
  }

  return new Response(
    JSON.stringify({
      received: true,
      enrolled: true,
      livemode: Boolean(event.livemode),
    }),
    { headers: { "Content-Type": "application/json" } },
  );
});
