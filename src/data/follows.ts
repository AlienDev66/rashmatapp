import { evaluateAndAwardMedals } from "@/src/data/achievements";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LOCAL_FOLLOWS = "rashmat.creatorFollows";

export type FollowStats = {
  followerCount: number;
  following: boolean;
};

export type FollowerRow = {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  followedAt: string;
};

async function localIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_FOLLOWS);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

async function saveLocal(ids: string[]) {
  await AsyncStorage.setItem(LOCAL_FOLLOWS, JSON.stringify(ids));
}

export async function fetchFollowingCreatorIds(userId?: string): Promise<Set<string>> {
  const local = new Set(await localIds());
  if (!isSupabaseConfigured || !userId) return local;

  const { data, error } = await supabase.rpc("list_my_following", { p_limit: 100 });
  if (error || !data) return local;
  for (const r of data as { creator_id: string }[]) {
    local.add(r.creator_id);
  }
  await saveLocal([...local]);
  return local;
}

export async function fetchCreatorFollowStats(creatorId: string): Promise<FollowStats> {
  const local = await localIds();
  const localFollowing = local.includes(creatorId);

  if (!isSupabaseConfigured) {
    return { followerCount: localFollowing ? 1 : 0, following: localFollowing };
  }

  const { data, error } = await supabase.rpc("creator_follow_stats", {
    p_creator_id: creatorId,
  });
  if (error || !data) {
    return { followerCount: 0, following: localFollowing };
  }
  const row = data as { follower_count?: number; following?: boolean };
  return {
    followerCount: Number(row.follower_count ?? 0),
    following: Boolean(row.following) || localFollowing,
  };
}

export async function toggleCreatorFollow(
  creatorId: string,
  userId?: string,
): Promise<{ following: boolean; followerCount: number; error?: string }> {
  const ids = await localIds();
  const has = ids.includes(creatorId);
  const next = has ? ids.filter((id) => id !== creatorId) : [...ids, creatorId];
  await saveLocal(next);

  if (!isSupabaseConfigured || !userId) {
    return { following: !has, followerCount: next.length };
  }

  const { data, error } = await supabase.rpc("toggle_creator_follow", {
    p_creator_id: creatorId,
  });
  if (error) {
    await saveLocal(ids);
    return { following: has, followerCount: 0, error: error.message };
  }

  const row = data as {
    ok?: boolean;
    following?: boolean;
    follower_count?: number;
    error?: string;
  } | null;

  if (row?.ok === false) {
    await saveLocal(ids);
    return {
      following: has,
      followerCount: Number(row.follower_count ?? 0),
      error: row.error ?? "Could not update follow",
    };
  }

  const following = Boolean(row?.following);
  if (following) {
    void evaluateAndAwardMedals(userId);
  }

  return {
    following,
    followerCount: Number(row?.follower_count ?? 0),
  };
}

export async function fetchCreatorFollowers(
  creatorId: string,
  limit = 50,
): Promise<FollowerRow[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase.rpc("list_creator_followers", {
    p_creator_id: creatorId,
    p_limit: limit,
  });
  if (error || !data) return [];

  return (data as { user_id: string; full_name: string; avatar_url: string | null; followed_at: string }[]).map(
    (r) => ({
      userId: r.user_id,
      fullName: r.full_name,
      avatarUrl: r.avatar_url,
      followedAt: r.followed_at,
    }),
  );
}

export async function fetchMyCreatorFollowers(limit = 100): Promise<FollowerRow[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase.rpc("my_creator_followers", { p_limit: limit });
  if (error || !data) return [];

  return (data as {
    user_id: string;
    full_name: string;
    avatar_url: string | null;
    followed_at: string;
  }[]).map((r) => ({
    userId: r.user_id,
    fullName: r.full_name,
    avatarUrl: r.avatar_url,
    followedAt: r.followed_at,
  }));
}
