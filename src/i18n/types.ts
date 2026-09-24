export type Locale = "en" | "pt";

export const LOCALES: Locale[] = ["en", "pt"];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  pt: "Português",
};

export function detectLocale(fallback: Locale = "en"): Locale {
  try {
    const IntlLocale =
      typeof Intl !== "undefined"
        ? Intl.DateTimeFormat().resolvedOptions().locale
        : "";
    const lang = (IntlLocale || "").toLowerCase();
    if (lang.startsWith("pt")) return "pt";
  } catch {
    /* ignore */
  }
  return fallback;
}

export function normalizeLocale(value: string | null | undefined): Locale | null {
  if (!value) return null;
  const v = value.toLowerCase();
  if (v.startsWith("pt")) return "pt";
  if (v.startsWith("en")) return "en";
  return null;
}

type Dict = Record<string, unknown>;

export function translate(
  dict: Dict,
  key: string,
  params?: Record<string, string | number>,
): string {
  const parts = key.split(".");
  let cur: unknown = dict;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as Dict)) {
      cur = (cur as Dict)[p];
    } else {
      return key;
    }
  }
  if (typeof cur !== "string") return key;
  if (!params) return cur;
  return cur.replace(/\{\{(\w+)\}\}/g, (_, name: string) =>
    params[name] != null ? String(params[name]) : `{{${name}}}`,
  );
}
