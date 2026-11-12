import type { MetadataRoute } from "next";
import { getSiteUrl, isSearchIndexingEnabled } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  const indexingEnabled = isSearchIndexingEnabled();

  return {
    rules: {
      userAgent: "*",
      allow: indexingEnabled ? "/" : undefined,
      disallow: indexingEnabled ? undefined : "/",
    },
    sitemap:
      indexingEnabled && siteUrl
        ? new URL("/sitemap.xml", siteUrl).toString()
        : undefined,
  };
}
