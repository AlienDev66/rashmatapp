import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";
import type { StudioProgram } from "@/src/data/studio";

const PLACEHOLDER_COVER =
  "https://images.unsplash.com/photo-1555597673-b21d5c935865";

/**
 * `id` maps to `studioScreens.gate.<id>.label` / `.hint` in i18n messages.
 * `hint` is only set when the reason is dynamic (e.g. a Supabase error).
 */
export type PublishCheck = {
  id: string;
  ok: boolean;
  hint?: string;
};

export type PublishReadiness = {
  ready: boolean;
  checks: PublishCheck[];
};

function hasRealCover(url: string | null | undefined) {
  if (!url?.trim()) return false;
  if (url.includes(PLACEHOLDER_COVER)) return false;
  return true;
}

function hasVideo(opts: { mux?: string | null; url?: string | null }) {
  return Boolean(opts.mux?.trim() || opts.url?.trim());
}

/** Client-side gate before publishing a program (matches web Studio). */
export async function getPublishReadiness(program: StudioProgram): Promise<PublishReadiness> {
  if (!isSupabaseConfigured) {
    return {
      ready: false,
      checks: [{ id: "supabase", ok: false }],
    };
  }

  const { data: sessions, error: sErr } = await supabase
    .from("workout_sessions")
    .select("id, mux_playback_id, video_url")
    .eq("program_id", program.id);

  if (sErr) {
    return {
      ready: false,
      checks: [{ id: "sessions", ok: false, hint: sErr.message }],
    };
  }

  const sessionRows = sessions ?? [];
  let drillsWithVideo = 0;
  let totalDrills = 0;
  let sessionsWithVideo = 0;

  for (const s of sessionRows) {
    if (hasVideo({ mux: s.mux_playback_id, url: s.video_url })) {
      sessionsWithVideo += 1;
    }

    const { data: exercises } = await supabase
      .from("exercises")
      .select("id, mux_playback_id, video_url")
      .eq("session_id", s.id);

    const list = exercises ?? [];
    totalDrills += list.length;
    for (const ex of list) {
      if (hasVideo({ mux: ex.mux_playback_id, url: ex.video_url })) drillsWithVideo += 1;
    }
  }

  const allDrillsHaveVideo = totalDrills > 0 && drillsWithVideo === totalDrills;
  const allSessionsHaveVideo =
    sessionRows.length > 0 && sessionsWithVideo === sessionRows.length;

  const checks: PublishCheck[] = [
    { id: "cover", ok: hasRealCover(program.cover_url) },
    { id: "sessions", ok: sessionRows.length >= 1 },
    { id: "drills", ok: totalDrills >= 1 },
    { id: "session_videos", ok: allSessionsHaveVideo },
    { id: "drill_videos", ok: allDrillsHaveVideo },
  ];

  return {
    ready: checks.every((c) => c.ok),
    checks,
  };
}
