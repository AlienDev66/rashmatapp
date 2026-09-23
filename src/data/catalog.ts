import { cacheGet, cacheSet } from "@/src/lib/cache";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";
import type { Creator, Program, WorkoutExercise, WorkoutSession } from "@/src/types";
import {
  creators as mockCreators,
  getCreator as mockGetCreator,
  getProgram as mockGetProgram,
  getSession as mockGetSession,
  programs as mockPrograms,
  resumeItems as mockResume,
  sessions as mockSessions,
} from "@/src/data/mock";

function mapProgram(row: {
  id: string;
  creator_id: string;
  creator_user_id?: string | null;
  title: string;
  description: string | null;
  cover_url: string | null;
  weeks: number;
  days_per_week: number;
  minutes: number;
  level: string;
  tags: string[];
  is_premium?: boolean;
  status?: "draft" | "published";
}): Program {
  return {
    id: row.id,
    creatorId: row.creator_id,
    creatorUserId: row.creator_user_id ?? null,
    title: row.title,
    description: row.description ?? "",
    coverUrl: row.cover_url ?? "",
    weeks: row.weeks,
    daysPerWeek: row.days_per_week,
    minutes: row.minutes,
    level: row.level as Program["level"],
    tags: row.tags ?? [],
    isPremium: row.is_premium ?? false,
    status: row.status ?? "published",
  };
}

function mapCreator(
  row: {
    id: string;
    name: string;
    role: string | null;
    bio: string | null;
    avatar_url: string | null;
    cover_url: string | null;
    verified: boolean;
    socials: unknown;
  },
  programIds: string[],
): Creator {
  const socials = (row.socials ?? {}) as Creator["socials"];
  return {
    id: row.id,
    name: row.name,
    role: row.role ?? "",
    bio: row.bio ?? "",
    avatarUrl: row.avatar_url ?? "",
    coverUrl: row.cover_url ?? "",
    verified: row.verified,
    socials,
    programIds,
  };
}

function mapExercise(row: {
  id: string;
  name: string;
  thumbnail_url: string | null;
  reps: string | null;
  rest_seconds?: number | null;
  mux_playback_id: string | null;
  video_url: string | null;
}): WorkoutExercise {
  return {
    id: row.id,
    name: row.name,
    thumbnailUrl: row.thumbnail_url ?? "",
    reps: row.reps ?? "",
    restSeconds: row.rest_seconds ?? 60,
    muxPlaybackId: row.mux_playback_id ?? undefined,
    videoUrl: row.video_url ?? undefined,
  };
}

function mapSession(
  row: {
    id: string;
    program_id: string;
    title: string;
    description: string | null;
    cover_url: string | null;
    tags: string[];
    sets: number;
    day: number;
    minutes: number;
    mux_playback_id: string | null;
    video_url: string | null;
  },
  exercises: WorkoutExercise[],
): WorkoutSession {
  return {
    id: row.id,
    programId: row.program_id,
    title: row.title,
    description: row.description ?? "",
    coverUrl: row.cover_url ?? "",
    tags: row.tags ?? [],
    sets: row.sets,
    day: row.day,
    minutes: row.minutes,
    exerciseCount: exercises.length,
    exercises,
    muxPlaybackId: row.mux_playback_id ?? undefined,
    videoUrl: row.video_url ?? undefined,
  };
}

export type CatalogSnapshot = {
  creators: Creator[];
  programs: Program[];
  sessions: WorkoutSession[];
};

export async function fetchCatalog(): Promise<CatalogSnapshot> {
  if (!isSupabaseConfigured) {
    if (__DEV__) {
      return {
        creators: mockCreators,
        programs: mockPrograms,
        sessions: mockSessions,
      };
    }
    return { creators: [], programs: [], sessions: [] };
  }

  const cached = await cacheGet<CatalogSnapshot>("catalog");

  try {
    const [creatorsRes, programsRes, sessionsRes, exercisesRes] = await Promise.all([
      supabase.from("creators").select("*").order("name"),
      supabase.from("programs").select("*").order("title"),
      supabase.from("workout_sessions").select("*").order("day"),
      supabase.from("exercises").select("*").order("sort_order"),
    ]);

    if (creatorsRes.error) throw creatorsRes.error;
    if (programsRes.error) throw programsRes.error;
    if (sessionsRes.error) throw sessionsRes.error;
    if (exercisesRes.error) throw exercisesRes.error;

    const programs = (programsRes.data ?? []).map(mapProgram);
    const exercisesBySession = new Map<string, WorkoutExercise[]>();
    for (const ex of exercisesRes.data ?? []) {
      const list = exercisesBySession.get(ex.session_id) ?? [];
      list.push(mapExercise(ex));
      exercisesBySession.set(ex.session_id, list);
    }

    const sessions = (sessionsRes.data ?? []).map((s) =>
      mapSession(s, exercisesBySession.get(s.id) ?? []),
    );

    const creators = (creatorsRes.data ?? []).map((c) =>
      mapCreator(
        c,
        programs.filter((p) => p.creatorId === c.id).map((p) => p.id),
      ),
    );

    const snapshot = { creators, programs, sessions };
    await cacheSet("catalog", snapshot);
    return snapshot;
  } catch (e) {
    if (cached) return cached;
    // Dev-only mock so UI works without Supabase; production stays empty/erroring honestly
    if (__DEV__) {
      console.warn("[RASHMAT] catalog fetch failed, using mock", e);
      return {
        creators: mockCreators,
        programs: mockPrograms,
        sessions: mockSessions,
      };
    }
    throw e instanceof Error ? e : new Error("Catalog unavailable");
  }
}

export async function fetchProgram(id: string): Promise<Program | null> {
  const catalog = await fetchCatalog();
  const hit = catalog.programs.find((p) => p.id === id);
  if (hit) return hit;
  return __DEV__ ? mockGetProgram(id) ?? null : null;
}

export async function fetchCreator(id: string): Promise<Creator | null> {
  const catalog = await fetchCatalog();
  const hit = catalog.creators.find((c) => c.id === id);
  if (hit) return hit;
  return __DEV__ ? mockGetCreator(id) ?? null : null;
}

export async function fetchSession(id: string): Promise<WorkoutSession | null> {
  if (!id) return null;
  const catalog = await fetchCatalog();
  const hit = catalog.sessions.find((s) => s.id === id);
  if (hit) return hit;
  return __DEV__ ? mockGetSession(id) ?? null : null;
}

export function sessionsForProgram(sessions: WorkoutSession[], programId: string) {
  return sessions
    .filter((s) => s.programId === programId)
    .sort((a, b) => a.day - b.day)
    .map((s) => ({
      id: s.id,
      title: s.title,
      meta: `Day ${s.day} - ${s.minutes} Mins`,
      thumb: s.coverUrl,
      rest: false,
    }));
}

export function resumeFromSessions(sessions: WorkoutSession[]) {
  if (sessions.length === 0) return __DEV__ ? mockResume : [];
  return sessions.slice(0, 2).map((s) => ({
    id: s.id,
    title: s.title,
    progress: 0,
    thumbnailUrl: s.exercises[0]?.thumbnailUrl || s.coverUrl,
  }));
}
