// Supabase Edge Function: platform-owned Mux Direct Upload
// Secrets (Supabase dashboard → Edge Functions):
//   MUX_TOKEN_ID
//   MUX_TOKEN_SECRET
//
// Deploy: supabase functions deploy mux-direct-upload --project-ref <ref>
//
// Creators do NOT need Mux accounts. RASHMAT's token creates uploads; we store playback_id.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function muxAuthHeader() {
  const id = Deno.env.get("MUX_TOKEN_ID");
  const secret = Deno.env.get("MUX_TOKEN_SECRET");
  if (!id || !secret) return null;
  return `Basic ${btoa(`${id}:${secret}`)}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return json({ error: "Missing Authorization" }, 401);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) {
    return json({ error: "Unauthorized" }, 401);
  }

  const muxAuth = muxAuthHeader();
  if (!muxAuth) {
    return json(
      {
        error:
          "Mux is not configured on the server. Set MUX_TOKEN_ID and MUX_TOKEN_SECRET (RASHMAT platform account).",
      },
      503,
    );
  }

  try {
    if (req.method === "POST") {
      // Create Direct Upload
      const muxRes = await fetch("https://api.mux.com/video/v1/uploads", {
        method: "POST",
        headers: {
          Authorization: muxAuth,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cors_origin: "*",
          new_asset_settings: {
            playback_policy: ["public"],
            passthrough: userData.user.id,
          },
        }),
      });

      const body = await muxRes.json();
      if (!muxRes.ok) {
        return json({ error: body?.error?.message ?? "Mux create upload failed" }, muxRes.status);
      }

      const upload = body.data;
      return json({
        uploadId: upload.id as string,
        uploadUrl: upload.url as string,
      });
    }

    if (req.method === "GET") {
      const url = new URL(req.url);
      const uploadId = url.searchParams.get("uploadId");
      if (!uploadId) return json({ error: "uploadId required" }, 400);

      const upRes = await fetch(`https://api.mux.com/video/v1/uploads/${uploadId}`, {
        headers: { Authorization: muxAuth },
      });
      const upBody = await upRes.json();
      if (!upRes.ok) {
        return json({ error: upBody?.error?.message ?? "Upload status failed" }, upRes.status);
      }

      const upload = upBody.data as {
        status: string;
        asset_id?: string;
      };

      if (!upload.asset_id) {
        return json({ status: upload.status, playbackId: null });
      }

      const assetRes = await fetch(`https://api.mux.com/video/v1/assets/${upload.asset_id}`, {
        headers: { Authorization: muxAuth },
      });
      const assetBody = await assetRes.json();
      if (!assetRes.ok) {
        return json({ error: assetBody?.error?.message ?? "Asset fetch failed" }, assetRes.status);
      }

      const playbackId =
        (assetBody.data?.playback_ids as { id: string }[] | undefined)?.[0]?.id ?? null;

      return json({
        status: assetBody.data?.status ?? upload.status,
        playbackId,
        assetId: upload.asset_id,
      });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Mux proxy error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
