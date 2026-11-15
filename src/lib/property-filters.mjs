const numeric = (value) => {
  if (value === "" || value === undefined || value === null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
};

export function filterPropertyListings(listings, filters) {
  const keyword = String(filters.keyword ?? "").trim().toLocaleLowerCase();
  const district = String(filters.district ?? "");
  const propertyType = String(filters.propertyType ?? "");
  const listingKind = String(filters.listingKind ?? "");
  const areaUnit = String(filters.areaUnit ?? "");
  const trustLabel = String(filters.trustLabel ?? "");
  const minPrice = numeric(filters.minimumPrice);
  const maxPrice = numeric(filters.maximumPrice);
  const minArea = numeric(filters.minimumArea);
  const minBedrooms = numeric(filters.minimumBedrooms);
  const minBathrooms = numeric(filters.minimumBathrooms);

  return listings.filter((listing) => {
    const searchable = [
      listing.title,
      listing.description,
      listing.district,
      listing.upazila ?? "",
      listing.locality ?? "",
      listing.publicLocationLabel,
    ].join(" ").toLocaleLowerCase();

    if (keyword && !searchable.includes(keyword)) return false;
    if (district && listing.district !== district) return false;
    if (propertyType && listing.propertyType !== propertyType) return false;
    if (listingKind && listing.listingKind !== listingKind) return false;
    if (minPrice !== undefined && (listing.priceAmount === null || listing.priceAmount < minPrice)) return false;
    if (maxPrice !== undefined && (listing.priceAmount === null || listing.priceAmount > maxPrice)) return false;
    if (minArea !== undefined && (!areaUnit || listing.areaUnit !== areaUnit || listing.areaValue === undefined || listing.areaValue < minArea)) return false;
    if (minBedrooms !== undefined && (listing.bedrooms === undefined || listing.bedrooms < minBedrooms)) return false;
    if (minBathrooms !== undefined && (listing.bathrooms === undefined || listing.bathrooms < minBathrooms)) return false;
    if (trustLabel && !listing.trustLabels.includes(trustLabel)) return false;
    return true;
  });
}
