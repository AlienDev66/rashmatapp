import { evaluateAndAwardMedals } from "@/src/data/achievements";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LOCAL_FAVS = "rashmat.favorites";

async function localIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_FAVS);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

async function saveLocal(ids: string[]) {
  await AsyncStorage.setItem(LOCAL_FAVS, JSON.stringify(ids));
}

export async function fetchFavoriteProgramIds(userId?: string): Promise<Set<string>> {
  const local = new Set(await localIds());
  if (!isSupabaseConfigured || !userId) return local;

  const { data, error } = await supabase
    .from("user_program_favorites")
    .select("program_id")
    .eq("user_id", userId);
  if (error || !data) return local;
  for (const r of data) local.add(r.program_id as string);
  return local;
}

export async function toggleFavoriteProgram(
  programId: string,
  userId?: string,
): Promise<{ favorited: boolean }> {
  const ids = await localIds();
  const has = ids.includes(programId);
  const next = has ? ids.filter((id) => id !== programId) : [...ids, programId];
  await saveLocal(next);

  if (isSupabaseConfigured && userId) {
    if (has) {
      await supabase
        .from("user_program_favorites")
        .delete()
        .eq("user_id", userId)
        .eq("program_id", programId);
    } else {
      await supabase.from("user_program_favorites").upsert({
        user_id: userId,
        program_id: programId,
      });
      void evaluateAndAwardMedals(userId);
    }
  }

  return { favorited: !has };
}

export async function restartProgram(programId: string) {
  if (!isSupabaseConfigured) return { error: "Supabase not configured" };
  const { error } = await supabase.rpc("restart_program", { p_program_id: programId });
  return { error: error?.message ?? null };
}
