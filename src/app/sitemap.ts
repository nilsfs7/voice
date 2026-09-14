import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";
import { pollHref } from "@/lib/polls/alias";
import { listPublishedPollsForSitemap } from "@/lib/polls/repository";
import { PUBLIC_SITEMAP_PATHS } from "@/lib/seo/public-paths";

/** Always rebuild so new published polls appear without redeploy (TECH-11). */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = PUBLIC_SITEMAP_PATHS.map(
    (path) => ({
      url: path === "/" ? base : `${base}${path}`,
      lastModified: now,
      changeFrequency: path === "/" ? "daily" : "monthly",
      priority: path === "/" ? 1 : 0.6,
    }),
  );

  let pollEntries: MetadataRoute.Sitemap = [];
  try {
    const polls = await listPublishedPollsForSitemap();
    pollEntries = polls.map((poll) => ({
      url: `${base}${pollHref(poll)}`,
      lastModified: poll.updated_at ?? poll.published_at ?? now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));
  } catch {
    // DB may be unavailable at build/start — still serve static public URLs.
  }

  return [...staticEntries, ...pollEntries];
}
