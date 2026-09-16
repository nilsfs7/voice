import "server-only";
import { cookies, headers } from "next/headers";
import { messagesFor, type Messages } from "./catalog";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isLocale,
  pickFromAcceptLanguage,
  type Locale,
} from "./locales";

export async function getLocale(): Promise<Locale> {
  const jar = await cookies();
  const fromCookie = jar.get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;

  const hdrs = await headers();
  const fromAccept = pickFromAcceptLanguage(hdrs.get("accept-language"));
  return fromAccept ?? DEFAULT_LOCALE;
}

export async function getMessages(): Promise<Messages> {
  return messagesFor(await getLocale());
}
