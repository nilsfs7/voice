/** Product codes → BCP-47 (NFR-04 / FR-UI-012). */
export const LOCALES = [
  { code: "en", product: "EN", label: "English", dir: "ltr", flag: "🇬🇧" },
  { code: "fr", product: "FR", label: "Français", dir: "ltr", flag: "🇫🇷" },
  { code: "es", product: "ES", label: "Español", dir: "ltr", flag: "🇪🇸" },
  { code: "de", product: "DE", label: "Deutsch", dir: "ltr", flag: "🇩🇪" },
  { code: "ja", product: "JP", label: "日本語", dir: "ltr", flag: "🇯🇵" },
  { code: "ms", product: "MY", label: "Bahasa Melayu", dir: "ltr", flag: "🇲🇾" },
  { code: "hi", product: "IN", label: "हिन्दी", dir: "ltr", flag: "🇮🇳" },
  { code: "zh", product: "CN", label: "中文", dir: "ltr", flag: "🇨🇳" },
  { code: "ar", product: "SA", label: "العربية", dir: "rtl", flag: "🇸🇦" },
] as const;

export type Locale = (typeof LOCALES)[number]["code"];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "voice_locale";

const localeSet = new Set<string>(LOCALES.map((l) => l.code));

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && localeSet.has(value);
}

export function localeMeta(code: Locale) {
  return LOCALES.find((l) => l.code === code)!;
}

/** Map Accept-Language / product-style codes to a supported locale. */
export function resolveLocale(raw: string | null | undefined): Locale | null {
  if (!raw) return null;
  const lower = raw.trim().toLowerCase();
  if (isLocale(lower)) return lower;

  const product = LOCALES.find((l) => l.product.toLowerCase() === lower);
  if (product) return product.code;

  const primary = lower.split(/[-_]/)[0];
  if (isLocale(primary)) return primary;

  // Common aliases
  if (primary === "jp") return "ja";
  if (primary === "cn" || primary === "zh-cn" || lower.startsWith("zh")) return "zh";
  if (primary === "in" || primary === "hi") return "hi";
  if (primary === "my" || primary === "ms") return "ms";
  if (primary === "sa" || primary === "ar") return "ar";

  return null;
}

export function pickFromAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null;
  for (const part of header.split(",")) {
    const tag = part.trim().split(";")[0];
    const resolved = resolveLocale(tag);
    if (resolved) return resolved;
  }
  return null;
}
