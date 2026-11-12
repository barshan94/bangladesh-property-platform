export function getSiteUrl(): URL | null {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!configuredUrl) {
    return null;
  }

  try {
    const url = new URL(configuredUrl);
    const isLocalDevelopment = url.hostname === "localhost";

    if (url.protocol !== "https:" && !isLocalDevelopment) {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}

export function isSearchIndexingEnabled(): boolean {
  return (
    process.env.SITE_INDEXING_ENABLED === "true" &&
    getSiteUrl() !== null
  );
}
