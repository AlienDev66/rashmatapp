/**
 * Resolve a playable URL for session video.
 * Prefer Mux HLS when present; otherwise direct video_url (Storage MP4).
 */
export function muxPlaybackUrl(playbackId: string) {
  return `https://stream.mux.com/${playbackId}.m3u8`;
}

export function resolveVideoUrl(opts: {
  muxPlaybackId?: string | null;
  videoUrl?: string | null;
}) {
  if (opts.muxPlaybackId) return muxPlaybackUrl(opts.muxPlaybackId);
  if (opts.videoUrl) return opts.videoUrl;

  const sample = process.env.EXPO_PUBLIC_MUX_SAMPLE_PLAYBACK_ID;
  if (sample) return muxPlaybackUrl(sample);

  // Public sample for UI without any video configured
  return "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4";
}
