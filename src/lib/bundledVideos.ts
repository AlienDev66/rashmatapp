/** Bundled H.264 MP4s — always play on device (no CDN / Mux dependency). */
export const BUNDLED_VIDEOS = [
  require("../../assets/videos/drill-a.mp4"),
  require("../../assets/videos/drill-b.mp4"),
  require("../../assets/videos/drill-c.mp4"),
] as const;

export type BundledVideoSource = (typeof BUNDLED_VIDEOS)[number];

export function hashKey(key: string) {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h;
}

export function bundledVideoForKey(key: string): BundledVideoSource {
  return BUNDLED_VIDEOS[hashKey(key) % BUNDLED_VIDEOS.length]!;
}

export function bundledVideoAt(index: number): BundledVideoSource {
  const i = ((index % BUNDLED_VIDEOS.length) + BUNDLED_VIDEOS.length) % BUNDLED_VIDEOS.length;
  return BUNDLED_VIDEOS[i]!;
}

/** `rashmat://bundled/0` → asset require() */
export function parseBundledUri(uri: string): BundledVideoSource | null {
  const m = /^rashmat:\/\/bundled\/(\d+)$/i.exec(uri.trim());
  if (!m) return null;
  return bundledVideoAt(Number(m[1]));
}
