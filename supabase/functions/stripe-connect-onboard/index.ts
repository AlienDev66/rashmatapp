// Stripe Connect onboarding via Accounts v2 + Account Links v2.
// Live platforms without Accounts v1 eligibility must use this path.
// Secrets: STRIPE_SECRET_KEY_TEST / STRIPE_SECRET_KEY_LIVE, SITE_URL
// Optional: STRIPE_API_VERSION (default 2026-08-26.preview)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  connectAccountReady,
  stripeV1Form,
  stripeV1Get,
  stripeV2Json,
} from "../_shared/stripeApi.ts";
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

function displayNameFromUser(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): string {
  const meta = user.user_metadata ?? {};
  const fromMeta =
    (typeof meta.full_name === "string" && meta.full_name.trim()) ||
    (typeof meta.name === "string" && meta.name.trim()) ||
    "";
  if (fromMeta) return fromMeta.slice(0, 120);
  const email = user.email?.split("@")[0]?.trim();
  return (email || "RASHMAT creator").slice(0, 120);
}

function connectDefaultCountry(): string {
  const raw = (Deno.env.get("STRIPE_CONNECT_DEFAULT_COUNTRY") ?? "PT").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(raw) ? raw : "PT";
}

async function createConnectAccountV2(
  secretKey: string,
  opts: { email: string; displayName: string; userId: string; mode: string },
) {
  // Marketplace-style Express: recipient (destination charges) + merchant (card_payments).
  // identity.country is required before merchant/recipient configuration.
  return await stripeV2Json(secretKey, "core/accounts", {
    contact_email: opts.email || undefined,
    display_name: opts.displayName,
    dashboard: "express",
    identity: {
      country: connectDefaultCountry(),
    },
    defaults: {
      responsibilities: {
        fees_collector: "application",
        losses_collector: "application",
      },
    },
    configuration: {
      merchant: {
        capabilities: {
          card_payments: { requested: true },
        },
      },
      recipient: {
        capabilities: {
          stripe_balance: {
            stripe_transfers: { requested: true },
          },
        },
      },
    },
    include: [
      "configuration.merchant",
      "configuration.recipient",
      "identity",
      "defaults",
      "requirements",
    ],
  });
}

async function createAccountOnboardingLink(
  secretKey: string,
  accountId: string,
  returnUrl: string,
  refreshUrl: string,
) {
  try {
    return await stripeV2Json(secretKey, "core/account_links", {
      account: accountId,
      use_case: {
        type: "account_onboarding",
        account_onboarding: {
          configurations: ["merchant", "recipient"],
          return_url: returnUrl,
          refresh_url: refreshUrl,
        },
      },
    });
  } catch (v2Err) {
    // Legacy Express (Accounts v1) accounts — still used in sandbox test onboarding.
    try {
      return await stripeV1Form(secretKey, "account_links", {
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: "account_onboarding",
      });
    } catch {
      throw v2Err;
    }
  }
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
  const selectCols = `id, is_creator, full_name, ${fields.accountId}, ${fields.chargesEnabled}, ${fields.detailsSubmitted}`;

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
  const nameFromProfile =
    typeof row.full_name === "string" && row.full_name.trim()
      ? row.full_name.trim()
      : displayNameFromUser(userData.user);

  try {
    let accountId = (row[fields.accountId] as string | null) ?? null;

    if (!accountId) {
      const account = await createConnectAccountV2(secretKey, {
        email: userData.user.email ?? "",
        displayName: nameFromProfile,
        userId: userData.user.id,
        mode,
      });
      accountId = account.id as string;
      await admin
        .from("profiles")
        .update({
          [fields.accountId]: accountId,
          [fields.chargesEnabled]: false,
          [fields.detailsSubmitted]: false,
        })
        .eq("id", userData.user.id);
    }

    // v1 retrieve works for both v1 and v2 Account IDs (Stripe compatibility).
    let chargesEnabled = false;
    let detailsSubmitted = false;
    try {
      const account = await stripeV1Get(secretKey, `accounts/${accountId}`);
      chargesEnabled = connectAccountReady(account);
      detailsSubmitted = Boolean(account.details_submitted);
      await admin
        .from("profiles")
        .update({
          [fields.chargesEnabled]: chargesEnabled,
          [fields.detailsSubmitted]: detailsSubmitted,
        })
        .eq("id", userData.user.id);

      if (chargesEnabled) {
        return json({
          url: null,
          ready: true,
          mode,
          charges_enabled: true,
          details_submitted: detailsSubmitted,
        });
      }
    } catch {
      // Account may be brand-new; continue to Account Link.
    }

    const link = await createAccountOnboardingLink(
      secretKey,
      accountId!,
      returnUrl,
      refreshUrl,
    );

    return json({
      url: link.url,
      ready: false,
      mode,
      charges_enabled: chargesEnabled,
      account_id: accountId,
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Connect failed" }, 500);
  }
});
