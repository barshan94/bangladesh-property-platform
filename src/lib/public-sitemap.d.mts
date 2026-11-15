type SitemapItem = { url: string; lastModified?: Date };
export function buildPublicSitemapEntries(args: {
  siteUrl: string;
  routes: string[];
  listings?: Array<{ reference: string; updatedAt?: string }>;
  knowledge?: Array<{ slug: string; published_at?: string; reviewed_at?: string }>;
}): SitemapItem[];
