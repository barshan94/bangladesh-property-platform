import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { transitionListingForReview } from "./actions";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  submitted: "Awaiting review",
  under_review: "Under review",
};

export default async function ListingReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string; error?: string }>;
}) {
  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const roles = (claims?.app_metadata as { roles?: unknown } | undefined)?.roles;
  if (authError || !claims?.sub || !Array.isArray(roles) || !roles.includes("listing_reviewer")) {
    redirect("/dashboard?message=Reviewer%20access%20is%20required.");
  }

  const params = await searchParams;
  const { data: listings, error } = await supabase
    .from("property_listings")
    .select("id,public_reference,headline,description,listing_kind,property_type,division,district,upazila,locality,public_location_label,price_amount,currency_code,area_value,area_unit,area_basis,bedrooms,bathrooms,status,submitted_at,created_at")
    .in("status", ["submitted", "under_review"])
    .order("submitted_at", { ascending: true })
    .limit(50);

  return (
    <main className="seller-workspace">
      <div className="container">
        <Link className="seller-back" href="/dashboard">← Account workspace</Link>
        <span className="eyebrow">STAFF WORKSPACE</span>
        <h1>Listing review queue</h1>
        <p className="seller-intro">Review submitted listing information and record an administrative decision. This queue does not establish ownership, verify title or replace a physical inspection or legal opinion.</p>
        {params.updated ? <p className="seller-notice" role="status">Review action recorded.</p> : null}
        {params.error ? <p className="seller-notice seller-error" role="alert">{params.error}</p> : null}
        {error ? (
          <p className="seller-notice seller-error" role="alert">The review queue could not be loaded. No listing was changed.</p>
        ) : listings?.length ? (
          <div className="seller-listing-grid">
            {listings.map((listing) => (
              <article className="seller-listing-card" key={listing.id}>
                <div className="seller-listing-top">
                  <span className="seller-reference">{listing.public_reference}</span>
                  <span className={"seller-status seller-status-" + listing.status}>{statusLabels[listing.status] ?? listing.status}</span>
                </div>
                <h2>{listing.headline}</h2>
                <p className="seller-location">{[listing.locality, listing.upazila, listing.district, listing.division].filter(Boolean).join(", ")}</p>
                <p>{listing.description}</p>
                <dl className="seller-facts">
                  <div><dt>Type</dt><dd>{listing.property_type} · {listing.listing_kind}</dd></div>
                  <div><dt>Price</dt><dd>{listing.price_amount === null ? "Not provided" : new Intl.NumberFormat("en-BD", { style: "currency", currency: listing.currency_code, maximumFractionDigits: 0 }).format(listing.price_amount)}</dd></div>
                  <div><dt>Area</dt><dd>{listing.area_value === null ? "Not provided" : [listing.area_value, listing.area_unit, listing.area_basis].filter(Boolean).join(" · ")}</dd></div>
                  <div><dt>Bedrooms / bathrooms</dt><dd>{listing.bedrooms ?? "—"} / {listing.bathrooms ?? "—"}</dd></div>
                  <div><dt>Submitted</dt><dd>{listing.submitted_at ? new Intl.DateTimeFormat("en-BD", { dateStyle: "medium", timeStyle: "short" }).format(new Date(listing.submitted_at)) : "Not recorded"}</dd></div>
                </dl>
                {listing.status === "submitted" ? (
                  <form action={transitionListingForReview} className="seller-submit-form">
                    <input type="hidden" name="listing_id" value={listing.id} />
                    <input type="hidden" name="to_status" value="under_review" />
                    <button className="button button-dark" type="submit">Start review</button>
                  </form>
                ) : (
                  <div className="seller-review-actions">
                    <form action={transitionListingForReview}>
                      <input type="hidden" name="listing_id" value={listing.id} />
                      <label htmlFor={"reason-" + listing.id}>Decision reason (required)</label>
                      <textarea id={"reason-" + listing.id} name="reason" required maxLength={2000} rows={3} placeholder="Explain what was checked and what the seller must address." />
                      <div className="seller-review-buttons">
                        <button className="button button-dark" name="to_status" value="changes_requested" type="submit">Request changes</button>
                        <button className="button button-dark" name="to_status" value="approved" type="submit">Approve listing</button>
                        <button className="button button-outline-dark" name="to_status" value="rejected" type="submit">Reject listing</button>
                      </div>
                    </form>
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <section className="seller-empty">
            <h2>No listings awaiting review</h2>
            <p>Submitted seller drafts will appear here when they enter the review queue.</p>
          </section>
        )}
        <p className="seller-disclaimer">Approval is a moderation decision only. Publication is a separate publisher permission. No legal title opinion, ownership certificate, verified label or inspection result is created by this workflow.</p>
      </div>
    </main>
  );
}
