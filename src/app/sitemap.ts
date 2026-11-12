import type { MetadataRoute } from "next";
import { getSiteUrl, isSearchIndexingEnabled } from "@/lib/site";

const publicRoutes = [
  "/",
  "/properties",
  "/services",
  "/about",
  "/buy-property",
  "/sell-property",
  "/faqs",
  "/contact",
  "/privacy",
  "/terms",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();

  if (!siteUrl || !isSearchIndexingEnabled()) {
    return [];
  }

  return publicRoutes.map((route) => ({
    url: new URL(route, siteUrl).toString(),
  }));
}
