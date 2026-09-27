/** Format a Date for `<input type="datetime-local">` in the runtime's local TZ. */
export function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Normalize DB / JSON date values to an ISO-8601 UTC string. */
export function toIsoUtc(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("invalid_date");
  }
  return date.toISOString();
}
