export type { Messages } from "./i18n/catalog";
export { formatCount, messagesFor } from "./i18n/catalog";
export {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_COOKIE,
  isLocale,
  localeMeta,
  pickFromAcceptLanguage,
  resolveLocale,
  type Locale,
} from "./i18n/locales";
export { getLocale, getMessages } from "./i18n/server";

import { messagesFor } from "./i18n/catalog";

/**
 * Sync English fallback for rare non-request contexts.
 * Prefer `await getMessages()` (server) or `useMessages()` (client).
 */
export function t() {
  return messagesFor("en");
}
