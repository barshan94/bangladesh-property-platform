import type { PropertyListing } from "../types/property";

export interface PropertyFilters {
  keyword?: string;
  district?: string;
  propertyType?: string;
  listingKind?: string;
  minimumPrice?: string;
  maximumPrice?: string;
  minimumArea?: string;
  areaUnit?: string;
  minimumBedrooms?: string;
  minimumBathrooms?: string;
  trustLabel?: string;
}

export function filterPropertyListings(
  listings: PropertyListing[],
  filters: PropertyFilters,
): PropertyListing[];
