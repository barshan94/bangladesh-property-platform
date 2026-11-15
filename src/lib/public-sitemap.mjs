function validDate(value) {
  if (typeof value !== "string" && !(value instanceof Date)) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function buildPublicSitemapEntries({
  siteUrl,
  routes,
  listings = [],
  knowledge = [],
}) {
  const base = new URL(siteUrl);
  const entries = new Map<string, SitemapItem>();

  for (const route of routes) {
    const url = new URL(route, base).toString();
    entries.set(url, { url });
  }

  for (const listing of listings) {
    if (!listing || typeof listing.reference !== "string" || !listing.reference) continue;
    const url = new URL(`/properties/${encodeURIComponent(listing.reference)}`, base).toString();
    entries.set(url, { url, ...(validDate(listing.updatedAt) ? { lastModified: validDate(listing.updatedAt) } : {}) });
  }

  for (const item of knowledge) {
    if (!item || typeof item.slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug)) continue;
    const url = new URL(`/knowledge/${encodeURIComponent(item.slug)}`, base).toString();
    const modified = validDate(item.reviewed_at) ?? validDate(item.published_at);
    entries.set(url, { url, ...(modified ? { lastModified: modified } : {}) });
  }

  return [...entries.values()];
}
