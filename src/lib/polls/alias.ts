/** Normalize optional poll alias to a URL-safe slug, or null if empty. */
export function normalizeAlias(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const slug = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug.length ? slug : null;
}

export function isValidAlias(alias: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(alias) && alias.length >= 3 && alias.length <= 64;
}

export function pollHref(poll: {
  public_id: string;
  alias?: string | null;
}): string {
  return `/polls/${poll.alias || poll.public_id}`;
}
