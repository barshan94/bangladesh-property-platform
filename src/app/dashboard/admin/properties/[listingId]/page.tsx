import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { updateAdminPropertyListing } from "../actions";

export const dynamic = "force-dynamic";

const propertyTypes = ["apartment", "house", "land", "commercial", "industrial", "other"];
const listingKinds = ["sale", "rent", "lease"];
const areaUnits = ["sqft", "sqm", "katha", "decimal", "acre"];
const areaBases = ["land", "floor", "built_up", "carpet", "gross"];
const occupancy = ["unknown", "vacant", "occupied", "under_construction"];

export default async function AdminPropertyEditPage({ params, searchParams }: {
  params: Promise<{ listingId: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { listingId } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(listingId)) notFound();
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getClaims();
  const roles = (auth?.claims?.app_metadata as { roles?: unknown } | undefined)?.roles;
  if (authError || !auth?.claims?.sub || !Array.isArray(roles) || !roles.includes("administrator")) redirect("/dashboard?message=Administrator%20access%20is%20required.");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) return <main className="seller-workspace"><div className="container seller-form-container"><Link className="seller-back" href="/dashboard/admin/properties">← All property records</Link><h1>Property editor unavailable</h1><p className="seller-notice seller-error">The secure server-side property management connection is not configured. No record was loaded.</p></div></main>;
  const admin = createSupabaseClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: listing, error } = await admin.from("property_listings")
    .select("id,public_reference,headline,description,listing_kind,property_type,division,district,upazila,locality,public_location_label,price_amount,area_value,area_unit,area_basis,bedrooms,bathrooms,occupancy_status,status")
    .eq("id", listingId).maybeSingle();
  if (error) return <main className="seller-workspace"><div className="container seller-form-container"><Link className="seller-back" href="/dashboard/admin/properties">← All property records</Link><h1>Unable to load property</h1><p className="seller-notice seller-error">The property could not be loaded. Confirm that the required database migrations are applied.</p></div></main>;
  if (!listing) notFound();
  const notices = await searchParams;
  return <main className="seller-workspace"><div className="container seller-form-container">
    <Link className="seller-back" href="/dashboard/admin/properties">← All property records</Link>
    <span className="eyebrow">ADMINISTRATOR CONTENT CORRECTION</span>
    <h1>Edit {listing.public_reference}</h1>
    <p className="seller-intro">Correct listing content across any seller account. This does not change the seller, public reference, review status or publication status. Every save creates an audit event.</p>
    <p className="seller-notice">Current status: <strong>{listing.status.replaceAll("_"," ")}</strong></p>
    {notices.saved ? <p className="seller-notice" role="status">Property content saved and audit history recorded.</p> : null}
    {notices.error ? <p className="seller-notice seller-error" role="alert">{notices.error}</p> : null}
    <form action={updateAdminPropertyListing} className="seller-form-card seller-form">
      <input type="hidden" name="listing_id" value={listing.id}/>
      <label htmlFor="headline">Property title</label><input id="headline" name="headline" required minLength={10} maxLength={180} defaultValue={listing.headline}/>
      <label htmlFor="description">Description</label><textarea id="description" name="description" required minLength={30} maxLength={12000} rows={7} defaultValue={listing.description}/>
      <label htmlFor="listing_kind">Listing purpose</label><select id="listing_kind" name="listing_kind" defaultValue={listing.listing_kind}>{listingKinds.map(v=><option key={v} value={v}>{v}</option>)}</select>
      <label htmlFor="property_type">Property type</label><select id="property_type" name="property_type" defaultValue={listing.property_type}>{propertyTypes.map(v=><option key={v} value={v}>{v}</option>)}</select>
      <label htmlFor="division">Division</label><input id="division" name="division" required minLength={2} maxLength={80} defaultValue={listing.division}/>
      <label htmlFor="district">District</label><input id="district" name="district" required minLength={2} maxLength={80} defaultValue={listing.district}/>
      <label htmlFor="upazila">Upazila</label><input id="upazila" name="upazila" maxLength={80} defaultValue={listing.upazila ?? ""}/>
      <label htmlFor="locality">Locality</label><input id="locality" name="locality" maxLength={160} defaultValue={listing.locality ?? ""}/>
      <label htmlFor="public_location_label">Public location label</label><input id="public_location_label" name="public_location_label" maxLength={180} defaultValue={listing.public_location_label ?? ""}/>
      <label htmlFor="price_amount">Price (BDT)</label><input id="price_amount" name="price_amount" type="number" min="0" step="0.01" defaultValue={listing.price_amount ?? ""}/>
      <label htmlFor="area_value">Area value</label><input id="area_value" name="area_value" type="number" min="0.001" step="0.001" defaultValue={listing.area_value ?? ""}/>
      <label htmlFor="area_unit">Area unit</label><select id="area_unit" name="area_unit" defaultValue={listing.area_unit ?? ""}><option value="">Not provided</option>{areaUnits.map(v=><option key={v} value={v}>{v}</option>)}</select>
      <label htmlFor="area_basis">Area basis</label><select id="area_basis" name="area_basis" defaultValue={listing.area_basis ?? ""}><option value="">Not provided</option>{areaBases.map(v=><option key={v} value={v}>{v.replaceAll("_"," ")}</option>)}</select>
      <label htmlFor="bedrooms">Bedrooms</label><input id="bedrooms" name="bedrooms" type="number" min="0" max="100" step="1" defaultValue={listing.bedrooms ?? ""}/>
      <label htmlFor="bathrooms">Bathrooms</label><input id="bathrooms" name="bathrooms" type="number" min="0" max="100" step="0.5" defaultValue={listing.bathrooms ?? ""}/>
      <label htmlFor="occupancy_status">Occupancy</label><select id="occupancy_status" name="occupancy_status" defaultValue={listing.occupancy_status}>{occupancy.map(v=><option key={v} value={v}>{v.replaceAll("_"," ")}</option>)}</select>
      <button className="button button-dark" type="submit">Save property changes</button>
    </form>
    <p className="seller-disclaimer">Admin corrections do not verify ownership, title, condition or legal compliance. Changes to listing status remain in the reviewer and publisher workflows.</p>
  </div></main>;
}
