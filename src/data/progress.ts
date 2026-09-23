import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";
import { estimateSessionXp } from "@/src/lib/workoutMath";
import type { Program, WorkoutSession } from "@/src/types";
import { fetchCatalog } from "@/src/data/catalog";
import AsyncStorage from "@react-native-async-storage/async-storage";

const setLogsKey = (sessionId: string) => `rashmat.setLogs.${sessionId}`;
const completedKey = (sessionId: string) => `rashmat.completed.${sessionId}`;

export type Enrollment = {
  id: string;
  programId: string;
  currentDay: number;
  progressPct: number;
  enrolledAt: string;
  dayOrder: string[];
};

export type ResumeItem = {
  id: string;
  title: string;
  progress: number;
  thumbnailUrl: string;
  programId?: string;
};

export type SessionProgress = {
  sessionId: string;
  exerciseIndex: number;
  setIndex: number;
  elapsedSeconds: number;
  status: string;
};

export async function enrollProgram(programId: string) {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.rpc("enroll_program", {
    p_program_id: programId,
  });
  if (error) throw error;
  return data;
}

export async function completeSession(opts: {
  sessionId: string;
  durationSeconds: number;
  xpHint?: number;
  setsLogged?: number;
}) {
  const xpFallback =
    opts.xpHint ??
    estimateSessionXp({
      setsLogged: opts.setsLogged ?? 0,
      durationSeconds: opts.durationSeconds,
    });

  // Always mark complete locally so offline / demo builds never block the flow
  try {
    await AsyncStorage.setItem(
      completedKey(opts.sessionId),
      JSON.stringify({
        sessionId: opts.sessionId,
        durationSeconds: opts.durationSeconds,
        xp: xpFallback,
        completedAt: new Date().toISOString(),
      }),
    );
    await AsyncStorage.setItem(
      `rashmat.sessionProgress.${opts.sessionId}`,
      JSON.stringify({
        sessionId: opts.sessionId,
        exerciseIndex: 0,
        setIndex: 0,
        elapsedSeconds: opts.durationSeconds,
        status: "completed",
      }),
    );
  } catch {
    // ignore local persistence failures
  }

  if (!isSupabaseConfigured) {
    return { error: null, xp: xpFallback, newMedals: [] as { id: string; title: string; xp: number }[] };
  }

  try {
    const { data, error } = await supabase.rpc("complete_session", {
      p_session_id: opts.sessionId,
      p_xp: opts.xpHint ?? null,
      p_duration: opts.durationSeconds,
    });
    if (error) {
      // Soft-fail: local complete already saved; player can advance
      if (__DEV__) console.warn("[RASHMAT] complete_session RPC failed", error.message);
      return { error: null, xp: xpFallback, offline: true as const, newMedals: [] as { id: string; title: string; xp: number }[] };
    }

    let newMedals: { id: string; title: string; xp: number }[] = [];
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (uid) {
        const { evaluateAndAwardMedals } = await import("@/src/data/achievements");
        newMedals = await evaluateAndAwardMedals(uid);
      }
    } catch {
      /* best-effort medals */
    }

    return { error: null, xp: data?.xp_earned ?? xpFallback, row: data, newMedals };
  } catch (e) {
    if (__DEV__) console.warn("[RASHMAT] complete_session network error", e);
    return { error: null, xp: xpFallback, offline: true as const, newMedals: [] as { id: string; title: string; xp: number }[] };
  }
}

export async function saveSessionProgress(opts: {
  sessionId: string;
  exerciseIndex: number;
  setIndex: number;
  elapsedSeconds: number;
  status?: "in_progress" | "completed" | "abandoned";
}) {
  const localKey = `rashmat.sessionProgress.${opts.sessionId}`;
  await AsyncStorage.setItem(localKey, JSON.stringify(opts));

  if (!isSupabaseConfigured) return { error: null };
  const { error } = await supabase.rpc("save_session_progress", {
    p_session_id: opts.sessionId,
    p_exercise_index: opts.exerciseIndex,
    p_set_index: opts.setIndex,
    p_elapsed: opts.elapsedSeconds,
    p_status: opts.status ?? "in_progress",
  });
  return { error: error?.message ?? null };
}

