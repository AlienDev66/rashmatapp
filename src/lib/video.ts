/**
 * Resolve a playable URL for session video.
 * Prefer Mux playback ID → HLS; fall back to direct video_url / sample env.
 */
export function muxPlaybackUrl(playbackId: string) {
  return `https://stream.mux.com/${playbackId}.m3u8`;
}

export function resolveVideoUrl(opts: {
  muxPlaybackId?: string | null;
  videoUrl?: string | null;
}) {
  if (opts.muxPlaybackId) return muxPlaybackUrl(opts.muxPlaybackId);

  const sample = process.env.EXPO_PUBLIC_MUX_SAMPLE_PLAYBACK_ID;
  if (sample) return muxPlaybackUrl(sample);

  if (opts.videoUrl) return opts.videoUrl;

  // Public sample for UI without Mux configured
  return "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4";
}
