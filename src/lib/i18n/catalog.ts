import ar from "../../../messages/ar.json";
import de from "../../../messages/de.json";
import en from "../../../messages/en.json";
import es from "../../../messages/es.json";
import fr from "../../../messages/fr.json";
import hi from "../../../messages/hi.json";
import ja from "../../../messages/ja.json";
import ms from "../../../messages/ms.json";
import zh from "../../../messages/zh.json";
import { DEFAULT_LOCALE, type Locale } from "./locales";

export type Messages = typeof en;

const catalogs: Record<Locale, Messages> = {
  en,
  fr: fr as Messages,
  es: es as Messages,
  de: de as Messages,
  ja: ja as Messages,
  ms: ms as Messages,
  hi: hi as Messages,
  zh: zh as Messages,
  ar: ar as Messages,
};

export function messagesFor(locale: Locale): Messages {
  return catalogs[locale] ?? catalogs[DEFAULT_LOCALE];
}

export function formatCount(
  template: string,
  vars: Record<string, string | number>,
): string {
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.replace(`{${key}}`, String(value)),
    template,
  );
}
