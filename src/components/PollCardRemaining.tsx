"use client";

import { useLocale, useMessages } from "@/components/I18nProvider";
import { formatPollCardRemaining } from "@/lib/polls/remaining";

/** Client-side remaining-time label so “Today HH:mm” uses the viewer TZ (FR-PO-030). */
export function PollCardRemaining({ endAt }: { endAt: Date | string }) {
  const messages = useMessages();
  const locale = useLocale();
  return (
    <span>{formatPollCardRemaining(endAt, messages, locale)}</span>
  );
}
