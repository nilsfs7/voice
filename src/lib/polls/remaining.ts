import { formatCount, type Messages } from "@/lib/i18n/catalog";
import type { Locale } from "@/lib/i18n/locales";

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Remaining time label for poll list cards (FR-PO-030). */
export function formatPollCardRemaining(
  endAt: Date | string,
  messages: Messages,
  locale: Locale = "en",
  now: Date = new Date(),
): string {
  const end = endAt instanceof Date ? endAt : new Date(endAt);
  if (Number.isNaN(end.getTime())) return messages.home.ended;
  if (end.getTime() <= now.getTime()) return messages.home.ended;

  const daysLeft = Math.round(
    (startOfLocalDay(end).getTime() - startOfLocalDay(now).getTime()) /
      (24 * 60 * 60 * 1000),
  );

  if (daysLeft <= 0) {
    const time = end.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
    return formatCount(messages.home.remainingToday, { time });
  }

  if (daysLeft === 1) return messages.home.remainingDay;

  return formatCount(messages.home.remainingDays, { count: daysLeft });
}
