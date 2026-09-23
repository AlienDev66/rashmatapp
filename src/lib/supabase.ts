import "react-native-get-random-values";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Database } from "@/src/types/database";
import { createClient, type SupportedStorage } from "@supabase/supabase-js";
import * as aesjs from "aes-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * SecureStore has a ~2KB value limit. Large JWT sessions are encrypted and
 * chunked into AsyncStorage; the AES key stays in SecureStore.
 * @see https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native
 */
class LargeSecureStore implements SupportedStorage {
  private async getKey() {
    const existing = await SecureStore.getItemAsync("supabase_aes_key");
    if (existing) return aesjs.utils.hex.toBytes(existing);
    const key = crypto.getRandomValues(new Uint8Array(256 / 8));
    await SecureStore.setItemAsync("supabase_aes_key", aesjs.utils.hex.fromBytes(key));
    return key;
  }

  private async encrypt(value: string) {
    const key = await this.getKey();
    const iv = crypto.getRandomValues(new Uint8Array(16));
    const aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(iv));
    const encryptedBytes = aesCtr.encrypt(aesjs.utils.utf8.toBytes(value));
    return `${aesjs.utils.hex.fromBytes(iv)}:${aesjs.utils.hex.fromBytes(encryptedBytes)}`;
  }

  private async decrypt(cipher: string) {
    const [ivHex, dataHex] = cipher.split(":");
    if (!ivHex || !dataHex) return cipher;
    const key = await this.getKey();
    const iv = aesjs.utils.hex.toBytes(ivHex);
    const encryptedBytes = aesjs.utils.hex.toBytes(dataHex);
    const aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(iv));
    return aesjs.utils.utf8.fromBytes(aesCtr.decrypt(encryptedBytes));
  }

  async getItem(key: string) {
    const encrypted = await AsyncStorage.getItem(key);
    if (!encrypted) return null;
    return this.decrypt(encrypted);
  }

  async setItem(key: string, value: string) {
    const encrypted = await this.encrypt(value);
    await AsyncStorage.setItem(key, encrypted);
  }

  async removeItem(key: string) {
    await AsyncStorage.removeItem(key);
  }
}

const memoryStore = new Map<string, string>();
const webStorage: SupportedStorage = {
  getItem: (key) => {
    if (typeof localStorage === "undefined") return memoryStore.get(key) ?? null;
    return localStorage.getItem(key);
  },
  setItem: (key, value) => {
    if (typeof localStorage === "undefined") {
      memoryStore.set(key, value);
      return;
    }
    localStorage.setItem(key, value);
  },
  removeItem: (key) => {
    if (typeof localStorage === "undefined") {
      memoryStore.delete(key);
      return;
    }
    localStorage.removeItem(key);
  },
};

export const isSupabaseConfigured =
  Boolean(supabaseUrl) &&
  Boolean(supabaseAnonKey) &&
  !supabaseUrl.includes("YOUR_PROJECT");

export const supabase = createClient<Database>(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
  {
    auth: {
      storage: Platform.OS === "web" ? webStorage : new LargeSecureStore(),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
