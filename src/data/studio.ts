import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";
import type { Database } from "@/src/types/database";

export type StudentProgressRow = {
  enrollment_id: string;
  program_id: string;
  program_title: string;
  student_id: string;
  student_name: string;
  student_avatar: string | null;
  progress_pct: number;
  current_day: number;
  enrolled_at: string;
  last_completed_at: string | null;
  sessions_done: number;
};

export type StudioProgram = Database["public"]["Tables"]["programs"]["Row"];
export type StudioSession = Database["public"]["Tables"]["workout_sessions"]["Row"];
export type StudioExercise = Database["public"]["Tables"]["exercises"]["Row"];

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export async function activateCreator(slug?: string) {
  if (!isSupabaseConfigured) return { error: "Supabase not configured", profile: null };
  const { data, error } = await supabase.rpc("activate_creator", {
    p_slug: slug ?? null,
  });
  if (error) return { error: error.message, profile: null };
  return { error: null, profile: data };
}

export async function fetchMyPrograms(userId: string) {
  if (!isSupabaseConfigured) return { error: null, programs: [] as StudioProgram[] };
  const { data, error } = await supabase
    .from("programs")
    .select("*")
    .eq("creator_user_id", userId)
    .order("created_at", { ascending: false });
  if (error) return { error: error.message, programs: [] as StudioProgram[] };
  return { error: null, programs: (data ?? []) as StudioProgram[] };
}

export async function createProgram(opts: {
  userId: string;
  creatorSlug: string;
  title: string;
  description?: string;
  coverUrl?: string;
  level?: string;
  weeks?: number;
  daysPerWeek?: number;
  minutes?: number;
}) {
  if (!isSupabaseConfigured) return { error: "Supabase not configured", program: null };
  const id = `${slugify(opts.title) || "program"}-${Date.now().toString(36)}`;
  const { data, error } = await supabase
    .from("programs")
    .insert({
      id,
      creator_id: opts.creatorSlug,
      creator_user_id: opts.userId,
      title: opts.title.trim(),
      description: opts.description ?? "",
      cover_url:
        opts.coverUrl ??
        "https://images.unsplash.com/photo-1555597673-b21d5c935865?w=1200&q=80",
      weeks: opts.weeks ?? 4,
      days_per_week: opts.daysPerWeek ?? 3,
      minutes: opts.minutes ?? 60,
      level: opts.level ?? "Beginner",
      tags: ["RASHMAT"],
      status: "draft",
      is_premium: false,
    })
    .select("*")
    .single();
  if (error) return { error: error.message, program: null };
  return { error: null, program: data as StudioProgram };
}

export async function updateProgram(
  programId: string,
  patch: Partial<{
    title: string;
    description: string;
    cover_url: string;
    weeks: number;
    days_per_week: number;
    minutes: number;
    level: string;
    status: "draft" | "published";
    tags: string[];
    is_premium: boolean;
  }>,
) {
  if (!isSupabaseConfigured) return { error: "Supabase not configured" };
  const { error } = await supabase.from("programs").update(patch).eq("id", programId);
  return { error: error?.message ?? null };
}

export async function publishProgram(programId: string, published: boolean) {
  return updateProgram(programId, { status: published ? "published" : "draft" });
}

export async function fetchProgramSessions(programId: string) {
  if (!isSupabaseConfigured) return { error: null, sessions: [] as StudioSession[] };
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("program_id", programId)
    .order("day", { ascending: true });
  if (error) return { error: error.message, sessions: [] as StudioSession[] };
  return { error: null, sessions: (data ?? []) as StudioSession[] };
}

