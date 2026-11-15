import type { MetadataRoute } from "next";
import { getSiteUrl, isSearchIndexingEnabled } from "@/lib/site";
import { getPublishedListings } from "@/lib/public-listings";
import { getPublishedKnowledgeContent } from "@/lib/knowledge-content";
import { services } from "@/data/services";
import { buildPublicSitemapEntries } from "@/lib/public-sitemap.mjs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const publicRoutes = [
  "/",
  "/properties",
  "/services",
  ...services.map((service) => `/services/${service.slug}`),
  "/about",
  "/buy-property",
  "/sell-property",
  "/faqs",
  "/contact",
  "/knowledge",
  "/videos",
  "/privacy",
  "/terms",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  if (!siteUrl || !isSearchIndexingEnabled()) return [];

  const [listingResult, knowledgeResult] = await Promise.all([
    getPublishedListings(),
    getPublishedKnowledgeContent(),
  ]);

  return buildPublicSitemapEntries({
    siteUrl: siteUrl.toString(),
    routes: publicRoutes,
    listings: listingResult.listings,
    knowledge: knowledgeResult.content,
  });
}
