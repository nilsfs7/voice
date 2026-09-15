function trimSlash(url: string): string {
  return url.replace(/\/$/, "");
}

export function getSiteUrl(): string {
  // Prefer AUTH_URL so Docker runtime `-e AUTH_URL=…` overrides bake-time
  // NEXT_PUBLIC_SITE_URL (Next inlines NEXT_PUBLIC_* at build).
  return trimSlash(
    process.env.AUTH_URL?.trim() ||
      process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
      "http://localhost:3004",
  );
}

export function getFsmeetApiBaseUrl(): string {
  const fromPublic = process.env.NEXT_PUBLIC_FSMEET_API_URL?.trim();
  if (fromPublic) return trimSlash(fromPublic);
  const backend = process.env.BACKEND_URL_FSMEET?.trim();
  if (backend) return `${trimSlash(backend)}/v1`;
  return "https://api.dev.fsmeet.dffb.org/v1";
}

export function getFsmeetFrontendUrl(): string {
  return trimSlash(
    process.env.NEXT_PUBLIC_FSMEET_FRONTEND_URL?.trim() ||
      process.env.FRONTEND_URL_FSMEET?.trim() ||
      "https://dev.fsmeet.dffb.org",
  );
}

export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return url;
}

/** Default for poll editor "Minimum age" field (TECH-10). Not a global gate. */
export function getVoiceMinAge(): number {
  const raw = process.env.VOICE_MIN_AGE?.trim();
  if (!raw) return 12;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > 120) return 12;
  return Math.floor(n);
}
