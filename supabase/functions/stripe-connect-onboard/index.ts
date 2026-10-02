// Stripe Connect Express onboarding (Account Link).
// Secrets: STRIPE_SECRET_KEY_TEST / STRIPE_SECRET_KEY_LIVE (or STRIPE_SECRET_KEY), SITE_URL
// localhost → test keys + test Connect account; production → live keys + live account.

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
  const body = new URLSearchParams(params);
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message ?? `Stripe ${path} failed`);
  }
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

  const admin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  let returnOrigin = "";
  try {
    const body = await req.json();
    returnOrigin = String(body?.returnOrigin ?? "").trim();
  } catch {
    // empty body is fine
  }

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

  const fields = connectProfileFields(mode);
  const selectCols = `id, is_creator, ${fields.accountId}, ${fields.chargesEnabled}, ${fields.detailsSubmitted}`;

  const { data: profile, error: profileErr } = await admin
    .from("profiles")
    .select(selectCols)
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profileErr) return json({ error: profileErr.message }, 500);
  if (!profile?.is_creator) return json({ error: "Creator mode required" }, 403);

  const site = resolveSiteOrigin(returnOrigin);
  const refreshUrl = `${site}/studio/settings?stripe=refresh`;
  const returnUrl = `${site}/studio/settings?stripe=return`;

  const row = profile as Record<string, unknown>;
  try {
    let accountId = (row[fields.accountId] as string | null) ?? null;

    if (!accountId) {
      const account = await stripeForm(secretKey, "accounts", {
        type: "express",
        "capabilities[card_payments][requested]": "true",
        "capabilities[transfers][requested]": "true",
        "metadata[supabase_user_id]": userData.user.id,
        "metadata[stripe_mode]": mode,
        email: userData.user.email ?? "",
      });
      accountId = account.id;
      await admin
        .from("profiles")
        .update({
          [fields.accountId]: accountId,
          [fields.chargesEnabled]: Boolean(account.charges_enabled),
          [fields.detailsSubmitted]: Boolean(account.details_submitted),
        })
        .eq("id", userData.user.id);
    } else {
      const res = await fetch(`https://api.stripe.com/v1/accounts/${accountId}`, {
        headers: { Authorization: `Bearer ${secretKey}` },
      });
      const account = await res.json();
      if (res.ok) {
        await admin
          .from("profiles")
          .update({
            [fields.chargesEnabled]: Boolean(account.charges_enabled),
            [fields.detailsSubmitted]: Boolean(account.details_submitted),
          })
          .eq("id", userData.user.id);
        if (account.charges_enabled) {
          return json({
            url: null,
            ready: true,
            mode,
            charges_enabled: true,
            details_submitted: Boolean(account.details_submitted),
          });
        }
      }
    }

    const link = await stripeForm(secretKey, "account_links", {
      account: accountId!,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });

    return json({
      url: link.url,
      ready: false,
      mode,
      charges_enabled: false,
      account_id: accountId,
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Connect failed" }, 500);
  }
});
