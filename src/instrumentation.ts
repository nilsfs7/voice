/**
 * Runs once when the Next.js Node server starts (TECH-14).
 * Skipped during edge runtime and when DATABASE_URL is unset (e.g. image build).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.warn("[voice] DATABASE_URL not set; skipping DB migrate");
    return;
  }

  const { runMigrations } = await import("../scripts/migrate.mjs");
  await runMigrations();
}
