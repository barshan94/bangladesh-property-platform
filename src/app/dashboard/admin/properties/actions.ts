"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requiredText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}
function optionalText(formData: FormData, key: string) {
  return requiredText(formData, key) || null;
}
function optionalNumber(formData: FormData, key: string) {
  const raw = requiredText(formData, key);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : Number.NaN;
}

export async function updateAdminPropertyListing(formData: FormData) {
  const id = requiredText(formData, "listing_id");
  if (!uuidPattern.test(id)) redirect("/dashboard/admin/properties?error=Invalid%20property%20record.");
  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const roles = (claims?.app_metadata as { roles?: unknown } | undefined)?.roles;
  if (authError || typeof claims?.sub !== "string" || !Array.isArray(roles) || !roles.includes("administrator")) {
    redirect("/dashboard?message=Administrator%20access%20is%20required.");
  }

  const price = optionalNumber(formData, "price_amount");
  const area = optionalNumber(formData, "area_value");
  const bedrooms = optionalNumber(formData, "bedrooms");
  const bathrooms = optionalNumber(formData, "bathrooms");
  if ([price, area, bedrooms, bathrooms].some((v) => v !== null && !Number.isFinite(v))) {
    redirect("/dashboard/admin/properties/" + id + "?error=Enter%20valid%20numbers%20for%20price%20and%20property%20measurements.");
  }
  if (bedrooms !== null && !Number.isInteger(bedrooms)) {
    redirect("/dashboard/admin/properties/" + id + "?error=Bedrooms%20must%20be%20a%20whole%20number.");
  }

  const { error } = await supabase.rpc("admin_update_property_listing", {
    p_listing_id: id,
    p_headline: requiredText(formData, "headline"),
    p_description: requiredText(formData, "description"),
    p_listing_kind: requiredText(formData, "listing_kind"),
    p_property_type: requiredText(formData, "property_type"),
    p_division: requiredText(formData, "division"),
    p_district: requiredText(formData, "district"),
    p_upazila: optionalText(formData, "upazila"),
    p_locality: optionalText(formData, "locality"),
    p_public_location_label: optionalText(formData, "public_location_label"),
    p_price_amount: price,
    p_area_value: area,
    p_area_unit: area === null ? null : requiredText(formData, "area_unit"),
    p_area_basis: area === null ? null : requiredText(formData, "area_basis"),
    p_bedrooms: bedrooms,
    p_bathrooms: bathrooms,
    p_occupancy_status: requiredText(formData, "occupancy_status"),
    p_request_id: randomUUID(),
  });
  if (error) {
    redirect("/dashboard/admin/properties/" + id + "?error=The%20property%20could%20not%20be%20saved.%20Check%20all%20required%20fields%20and%20measurements.");
  }
  redirect("/dashboard/admin/properties/" + id + "?saved=1");
}