export async function loadSessionProgress(
  sessionId: string,
): Promise<SessionProgress | null> {
  if (isSupabaseConfigured) {
    const { data } = await supabase
      .from("session_progress")
      .select("*")
      .eq("session_id", sessionId)
      .maybeSingle();
    if (data && data.status === "in_progress") {
      return {
        sessionId: data.session_id,
        exerciseIndex: data.exercise_index,
        setIndex: data.set_index,
        elapsedSeconds: data.elapsed_seconds,
        status: data.status,
      };
    }
  }

  try {
    const raw = await AsyncStorage.getItem(`rashmat.sessionProgress.${sessionId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      exerciseIndex: number;
      setIndex: number;
      elapsedSeconds: number;
      status?: string;
    };
    if (parsed.status && parsed.status !== "in_progress") return null;
    return {
      sessionId,
      exerciseIndex: parsed.exerciseIndex,
      setIndex: parsed.setIndex,
      elapsedSeconds: parsed.elapsedSeconds,
      status: parsed.status ?? "in_progress",
    };
  } catch {
    return null;
  }
}

type LocalSetLog = {
  exercise_id: string;
  set_number: number;
  reps_logged: number;
  created_at: string;
};

async function appendLocalSetLog(opts: {
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  reps: number;
}) {
  try {
    const raw = await AsyncStorage.getItem(setLogsKey(opts.sessionId));
    const list: LocalSetLog[] = raw ? (JSON.parse(raw) as LocalSetLog[]) : [];
    list.push({
      exercise_id: opts.exerciseId,
      set_number: opts.setNumber,
      reps_logged: opts.reps,
      created_at: new Date().toISOString(),
    });
    await AsyncStorage.setItem(setLogsKey(opts.sessionId), JSON.stringify(list));
  } catch {
    // ignore
  }
}

export async function logSetRep(opts: {
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  reps: number;
}) {
  await appendLocalSetLog(opts);

  if (!isSupabaseConfigured) return { error: null };
  try {
    const { error } = await supabase.rpc("log_set_rep", {
      p_session_id: opts.sessionId,
      p_exercise_id: opts.exerciseId,
      p_set_number: opts.setNumber,
      p_reps: opts.reps,
    });
    // Never block the player on remote log failure
    if (error && __DEV__) console.warn("[RASHMAT] log_set_rep", error.message);
    return { error: null };
  } catch {
    return { error: null };
  }
}

export async function fetchMaxReps(exerciseId: string): Promise<number | null> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("set_logs")
      .select("reps_logged")
      .eq("exercise_id", exerciseId)
      .order("reps_logged", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!error && data) return data.reps_logged;
  }
  return null;
}

export async function fetchSetHistory(sessionId: string) {
  let remote: LocalSetLog[] = [];
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("set_logs")
      .select("exercise_id, set_number, reps_logged, created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });
    if (!error && data) remote = data as LocalSetLog[];
  }

  let local: LocalSetLog[] = [];
  try {
    const raw = await AsyncStorage.getItem(setLogsKey(sessionId));
    if (raw) local = JSON.parse(raw) as LocalSetLog[];
  } catch {
    local = [];
  }

  if (remote.length === 0) return local;
  if (local.length === 0) return remote;
  // Prefer remote when present; append local-only extras by created_at
  const seen = new Set(
    remote.map((r) => `${r.exercise_id}:${r.set_number}:${r.reps_logged}`),
  );
  const extras = local.filter(
    (l) => !seen.has(`${l.exercise_id}:${l.set_number}:${l.reps_logged}`),
  );
  return [...remote, ...extras];
}

export async function saveDayOrderRemote(programId: string, sessionIds: string[]) {
  if (!isSupabaseConfigured) return { error: null };
  const { error } = await supabase.rpc("save_program_day_order", {
    p_program_id: programId,
    p_session_ids: sessionIds,
  });
  return { error: error?.message ?? null };
}

export async function fetchEnrollments(userId: string): Promise<Enrollment[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("user_program_enrollments")
    .select("*")
    .eq("user_id", userId)
    .order("enrolled_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    programId: r.program_id,
    currentDay: r.current_day,
    progressPct: r.progress_pct,
    enrolledAt: r.enrolled_at,
    dayOrder: r.day_order ?? [],
  }));
}

export async function fetchCompletedSessionIds(userId: string): Promise<Set<string>> {
  if (!isSupabaseConfigured) return new Set();
  const { data, error } = await supabase
    .from("session_completions")
    .select("session_id")
    .eq("user_id", userId);
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.session_id));
}

export async function fetchWeeklyCompletionCount(userId: string): Promise<number> {
  if (!isSupabaseConfigured) return 0;
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const { data, error } = await supabase
    .from("session_completions")
    .select("id")
    .eq("user_id", userId)
    .gte("completed_at", since.toISOString());
  if (error) return 0;
  return data?.length ?? 0;
}

/**
 * Resume list: enrolled programs' next incomplete session, else recent incomplete catalog sessions.
 * Respects server day_order when present.
 */
export async function fetchResumeItems(userId: string | undefined): Promise<{
  resume: ResumeItem[];
  enrollments: Enrollment[];
  currentProgram: Program | null;
  nextSession: WorkoutSession | null;
  weeklyDone: number;
  completedSessionIds: string[];
}> {
  const catalog = await fetchCatalog();
  const enrollments = userId ? await fetchEnrollments(userId) : [];
  const completed = userId ? await fetchCompletedSessionIds(userId) : new Set<string>();
  const weeklyDone = userId ? await fetchWeeklyCompletionCount(userId) : 0;

  const currentEnrollment = enrollments[0] ?? null;
  const currentProgram = currentEnrollment
    ? catalog.programs.find((p) => p.id === currentEnrollment.programId) ?? null
    : null;

  const orderedSessions = (programId: string, dayOrder: string[]) => {
    const list = catalog.sessions
      .filter((s) => s.programId === programId)
      .sort((a, b) => a.day - b.day);
    if (!dayOrder?.length) return list;
    const byId = new Map(list.map((s) => [s.id, s]));
    const ordered = dayOrder.map((id) => byId.get(id)).filter(Boolean) as WorkoutSession[];
    for (const s of list) {
      if (!ordered.some((o) => o.id === s.id)) ordered.push(s);
    }
    return ordered;
  };

  const programSessions = currentProgram
    ? orderedSessions(currentProgram.id, currentEnrollment?.dayOrder ?? [])
    : [];

  const nextSession =
    programSessions.find((s) => !completed.has(s.id)) ?? programSessions[0] ?? null;

  const resume: ResumeItem[] = [];

  for (const en of enrollments.slice(0, 3)) {
    const prog = catalog.programs.find((p) => p.id === en.programId);
    const sessions = orderedSessions(en.programId, en.dayOrder);
    const next = sessions.find((s) => !completed.has(s.id)) ?? sessions[sessions.length - 1];
    if (!next || !prog) continue;
    resume.push({
      id: next.id,
      title: next.title,
      progress: en.progressPct,
      thumbnailUrl: next.exercises[0]?.thumbnailUrl || next.coverUrl || prog.coverUrl,
      programId: prog.id,
    });
  }

  return {
    resume,
    enrollments,
    currentProgram,
    nextSession,
    weeklyDone: Math.min(4, weeklyDone),
    completedSessionIds: [...completed],
  };
}
