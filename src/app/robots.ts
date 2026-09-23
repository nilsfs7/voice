import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";

/** Crawl rules + sitemap hint (TECH-16). AI crawlers are not blocked. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/my-votes", "/polls/new", "/polls/*/edit"],
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
