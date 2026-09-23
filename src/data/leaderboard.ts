import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";

export type LeaderboardPeriod = "all_time" | "monthly";

export type LeaderboardEntry = {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  xp: number;
  rank: number;
  sessionsDone?: number;
};

export async function fetchGlobalLeaderboard(
  period: LeaderboardPeriod = "all_time",
  limit = 50,
): Promise<LeaderboardEntry[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.rpc("leaderboard_global", {
    p_period: period,
    p_limit: limit,
  });
  if (error || !data) {
    if (__DEV__) console.warn("[RASHMAT] leaderboard_global", error?.message);
    return [];
  }
  return (data as Array<{
    user_id: string;
    full_name: string;
    avatar_url: string | null;
    xp: number;
    rank: number;
  }>).map((r) => ({
    userId: r.user_id,
    fullName: r.full_name,
    avatarUrl: r.avatar_url,
    xp: r.xp,
    rank: Number(r.rank),
  }));
}

export async function fetchProgramLeaderboard(
  programId: string,
  limit = 50,
): Promise<LeaderboardEntry[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.rpc("leaderboard_program", {
    p_program_id: programId,
    p_limit: limit,
  });
  if (error || !data) {
    if (__DEV__) console.warn("[RASHMAT] leaderboard_program", error?.message);
    return [];
  }
  return (data as Array<{
    user_id: string;
    full_name: string;
    avatar_url: string | null;
    xp: number;
    sessions_done: number;
    rank: number;
  }>).map((r) => ({
    userId: r.user_id,
    fullName: r.full_name,
    avatarUrl: r.avatar_url,
    xp: r.xp,
    rank: Number(r.rank),
    sessionsDone: r.sessions_done,
  }));
}
