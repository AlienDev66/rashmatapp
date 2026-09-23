import { medalsEarnedByStats, MEDAL_DEFS, type TrainingStats } from "@/src/data/medalsCatalog";
import { fetchCatalog } from "@/src/data/catalog";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LOCAL_MEDALS = "rashmat.userMedals";

export type UserMedal = {
  medalId: string;
  awardedAt: string;
};

export type AthleteStats = TrainingStats & {
  medals: UserMedal[];
};

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

/** Consecutive calendar days with ≥1 completion ending today or yesterday. */
export function computeStreak(completionDatesIso: string[]): number {
  if (completionDatesIso.length === 0) return 0;
  const days = new Set(completionDatesIso.map(dayKey));
  const today = new Date();
  const todayKey = dayKey(today.toISOString());
  const y = new Date(today);
  y.setDate(y.getDate() - 1);
  const yKey = dayKey(y.toISOString());

  let cursor: Date;
  if (days.has(todayKey)) {
    cursor = today;
  } else if (days.has(yKey)) {
    cursor = y;
  } else {
    return 0;
  }

  let streak = 0;
  while (true) {
    const k = dayKey(cursor.toISOString());
    if (!days.has(k)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

async function loadLocalMedals(): Promise<UserMedal[]> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_MEDALS);
    return raw ? (JSON.parse(raw) as UserMedal[]) : [];
  } catch {
    return [];
  }
}

async function saveLocalMedal(medalId: string) {
  const list = await loadLocalMedals();
  if (list.some((m) => m.medalId === medalId)) return;
  list.push({ medalId, awardedAt: new Date().toISOString() });
  await AsyncStorage.setItem(LOCAL_MEDALS, JSON.stringify(list));
}

export async function fetchOwnedMedals(userId: string): Promise<UserMedal[]> {
  const local = await loadLocalMedals();
  if (!isSupabaseConfigured) return local;

  const { data, error } = await supabase
    .from("user_medals")
    .select("medal_id, awarded_at")
    .eq("user_id", userId);
  if (error || !data) return local;

  const remote = data.map((r) => ({
    medalId: r.medal_id as string,
    awardedAt: r.awarded_at as string,
  }));
  const byId = new Map(remote.map((m) => [m.medalId, m]));
  for (const m of local) {
    if (!byId.has(m.medalId)) byId.set(m.medalId, m);
  }
  return [...byId.values()];
}

export async function awardMedal(medalId: string): Promise<{ xp: number; title?: string }> {
  await saveLocalMedal(medalId);
  if (!isSupabaseConfigured) {
    const def = MEDAL_DEFS.find((m) => m.id === medalId);
    return { xp: def?.xpReward ?? 0, title: def?.title };
  }
  const { data, error } = await supabase.rpc("award_medal", {
    p_medal_id: medalId,
    p_meta: {},
  });
  if (error) {
    if (__DEV__) console.warn("[RASHMAT] award_medal", error.message);
    return { xp: 0 };
  }
  const row = data as { ok?: boolean; already?: boolean; xp?: number; title?: string } | null;
  return { xp: row?.already ? 0 : (row?.xp ?? 0), title: row?.title };
}

export async function fetchAthleteStats(userId: string, profileXp = 0): Promise<AthleteStats> {
  const medals = await fetchOwnedMedals(userId);
  let totalSessions = 0;
  let weeklySessions = 0;
  let completionDates: string[] = [];
  let campsCompleted = 0;
  let hasFavorite = false;
  let isEarlyMember = false;
  let referralUnlocks = medals.some((m) => m.medalId === "referral-1") ? 1 : 0;

  if (isSupabaseConfigured) {
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const [{ data: completions }, { data: favs }, { data: profile }] = await Promise.all([
      supabase
        .from("session_completions")
        .select("session_id, completed_at")
        .eq("user_id", userId),
      supabase.from("user_program_favorites").select("program_id").eq("user_id", userId).limit(1),
      supabase.from("profiles").select("created_at, xp").eq("id", userId).maybeSingle(),
    ]);

    completionDates = (completions ?? []).map((c) => c.completed_at as string);
    totalSessions = completions?.length ?? 0;
    weeklySessions = (completions ?? []).filter(
      (c) => new Date(c.completed_at as string) >= since,
    ).length;
    hasFavorite = (favs?.length ?? 0) > 0;

    const created = profile?.created_at ? new Date(profile.created_at) : null;
    // Early window through end of 2026
    isEarlyMember = !!created && created < new Date("2027-01-01T00:00:00Z");

    const catalog = await fetchCatalog();
    const byProgram = new Map<string, { total: number; done: Set<string> }>();
    for (const s of catalog.sessions) {
      const row = byProgram.get(s.programId) ?? { total: 0, done: new Set() };
      row.total += 1;
      byProgram.set(s.programId, row);
    }
    const doneIds = new Set((completions ?? []).map((c) => c.session_id as string));
    for (const s of catalog.sessions) {
      if (doneIds.has(s.id)) byProgram.get(s.programId)?.done.add(s.id);
    }
    for (const row of byProgram.values()) {
      if (row.total > 0 && row.done.size >= row.total) campsCompleted += 1;
    }

    profileXp = profile?.xp ?? profileXp;
  } else {
    isEarlyMember = true;
  }

  return {
    totalSessions,
    campsCompleted,
    streakDays: computeStreak(completionDates),
    weeklySessions,
    xp: profileXp,
    isEarlyMember,
    hasFavorite,
    referralUnlocks,
    medals,
  };
}

/** Evaluate unlocks after a session complete / favorite / etc. Returns newly awarded. */
export async function evaluateAndAwardMedals(
  userId: string,
  profileXp = 0,
): Promise<{ id: string; title: string; xp: number }[]> {
  const stats = await fetchAthleteStats(userId, profileXp);
  const owned = new Set(stats.medals.map((m) => m.medalId));
  const pending = medalsEarnedByStats(stats, owned);
  const awarded: { id: string; title: string; xp: number }[] = [];

  for (const id of pending) {
    const def = MEDAL_DEFS.find((m) => m.id === id);
    const result = await awardMedal(id);
    if (result.xp > 0 || !owned.has(id)) {
      awarded.push({
        id,
        title: result.title ?? def?.title ?? id,
        xp: result.xp,
      });
    }
  }
  return awarded;
}

export async function fetchWorkoutLogs(userId: string, limit = 40) {
  if (!isSupabaseConfigured) return [] as {
    sessionId: string;
    completedAt: string;
    xpEarned: number;
    durationSeconds: number | null;
  }[];

  const { data, error } = await supabase
    .from("session_completions")
    .select("session_id, completed_at, xp_earned, duration_seconds")
    .eq("user_id", userId)
    .order("completed_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map((r) => ({
    sessionId: r.session_id as string,
    completedAt: r.completed_at as string,
    xpEarned: r.xp_earned as number,
    durationSeconds: (r.duration_seconds as number | null) ?? null,
  }));
}
