# Mux on RASHMAT (platform-owned)

## Do creators need a Mux account?

**No.** Creators never sign up for Mux or pay Mux.

RASHMAT holds **one** Mux organization. Studio calls our Edge Function
`mux-direct-upload`, which uses `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET` to create a
[Direct Upload](https://docs.mux.com/guides/upload-files-directly). The file goes
straight to Mux; we store the resulting `playback_id` on the session/drill.

Athletes play HLS via `https://stream.mux.com/{playback_id}.m3u8` (already wired in the app).

## Who pays Mux?

**RASHMAT** (encoding + delivery). You fold that cost into Pro / program pricing later.
Creators only “pay” if you charge them a platform cut — not a Mux invoice.

## Setup

1. Create a Mux account for the company (not per coach).
2. Access Token with **Mux Video** write access.
3. Supabase secrets:

```bash
supabase secrets set MUX_TOKEN_ID=... MUX_TOKEN_SECRET=...
supabase functions deploy mux-direct-upload
```

4. Studio CMS → **Upload video** on a session or drill (falls back to paste ID if the function is not deployed).

## Why Mux (not only Supabase Storage MP4)?

| | Mux HLS | Raw MP4 in Storage |
|--|---------|-------------------|
| Adaptive quality | Yes | No |
| Mobile training | Smooth | Buffer / huge files |
| Offline | Harder (we skip HLS offline today) | Easier |
| Cost | Usage-based | Storage + bandwidth |

Architecture decision (locked in `ARCHITECTURE.md`): Mux for workout streaming.

## Fallback

Until secrets + function are live, CMS still accepts **paste playback ID** (for ops / sample assets).
