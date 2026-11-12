export function getSiteUrl(): URL | null {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!configuredUrl) {
    return null;
  }

  try {
    const url = new URL(configuredUrl);
    const isLocalDevelopment = url.hostname === "localhost";
    const isSecureOrigin = url.protocol === "https:" || isLocalDevelopment;
    const isOriginOnly =
      url.pathname === "/" &&
      !url.search &&
      !url.hash &&
      !url.username &&
      !url.password;

    if (!isSecureOrigin || !isOriginOnly) {
      return null;
    }

    return new URL(url.origin);
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
