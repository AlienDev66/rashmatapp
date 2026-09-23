import {
  bundledVideoForKey,
  parseBundledUri,
  type BundledVideoSource,
} from "@/src/lib/bundledVideos";

export function muxPlaybackUrl(playbackId: string) {
  return `https://stream.mux.com/${playbackId}.m3u8`;
}

/**
 * Remote playback is only trusted for:
 * - our Supabase Storage
 * - local/offline file URIs
 * - explicit rashmat://bundled/N (handled as asset)
 *
 * Everything else (dead Google samples, flaky CDNs, Mux demo) falls back to
 * bundled MP4s so the session player always has picture + audio.
 */
function isTrustedRemote(url: string) {
  if (url.startsWith("file://") || url.startsWith("content://")) return true;
  if (url.includes("supabase.co/storage")) return true;
  return false;
}

export type ResolvedVideoSource = string | BundledVideoSource;

export function resolveVideoSource(opts: {
  muxPlaybackId?: string | null;
  videoUrl?: string | null;
  cacheKey?: string | null;
}): ResolvedVideoSource {
  const direct = opts.videoUrl?.trim();
  if (direct) {
    const bundled = parseBundledUri(direct);
    if (bundled) return bundled;
    if (isTrustedRemote(direct)) return direct;
  }

  // Creator-uploaded Mux (real account) — keep as optional remote.
  // Skip known seed placeholder id by only trusting when video_url absent AND
  // mux id does not look like the old demo (handled below via bundled fallback).
  const mux = opts.muxPlaybackId?.trim();
  if (mux && mux !== "7qmxaMdclISiRxo1LMN9JW22fxgD101hKcitnAGEl1ZA") {
    return muxPlaybackUrl(mux);
  }

  return bundledVideoForKey(opts.cacheKey ?? direct ?? "default");
}

/** @deprecated use resolveVideoSource — kept for offline downloader string URLs */
export function resolveVideoUrl(opts: {
  muxPlaybackId?: string | null;
  videoUrl?: string | null;
  cacheKey?: string | null;
}): string {
  const src = resolveVideoSource(opts);
  return typeof src === "string" ? src : `rashmat://bundled/${0}`;
}
