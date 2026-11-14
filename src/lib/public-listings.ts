import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import type { PropertyListing } from "@/types/property";

type ListingRow = Database["public"]["Tables"]["property_listings"]["Row"];
type PublicListingRow = Pick<ListingRow, "public_reference" | "listing_kind" | "property_type" | "headline" | "description" | "district" | "upazila" | "locality" | "public_location_label" | "price_amount" | "area_value" | "area_unit" | "area_basis" | "bedrooms" | "bathrooms" | "published_at" | "updated_at" | "expires_at">;
type PublicMediaProjectionRow = { public_reference: string; media_id: string };
type PublicMediaRpc = {
  rpc: (name: string, args: { p_public_references: string[] }) =>
    Promise<{ data: unknown; error: { message: string } | null }>;
};

const publicListingColumns = "public_reference,listing_kind,property_type,headline,description,district,upazila,locality,public_location_label,price_amount,area_value,area_unit,area_basis,bedrooms,bathrooms,published_at,updated_at,expires_at";
const disclosure = "Platform publication indicates that listing content passed moderation. It is not a legal title opinion, an ownership certificate, a physical inspection result or a guarantee of property condition.";

function isPublicMediaProjectionRow(value: unknown): value is PublicMediaProjectionRow {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return typeof row.public_reference === "string" && typeof row.media_id === "string";
}

async function getPublicMediaByReference(references: string[]) {
  if (references.length === 0) return new Map<string, PropertyListing["images"]>();
  const supabase = await createClient();
  const rpc = supabase as unknown as PublicMediaRpc;
  const { data, error } = await rpc.rpc("list_public_listing_media", {
    p_public_references: references,
  });
  const images = new Map<string, PropertyListing["images"]>();
  if (error || !Array.isArray(data)) return images;

  for (const value of data) {
    if (!isPublicMediaProjectionRow(value)) continue;
    const current = images.get(value.public_reference) ?? [];
    if (current.length >= 12) continue;
    current.push({
      src: `/api/public/listing-media/${encodeURIComponent(value.media_id)}`,
      alt: "Approved property photograph",
    });
    images.set(value.public_reference, current);
  }
  return images;
}

export function mapPublicListing(
  row: PublicListingRow,
  images: PropertyListing["images"] = [],
): PropertyListing {
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
    images,
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
  if (error || !data) return { listings: [], error };

  const media = await getPublicMediaByReference(data.map((row) => row.public_reference));
  return {
    listings: data.map((row) => mapPublicListing(row, media.get(row.public_reference) ?? [])),
    error: null,
  };
}

export async function getPublishedListing(reference: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("property_listings")
    .select(publicListingColumns)
    .eq("public_reference", reference)
    .eq("status", "published")
    .maybeSingle();
  if (error || !data) return { listing: null, error };

  const media = await getPublicMediaByReference([data.public_reference]);
  return {
    listing: mapPublicListing(data, media.get(data.public_reference) ?? []),
    error: null,
  };
}
