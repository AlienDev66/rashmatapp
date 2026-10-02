// Create Stripe Checkout Session for a premium program (destination charge → creator).
// localhost → test Stripe; production → live Stripe.
// Secrets: STRIPE_SECRET_KEY_TEST / STRIPE_SECRET_KEY_LIVE, SITE_URL, STRIPE_PLATFORM_FEE_BPS

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  connectProfileFields,
  resolveSiteOrigin,
  stripeModeForOrigin,
  stripeSecretKey,
} from "../_shared/stripeEnv.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

async function stripeForm(secretKey: string, path: string, params: Record<string, string>) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? `Stripe ${path} failed`);
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Missing Authorization" }, 401);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);

  let programId = "";
  let returnOrigin = "";
  try {
    const body = await req.json();
    programId = String(body?.programId ?? "").trim();
    returnOrigin = String(body?.returnOrigin ?? "").trim();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  if (!programId) return json({ error: "programId required" }, 400);

  const mode = stripeModeForOrigin(returnOrigin);
  const secretKey = stripeSecretKey(mode);
  if (!secretKey) {
    return json(
      {
        error:
          mode === "live"
            ? "STRIPE_SECRET_KEY_LIVE (or STRIPE_SECRET_KEY) missing"
            : "STRIPE_SECRET_KEY_TEST (or STRIPE_SECRET_KEY) missing",
      },
      500,
    );
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const { data: program, error: pErr } = await admin
    .from("programs")
    .select(
      "id, title, description, cover_url, status, is_premium, price_cents, currency, creator_user_id",
    )
    .eq("id", programId)
    .maybeSingle();

  if (pErr) return json({ error: pErr.message }, 500);
  if (!program || program.status !== "published") {
    return json({ error: "Program unavailable" }, 404);
  }
  if (!program.is_premium || !program.price_cents || program.price_cents <= 0) {
    return json({ error: "Program is free — use in-app unlock" }, 400);
  }
  if (!program.creator_user_id) {
    return json({ error: "Program has no creator account" }, 400);
  }

  const fields = connectProfileFields(mode);
  const { data: creator, error: cErr } = await admin
    .from("profiles")
    .select(`${fields.accountId}, ${fields.chargesEnabled}`)
    .eq("id", program.creator_user_id)
    .maybeSingle();

  if (cErr) return json({ error: cErr.message }, 500);
  const creatorRow = creator as Record<string, unknown> | null;
  const destAccount = (creatorRow?.[fields.accountId] as string | undefined) ?? "";
  const chargesOk = Boolean(creatorRow?.[fields.chargesEnabled]);
  if (!destAccount || !chargesOk) {
    return json(
      {
        error:
          mode === "live"
            ? "Creator payouts are not ready yet (live Connect required on production)"
            : "Creator payouts are not ready yet",
      },
      400,
    );
  }

  const { data: existing } = await admin
    .from("user_program_enrollments")
    .select("program_id")
    .eq("user_id", userData.user.id)
    .eq("program_id", programId)
    .maybeSingle();
  if (existing) return json({ error: "Already enrolled", already: true }, 409);

  const site = resolveSiteOrigin(returnOrigin);
  const currency = (program.currency || "eur").toLowerCase();
  const amount = program.price_cents as number;
  const feeBps = Number(Deno.env.get("STRIPE_PLATFORM_FEE_BPS") ?? "1000");
  const applicationFee = Math.max(0, Math.round((amount * feeBps) / 10000));

  try {
    const session = await stripeForm(secretKey, "checkout/sessions", {
      mode: "payment",
      success_url: `${site}/p/${programId}?paid=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/p/${programId}?paid=0`,
      client_reference_id: userData.user.id,
      customer_email: userData.user.email ?? "",
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": currency,
      "line_items[0][price_data][unit_amount]": String(amount),
      "line_items[0][price_data][product_data][name]": program.title,
      "line_items[0][price_data][product_data][description]":
        (program.description ?? "").slice(0, 400) || "RASHMAT camp access",
      "payment_intent_data[application_fee_amount]": String(applicationFee),
      "payment_intent_data[transfer_data][destination]": destAccount,
      "metadata[program_id]": programId,
      "metadata[user_id]": userData.user.id,
      "metadata[creator_user_id]": program.creator_user_id,
      "metadata[stripe_mode]": mode,
    });

    return json({ url: session.url, sessionId: session.id, mode });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Checkout failed" }, 500);
  }
});
