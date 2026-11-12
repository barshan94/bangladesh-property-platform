export type PropertyType =
  | "apartment"
  | "house"
  | "land"
  | "commercial"
  | "industrial"
  | "other";

export type AreaUnit = "sqft" | "katha" | "decimal" | "acre" | "sqm";

export type ListingTrustLabel =
  | "listing-reviewed"
  | "seller-identity-checked"
  | "authority-evidence-reviewed"
  | "documents-received"
  | "record-search-completed"
  | "inspection-report-available";

export interface PropertyListing {
  /** Public, non-sequential reference shown in URLs. */
  reference: string;
  slug: string;
  title: string;
  description: string;
  propertyType: PropertyType;
  listingKind: "sale" | "rent";
  priceAmount: number;
  currency: "BDT";
  priceNegotiable: boolean;
  areaValue?: number;
  areaUnit?: AreaUnit;
  areaBasis?: "land" | "built-up" | "floor";
  bedrooms?: number;
  bathrooms?: number;
  district: string;
  upazila?: string;
  locality?: string;
  publicLocationLabel: string;
  /** Publicly approved image URLs only. Private evidence must never appear here. */
  images: Array<{ src: string; alt: string }>;
  /** Each label must be backed by its own evidence and review record. */
  trustLabels: ListingTrustLabel[];
  publishedAt: string;
  updatedAt: string;
  expiresAt: string;
  /** Listing moderation is not a legal title opinion. */
  disclosure: string;
}
