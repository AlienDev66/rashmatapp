import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { messages } from "./messages";
import {
  detectLocale,
  normalizeLocale,
  translate,
  type Locale,
} from "./types";

const STORAGE_KEY = "rashmat.locale";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  ready: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = normalizeLocale(await AsyncStorage.getItem(STORAGE_KEY));
        if (!cancelled) setLocaleState(stored ?? detectLocale("en"));
      } catch {
        if (!cancelled) setLocaleState(detectLocale("en"));
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    void AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) =>
      translate(messages[locale] as unknown as Record<string, unknown>, key, params),
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, ready, t }),
    [locale, setLocale, ready, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export function useT() {
  return useI18n().t;
}
