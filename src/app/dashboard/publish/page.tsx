import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { publishApprovedListing } from "./actions";

export const dynamic = "force-dynamic";

export default async function PublisherPage({
  searchParams,
}: {
  searchParams: Promise<{ published?: string; error?: string }>;
}) {
  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const roles = (claims?.app_metadata as { roles?: unknown } | undefined)?.roles;
  if (authError || !claims?.sub || !Array.isArray(roles) || !roles.includes("listing_publisher")) {
    redirect("/dashboard?message=Publisher%20access%20is%20required.");
  }

  const params = await searchParams;
  const { data: listings, error } = await supabase
    .from("property_listings")
    .select("id,public_reference,headline,description,listing_kind,property_type,division,district,upazila,locality,public_location_label,price_amount,currency_code,area_value,area_unit,area_basis,bedrooms,bathrooms,status,submitted_at,updated_at")
    .eq("status", "approved")
    .order("updated_at", { ascending: true })
    .limit(50);

  return (
    <main className="seller-workspace">
      <div className="container">
        <Link className="seller-back" href="/dashboard">← Account workspace</Link>
        <span className="eyebrow">PUBLISHER WORKSPACE</span>
        <h1>Approved listings</h1>
        <p className="seller-intro">Only listings approved by the review process appear here. Publishing makes the approved public fields visible in the public catalogue; it does not certify ownership, title, condition or legal compliance.</p>
        {params.published ? <p className="seller-notice" role="status">Listing published. It can now appear in the public catalogue.</p> : null}
        {params.error ? <p className="seller-notice seller-error" role="alert">{params.error}</p> : null}
        {error ? (
          <p className="seller-notice seller-error" role="alert">The publication queue could not be loaded. No listing was changed.</p>
        ) : listings?.length ? (
          <div className="seller-listing-grid">
            {listings.map((listing) => (
              <article className="seller-listing-card" key={listing.id}>
                <div className="seller-listing-top">
                  <span className="seller-reference">{listing.public_reference}</span>
                  <span className="seller-status seller-status-approved">Approved · awaiting publication</span>
                </div>
                <h2>{listing.headline}</h2>
                <p className="seller-location">{[listing.locality, listing.upazila, listing.district, listing.division].filter(Boolean).join(", ")}</p>
                <p>{listing.description}</p>
                <dl className="seller-facts">
                  <div><dt>Type</dt><dd>{listing.property_type} · {listing.listing_kind}</dd></div>
                  <div><dt>Price</dt><dd>{listing.price_amount === null ? "Not provided" : new Intl.NumberFormat("en-BD", { style: "currency", currency: listing.currency_code, maximumFractionDigits: 0 }).format(listing.price_amount)}</dd></div>
                  <div><dt>Area</dt><dd>{listing.area_value === null ? "Not provided" : [listing.area_value, listing.area_unit, listing.area_basis].filter(Boolean).join(" · ")}</dd></div>
                  <div><dt>Bedrooms / bathrooms</dt><dd>{listing.bedrooms ?? "—"} / {listing.bathrooms ?? "—"}</dd></div>
                </dl>
                <form action={publishApprovedListing} className="seller-submit-form">
                  <input type="hidden" name="listing_id" value={listing.id} />
                  <label htmlFor={"publish-reason-" + listing.id}>Publication note (required)</label>
                  <textarea id={"publish-reason-" + listing.id} name="reason" required minLength={10} maxLength={1000} rows={3} placeholder="Record the final publication checks completed." />
                  <button className="button button-dark" type="submit">Publish listing</button>
                </form>
              </article>
            ))}
          </div>
        ) : (
          <section className="seller-empty">
            <h2>No approved listings awaiting publication</h2>
            <p>Listings appear here only after a reviewer approves them. Publishing remains a separate permission and action.</p>
          </section>
        )}
        <p className="seller-disclaimer">Publishing is a catalogue visibility decision only. Do not use it as a representation of verified title, legal clearance, physical inspection or guaranteed property condition.</p>
      </div>
    </main>
  );
}
