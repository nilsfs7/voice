/** Account age helpers for creator ballot roster (FR-PO-035 / FR-PO-036). */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type AccountAge =
  | { unit: "days"; count: number }
  | { unit: "years"; count: number };

export function parseJoined(value: unknown): Date | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

/** Whole days while under 365 days; otherwise whole years (floor). */
export function accountAgeSince(
  joined: Date,
  now: Date = new Date(),
): AccountAge {
  const ms = Math.max(0, now.getTime() - joined.getTime());
  const days = Math.floor(ms / MS_PER_DAY);
  if (days < 365) return { unit: "days", count: days };
  return { unit: "years", count: Math.floor(days / 365) };
}

/** True when the FSMeet account was created after the poll row. */
export function isAccountNewerThanPoll(
  joined: Date,
  pollCreatedAt: Date,
): boolean {
  return joined.getTime() > pollCreatedAt.getTime();
}
