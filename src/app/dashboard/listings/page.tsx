import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { submitListing } from "./actions";
import { ListingMediaUpload } from "./listing-media-upload";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  draft: "Draft", submitted: "Submitted", under_review: "Under review",
  changes_requested: "Changes requested", approved: "Approved", published: "Published",
  rejected: "Rejected", withdrawn: "Withdrawn", expired: "Expired", archived: "Archived",
};

function formatPrice(amount: number | null, currency: string) {
  if (amount === null) return "Price not provided";
  return new Intl.NumberFormat("en-BD", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export default async function MyListingsPage({ searchParams }: { searchParams: Promise<{ created?: string; submitted?: string; error?: string }> }) {
  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (authError || !userId) redirect("/login?message=Sign%20in%20to%20view%20your%20listings.");
  const params = await searchParams;

  const { data: listings, error } = await supabase
    .from("property_listings")
    .select("id,public_reference,headline,status,listing_kind,property_type,district,upazila,price_amount,currency_code,created_at,updated_at")
    .eq("owner_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <main className="seller-workspace">
      <div className="container">
        <Link className="seller-back" href="/dashboard">← Account workspace</Link>
        <span className="eyebrow">SELLER WORKSPACE</span>
        <h1>My property listings</h1>
        <Link className="button button-dark seller-create-link" href="/dashboard/listings/new">Create property draft</Link>
        <p className="seller-intro">Review the listings associated with your account. Drafts and submissions remain private until the separate review and publication process is complete.</p>
        {params.created ? <p className="seller-notice" role="status">Draft saved: {params.created}</p> : null}
        {params.submitted ? <p className="seller-notice" role="status">Your listing was submitted for review. It is not published yet.</p> : null}
        {params.error ? <p className="seller-notice seller-error" role="alert">{params.error}</p> : null}

        {error ? (
          <div className="seller-notice seller-error" role="alert">We could not load your listings. Please refresh the page. Your account data has not been changed.</div>
        ) : listings?.length ? (
          <div className="seller-listing-grid">
            {listings.map((listing) => (
              <article className="seller-listing-card" key={listing.id}>
                <div className="seller-listing-top">
                  <span className="seller-reference">{listing.public_reference}</span>
                  <span className={"seller-status seller-status-" + listing.status}>{statusLabels[listing.status] ?? "Pending status"}</span>
                </div>
                <h2>{listing.headline}</h2>
                <p className="seller-location">{[listing.upazila, listing.district].filter(Boolean).join(", ")}</p>
                <p className="seller-price">{formatPrice(listing.price_amount, listing.currency_code)}</p>
                <dl className="seller-facts">
                  <div><dt>Property</dt><dd>{listing.property_type}</dd></div>
                  <div><dt>Listing</dt><dd>{listing.listing_kind}</dd></div>
                  <div><dt>Created</dt><dd>{new Intl.DateTimeFormat("en-BD", { dateStyle: "medium" }).format(new Date(listing.created_at))}</dd></div>
                </dl>
                {listing.status === "draft" || listing.status === "changes_requested" ? (
                  <ListingMediaUpload listingId={listing.id} />
                ) : null}
                {listing.status === "draft" ? (
                  <form action={submitListing} className="seller-submit-form">
                    <input type="hidden" name="listing_id" value={listing.id} />
                    <button className="button button-dark" type="submit">Submit for review</button>
                  </form>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <section className="seller-empty">
            <span className="seller-empty-mark" aria-hidden="true">⌂</span>
            <h2>No property listings yet</h2>
            <p>Create a private draft to begin. Submitting a draft starts the review queue but does not publish the property or verify its ownership.</p>
            <Link className="button button-dark" href="/dashboard/listings/new">Create property draft</Link>
          </section>
        )}
        <p className="seller-disclaimer">A listing status is an administrative workflow state. It is not a legal title opinion, ownership certificate, physical inspection result or guarantee of property condition.</p>
      </div>
    </main>
  );
}
