import AsyncStorage from "@react-native-async-storage/async-storage";

const INBOX_KEY = "rashmat.notificationInbox";
const MAX_ITEMS = 50;

export type InboxItem = {
  id: string;
  title: string;
  body: string;
  type: "workout" | "unlock" | "system" | "test";
  createdAt: string;
  read: boolean;
};

export async function listInboxItems(): Promise<InboxItem[]> {
  try {
    const raw = await AsyncStorage.getItem(INBOX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as InboxItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function addInboxItem(
  item: Omit<InboxItem, "id" | "createdAt" | "read">,
): Promise<InboxItem> {
  const next: InboxItem = {
    ...item,
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    read: false,
  };
  const prev = await listInboxItems();
  const list = [next, ...prev].slice(0, MAX_ITEMS);
  await AsyncStorage.setItem(INBOX_KEY, JSON.stringify(list));
  return next;
}

export async function markInboxRead(id?: string) {
  const prev = await listInboxItems();
  const list = prev.map((item) =>
    !id || item.id === id ? { ...item, read: true } : item,
  );
  await AsyncStorage.setItem(INBOX_KEY, JSON.stringify(list));
}

export async function clearInbox() {
  await AsyncStorage.removeItem(INBOX_KEY);
}
