import type { Locale } from "@/lib/i18n";
import { getSiteUrl } from "@/lib/env";
import { pollHref } from "@/lib/polls/alias";

/** Absolute URL for a site path (leading slash optional). */
export function absoluteUrl(path = "/"): string {
  const base = getSiteUrl();
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Collapse whitespace and truncate for meta descriptions / OG.
 * Default max matches common SERP length guidance.
 */
export function truncateDescription(
  text: string | null | undefined,
  max = 160,
): string {
  const trimmed = (text ?? "").trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

/** Canonical absolute URL for a poll (alias preferred — TECH-17). */
export function pollCanonical(poll: {
  public_id: string;
  alias?: string | null;
}): string {
  return absoluteUrl(pollHref(poll));
}

/** Open Graph `locale` tag (underscore form). */
export function toOpenGraphLocale(locale: Locale): string {
  const map: Record<Locale, string> = {
    en: "en_US",
    fr: "fr_FR",
    es: "es_ES",
    de: "de_DE",
    ja: "ja_JP",
    ms: "ms_MY",
    hi: "hi_IN",
    zh: "zh_CN",
    ar: "ar_SA",
  };
  return map[locale];
}

/** Auth-only and draft surfaces (TECH-18). */
export const NOINDEX_ROBOTS = {
  index: false,
  follow: false,
} as const;