export async function createSession(opts: {
  programId: string;
  title: string;
  day: number;
  description?: string;
  minutes?: number;
  muxPlaybackId?: string;
  videoUrl?: string;
}) {
  if (!isSupabaseConfigured) return { error: "Supabase not configured", session: null };
  const id = `${opts.programId}-d${opts.day}-${Date.now().toString(36)}`;
  const { data, error } = await supabase
    .from("workout_sessions")
    .insert({
      id,
      program_id: opts.programId,
      title: opts.title.trim(),
      description: opts.description ?? "",
      cover_url: null,
      tags: [],
      sets: 1,
      day: opts.day,
      minutes: opts.minutes ?? 45,
      mux_playback_id: opts.muxPlaybackId ?? null,
      video_url: opts.videoUrl ?? null,
    })
    .select("*")
    .single();
  if (error) return { error: error.message, session: null };
  return { error: null, session: data as StudioSession };
}

export async function updateSession(
  sessionId: string,
  patch: Partial<{
    title: string;
    description: string;
    day: number;
    minutes: number;
    mux_playback_id: string | null;
    video_url: string | null;
    cover_url: string | null;
  }>,
) {
  if (!isSupabaseConfigured) return { error: "Supabase not configured" };
  const { error } = await supabase.from("workout_sessions").update(patch).eq("id", sessionId);
  return { error: error?.message ?? null };
}

export async function deleteSession(sessionId: string) {
  if (!isSupabaseConfigured) return { error: "Supabase not configured" };
  const { error } = await supabase.from("workout_sessions").delete().eq("id", sessionId);
  return { error: error?.message ?? null };
}

export async function fetchSessionExercises(sessionId: string) {
  if (!isSupabaseConfigured) return { error: null, exercises: [] as StudioExercise[] };
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .eq("session_id", sessionId)
    .order("sort_order", { ascending: true });
  if (error) return { error: error.message, exercises: [] as StudioExercise[] };
  return { error: null, exercises: (data ?? []) as StudioExercise[] };
}

export async function createExercise(opts: {
  sessionId: string;
  name: string;
  reps?: string;
  sortOrder?: number;
  restSeconds?: number;
  muxPlaybackId?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
}) {
  if (!isSupabaseConfigured) return { error: "Supabase not configured", exercise: null };
  const id = `ex-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const { data, error } = await supabase
    .from("exercises")
    .insert({
      id,
      session_id: opts.sessionId,
      name: opts.name.trim(),
      reps: opts.reps ?? "Reps: 8 8 8",
      sort_order: opts.sortOrder ?? 0,
      rest_seconds: opts.restSeconds ?? 60,
      mux_playback_id: opts.muxPlaybackId ?? null,
      video_url: opts.videoUrl ?? null,
      thumbnail_url:
        opts.thumbnailUrl ??
        "https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800&q=80",
    })
    .select("*")
    .single();
  if (error) return { error: error.message, exercise: null };
  return { error: null, exercise: data as StudioExercise };
}

export async function updateExercise(
  exerciseId: string,
  patch: Partial<{
    name: string;
    reps: string;
    sort_order: number;
    rest_seconds: number;
    mux_playback_id: string | null;
    video_url: string | null;
    thumbnail_url: string | null;
  }>,
) {
  if (!isSupabaseConfigured) return { error: "Supabase not configured" };
  const { error } = await supabase.from("exercises").update(patch).eq("id", exerciseId);
  return { error: error?.message ?? null };
}

export async function deleteExercise(exerciseId: string) {
  if (!isSupabaseConfigured) return { error: "Supabase not configured" };
  const { error } = await supabase.from("exercises").delete().eq("id", exerciseId);
  return { error: error?.message ?? null };
}

export async function fetchCreatorStudentProgress(programId?: string) {
  if (!isSupabaseConfigured) return { error: null, rows: [] as StudentProgressRow[] };
  const { data, error } = await supabase.rpc("creator_student_progress", {
    p_program_id: programId ?? null,
  });
  if (error) return { error: error.message, rows: [] as StudentProgressRow[] };
  return { error: null, rows: (data ?? []) as StudentProgressRow[] };
}

/** Demo unlock: enroll without payment. */
export async function demoUnlockProgram(programId: string) {
  if (!isSupabaseConfigured) return { error: "Supabase not configured" };
  try {
    const { error } = await supabase.rpc("enroll_program", { p_program_id: programId });
    if (error) return { error: error.message };
    return { error: null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Enroll failed" };
  }
}
