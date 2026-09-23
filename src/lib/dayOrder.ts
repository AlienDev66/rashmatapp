import AsyncStorage from "@react-native-async-storage/async-storage";
import { saveDayOrderRemote } from "@/src/data/progress";

const key = (userId: string | undefined, programId: string) =>
  `rashmat.dayOrder.${userId ?? "anon"}.${programId}`;

export async function loadDayOrder(
  userId: string | undefined,
  programId: string,
  defaultIds: string[],
  serverOrder?: string[] | null,
): Promise<string[]> {
  const merge = (saved: string[]) => {
    const ordered = saved.filter((id) => defaultIds.includes(id));
    for (const id of defaultIds) {
      if (!ordered.includes(id)) ordered.push(id);
    }
    return ordered;
  };

  if (serverOrder && serverOrder.length > 0) {
    return merge(serverOrder);
  }

  try {
    const raw = await AsyncStorage.getItem(key(userId, programId));
    if (!raw) return defaultIds;
    return merge(JSON.parse(raw) as string[]);
  } catch {
    return defaultIds;
  }
}

export async function saveDayOrder(
  userId: string | undefined,
  programId: string,
  ids: string[],
) {
  await AsyncStorage.setItem(key(userId, programId), JSON.stringify(ids));
  if (userId) {
    await saveDayOrderRemote(programId, ids);
  }
}
