import * as FileSystem from "expo-file-system/legacy";
import { cacheGet, cacheSet } from "@/src/lib/cache";

type OfflineMap = Record<string, string>;

const MAP_KEY = "offline.videos";

function offlineDir() {
  return `${FileSystem.documentDirectory ?? ""}rashmat-offline/`;
}

function filePathFor(key: string) {
  const safe = key.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `${offlineDir()}${safe}.mp4`;
}

async function ensureDir() {
  const dir = offlineDir();
  if (!dir) return;
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
}

export async function getOfflineVideoUri(cacheKey: string): Promise<string | null> {
  const map = (await cacheGet<OfflineMap>(MAP_KEY)) ?? {};
  const uri = map[cacheKey];
  if (!uri) return null;
  const info = await FileSystem.getInfoAsync(uri);
  return info.exists ? uri : null;
}

export async function isSessionOffline(sessionId: string, exerciseIds: string[]) {
  const keys = exerciseIds.length > 0 ? exerciseIds : [sessionId];
  const results = await Promise.all(keys.map((k) => getOfflineVideoUri(k)));
  // Ready when at least half of clips (or the session file) are cached
  const hit = results.filter(Boolean).length;
  return hit > 0 && hit >= Math.ceil(keys.length / 2);
}

/**
 * Download session + exercise videos for offline playback.
 * Uses direct video_url (MP4). Mux HLS (.m3u8) is skipped — those stream online only.
 */
export async function downloadSessionOffline(opts: {
  sessionId: string;
  muxPlaybackId?: string | null;
  videoUrl?: string | null;
  exercises: Array<{
    id: string;
    muxPlaybackId?: string | null;
    videoUrl?: string | null;
  }>;
  onProgress?: (pct: number) => void;
}) {
  await ensureDir();
  const map = (await cacheGet<OfflineMap>(MAP_KEY)) ?? {};
  const sessionFallback =
    opts.videoUrl && !opts.videoUrl.includes(".m3u8") ? opts.videoUrl : null;

  const items = [
    {
      key: opts.sessionId,
      url: sessionFallback,
    },
    ...opts.exercises.map((ex) => {
      const direct =
        ex.videoUrl && !ex.videoUrl.includes(".m3u8")
          ? ex.videoUrl
          : sessionFallback;
      return { key: ex.id, url: direct };
    }),
  ].filter((item): item is { key: string; url: string } => !!item.url);

  if (items.length === 0) {
    throw new Error(
      "No downloadable MP4 URLs for this session. Mux HLS streams online only.",
    );
  }

  let done = 0;
  for (const item of items) {
    const dest = filePathFor(item.key);
    const existing = await FileSystem.getInfoAsync(dest);
    if (!existing.exists) {
      const result = await FileSystem.downloadAsync(item.url, dest);
      map[item.key] = result.uri;
    } else {
      map[item.key] = dest;
    }
    done += 1;
    opts.onProgress?.(Math.round((done / items.length) * 100));
  }

  await cacheSet(MAP_KEY, map);
  return map;
}
