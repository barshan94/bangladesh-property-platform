import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import type { PropertyListing } from "@/types/property";

type ListingRow = Database["public"]["Tables"]["property_listings"]["Row"];
type PublicListingRow = Pick<ListingRow, "public_reference" | "listing_kind" | "property_type" | "headline" | "description" | "district" | "upazila" | "locality" | "public_location_label" | "price_amount" | "area_value" | "area_unit" | "area_basis" | "bedrooms" | "bathrooms" | "published_at" | "updated_at" | "expires_at">;
const publicListingColumns = "public_reference,listing_kind,property_type,headline,description,district,upazila,locality,public_location_label,price_amount,area_value,area_unit,area_basis,bedrooms,bathrooms,published_at,updated_at,expires_at";
const disclosure = "Platform publication indicates that listing content passed moderation. It is not a legal title opinion, an ownership certificate, a physical inspection result or a guarantee of property condition.";

export function mapPublicListing(row: PublicListingRow): PropertyListing {
  const location = row.public_location_label?.trim()
    || [row.upazila, row.district].filter(Boolean).join(", ")
    || row.district;
  return {
    reference: row.public_reference,
    slug: row.public_reference,
    title: row.headline,
    description: row.description,
    propertyType: row.property_type as PropertyListing["propertyType"],
    listingKind: row.listing_kind as PropertyListing["listingKind"],
    priceAmount: row.price_amount,
    currency: "BDT",
    priceNegotiable: false,
    ...(row.area_value !== null ? { areaValue: row.area_value } : {}),
    ...(row.area_unit !== null ? { areaUnit: row.area_unit as PropertyListing["areaUnit"] } : {}),
    ...(row.area_basis !== null ? { areaBasis: row.area_basis as PropertyListing["areaBasis"] } : {}),
    ...(row.bedrooms !== null ? { bedrooms: row.bedrooms } : {}),
    ...(row.bathrooms !== null ? { bathrooms: row.bathrooms } : {}),
    district: row.district,
    ...(row.upazila ? { upazila: row.upazila } : {}),
    ...(row.locality ? { locality: row.locality } : {}),
    publicLocationLabel: location,
    // No public-media table exists yet. Never expose private evidence as listing imagery.
    images: [],
    // Trust labels require their own evidence and review records; none are inferred here.
    trustLabels: [],
    publishedAt: row.published_at ?? row.updated_at,
    updatedAt: row.updated_at,
    ...(row.expires_at ? { expiresAt: row.expires_at } : {}),
    disclosure,
  };
}

export async function getPublishedListings() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("property_listings")
    .select(publicListingColumns)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(100);
  return { listings: data?.map(mapPublicListing) ?? [], error };
}

export async function getPublishedListing(reference: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("property_listings")
    .select(publicListingColumns)
    .eq("public_reference", reference)
    .eq("status", "published")
    .maybeSingle();
  return { listing: data ? mapPublicListing(data) : null, error };
}
