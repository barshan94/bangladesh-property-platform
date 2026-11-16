import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateListingDraft } from "../../actions";

export const dynamic = "force-dynamic";

type Listing = {
  id: string;
  public_reference: string;
  headline: string;
  description: string;
  division: string;
  district: string;
  upazila: string | null;
  locality: string | null;
  public_location_label: string | null;
  price_amount: number | null;
  listing_kind: string;
  property_type: string;
  area_value: number | null;
  area_unit: string | null;
  area_basis: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  status: string;
};

export default async function EditListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ listingId: string }>;
  searchParams: Promise<{ error?: string; warning?: string; saved?: string }>;
}) {
  const { listingId } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(listingId)) {
    redirect("/dashboard/listings?error=Invalid%20listing%20reference.");
  }

  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (authError || typeof userId !== "string" || !userId) {
    redirect("/login?message=Sign%20in%20to%20edit%20your%20listing.");
  }

  const [{ data: listing }, { data: privateDetails }, notice] = await Promise.all([
    supabase
      .from("property_listings")
      .select("id,public_reference,headline,description,division,district,upazila,locality,public_location_label,price_amount,listing_kind,property_type,area_value,area_unit,area_basis,bedrooms,bathrooms,status")
      .eq("id", listingId)
      .eq("owner_user_id", userId)
      .maybeSingle(),
    supabase
      .from("listing_private_details")
      .select("latitude,longitude")
      .eq("listing_id", listingId)
      .eq("owner_user_id", userId)
      .maybeSingle(),
    searchParams,
  ]);

  if (!listing) redirect("/dashboard/listings?error=Listing%20not%20found.");
  const editable = listing.status === "draft" || listing.status === "changes_requested";
  if (!editable) redirect("/dashboard/listings?error=Only%20drafts%20and%20listings%20returned%20for%20changes%20can%20be%20edited.");

  const value = listing as Listing;
  const field = (v: string | number | null | undefined) => v ?? "";

  return (
    <main className="seller-workspace">
      <div className="container seller-form-container">
        <Link className="seller-back" href="/dashboard/listings">← My property listings</Link>
        <span className="eyebrow">EDIT PROPERTY DRAFT</span>
        <h1>Update your property details.</h1>
        <p className="seller-intro">Reference: {value.public_reference}. Only your draft or a listing returned for changes can be edited. Saving details does not submit or publish the property.</p>
        {notice.error ? <p className="seller-notice seller-error" role="alert">{notice.error}</p> : null}
        {notice.warning ? <p className="seller-notice seller-error" role="alert">{notice.warning}</p> : null}
        {notice.saved ? <p className="seller-notice" role="status">Listing details were saved. Map coordinates still need attention.</p> : null}

        <form action={updateListingDraft} className="seller-form">
          <input type="hidden" name="listing_id" value={value.id} />
          <div className="seller-form-grid">
            <label className="seller-field seller-field-wide">Listing title<input name="title" required minLength={10} maxLength={180} defaultValue={value.headline} /></label>
            <label className="seller-field seller-field-wide">Description<textarea name="description" required minLength={30} maxLength={12000} rows={6} defaultValue={value.description} /></label>
            <label className="seller-field">Listing type<select name="listingKind" defaultValue={value.listing_kind}><option value="sale">For sale</option><option value="rent">For rent</option><option value="lease">For lease</option></select></label>
            <label className="seller-field">Property type<select name="propertyType" defaultValue={value.property_type}><option value="apartment">Apartment</option><option value="house">House</option><option value="land">Land</option><option value="commercial">Commercial</option><option value="industrial">Industrial</option><option value="other">Other</option></select></label>
            <label className="seller-field">Division<input name="division" required minLength={2} maxLength={80} defaultValue={value.division} /></label>
            <label className="seller-field">District<input name="district" required minLength={2} maxLength={80} defaultValue={value.district} /></label>
            <label className="seller-field">Upazila / Thana<input name="upazila" maxLength={80} defaultValue={field(value.upazila)} /></label>
            <label className="seller-field">Locality / Area<input name="locality" maxLength={160} defaultValue={field(value.locality)} /></label>
            <label className="seller-field seller-field-wide">Public location label<input name="publicLocationLabel" maxLength={180} defaultValue={field(value.public_location_label)} placeholder="e.g. Dhanmondi, Dhaka" /></label>
            <label className="seller-field">Approximate map latitude (optional)<input name="latitude" type="number" min="-90" max="90" step="0.000001" defaultValue={field(privateDetails?.latitude)} /></label>
            <label className="seller-field">Approximate map longitude (optional)<input name="longitude" type="number" min="-180" max="180" step="0.000001" defaultValue={field(privateDetails?.longitude)} /></label>
            <label className="seller-field">Price in BDT (optional)<input name="priceAmount" type="number" min="0.01" max="99999999999999.99" step="0.01" defaultValue={field(value.price_amount)} /></label>
            <label className="seller-field">Bedrooms<input name="bedrooms" type="number" min="0" max="100" step="1" defaultValue={field(value.bedrooms)} /></label>
            <label className="seller-field">Bathrooms<input name="bathrooms" type="number" min="0" max="100" step="0.1" defaultValue={field(value.bathrooms)} /></label>
            <label className="seller-field">Area value<input name="areaValue" type="number" min="0.001" step="0.001" defaultValue={field(value.area_value)} /></label>
            <label className="seller-field">Area unit<select name="areaUnit" defaultValue={field(value.area_unit)}><option value="">Select unit</option><option value="sqft">Square feet</option><option value="sqm">Square metres</option><option value="katha">Katha</option><option value="decimal">Decimal</option><option value="acre">Acre</option></select></label>
            <label className="seller-field">Area basis<select name="areaBasis" defaultValue={field(value.area_basis)}><option value="">Select basis</option><option value="land">Land</option><option value="floor">Floor</option><option value="built_up">Built-up</option><option value="carpet">Carpet</option><option value="gross">Gross</option></select></label>
          </div>
          <p className="seller-form-note">Area value, unit and basis must be completed together. Leave both coordinates unchanged or enter both. Exact coordinates are stored privately; the public map pin is approximate.</p>
          <button className="button button-dark" type="submit">Save listing details</button>
        </form>
      </div>
    </main>
  );
}
