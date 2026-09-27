"use client";

import { useLocale } from "@/components/I18nProvider";

/** Renders an instant in the viewer's local timezone (not the server TZ). */
export function LocalDateTime({
  value,
  options,
}: {
  value: Date | string;
  options?: Intl.DateTimeFormatOptions;
}) {
  const locale = useLocale();
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return (
    <time dateTime={date.toISOString()}>
      {date.toLocaleString(locale, options)}
    </time>
  );
}
