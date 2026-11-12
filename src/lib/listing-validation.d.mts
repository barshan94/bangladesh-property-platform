export type SellerListingDraft = {
  title: string;
  description: string;
  propertyType: "apartment" | "house" | "land" | "commercial" | "industrial" | "other";
  listingKind: "sale" | "rent";
  priceAmount: number;
  priceNegotiable: boolean;
  district: string;
  publicLocationLabel: string;
  images: Array<{ src: string; alt: string }>;
  areaValue?: number;
  areaUnit?: "sqft" | "katha" | "decimal" | "acre" | "sqm";
  areaBasis?: "land" | "built-up" | "floor";
  bedrooms?: number;
  bathrooms?: number;
  upazila?: string;
  locality?: string;
};

export type ListingDraftValidation =
  | { success: true; data: SellerListingDraft }
  | { success: false; errors: Record<string, string[]> };

/**
 * Validates and normalizes untrusted seller-editable listing fields.
 * This is not authentication, authorization, persistence, moderation, or title verification.
 */
export function validateListingDraft(input: unknown): ListingDraftValidation;
