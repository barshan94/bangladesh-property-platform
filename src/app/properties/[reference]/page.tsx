import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageIntro, PageShell } from "@/components/page-shell";
import { getPublishedListing } from "@/lib/public-listings";

export const dynamic = "force-dynamic";

type PropertyDetailProps = {
  params: Promise<{ reference: string }>;
};

export async function generateMetadata({ params }: PropertyDetailProps): Promise<Metadata> {
  const { reference } = await params;
  const { listing } = await getPublishedListing(reference);
  if (!listing) return { title: "Property not found" };
  return { title: listing.title, description: listing.description.slice(0, 155) };
}

export default async function PropertyDetailPage({ params }: PropertyDetailProps) {
  const { reference } = await params;
  const { listing } = await getPublishedListing(reference);
  if (!listing) notFound();
  const purpose = listing.listingKind === "sale" ? "PROPERTY FOR SALE"
    : listing.listingKind === "rent" ? "PROPERTY FOR RENT" : "PROPERTY FOR LEASE";

  return (
    <PageShell>
      <PageIntro eyebrow={purpose} title={listing.title} description={listing.publicLocationLabel} />
      <section className="container section-pad property-detail">
        <div>
          <div className="property-detail-placeholder">No public property image supplied.</div>
          <h2>About this property</h2>
          <p>{listing.description}</p>
          <div className="notice">
            <strong>Important listing disclosure</strong>
            <p>{listing.disclosure}</p>
          </div>
          <h2>Publication and review labels</h2>
          {listing.trustLabels.length ? (
            <ul className="trust-label-list">
              {listing.trustLabels.map((label) => <li key={label}>{label.replaceAll("-", " ")}</li>)}
            </ul>
          ) : (
            <p>No additional evidence-backed review labels have been supplied for this listing.</p>
          )}
        </div>
        <aside className="detail-aside">
          <span className="eyebrow">ASKING PRICE</span>
          <h3>{listing.priceAmount === null
            ? "Price not provided"
            : new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(listing.priceAmount)}</h3>
          <dl className="property-facts">
            <div><dt>Type</dt><dd>{listing.propertyType}</dd></div>
            <div><dt>Purpose</dt><dd>{listing.listingKind === "sale" ? "For sale" : listing.listingKind === "rent" ? "For rent" : "For lease"}</dd></div>
            <div><dt>District</dt><dd>{listing.district}</dd></div>
            {listing.upazila && <div><dt>Upazila</dt><dd>{listing.upazila}</dd></div>}
            {listing.areaValue !== undefined && listing.areaUnit && <div><dt>Area</dt><dd>{listing.areaValue.toLocaleString("en-BD")} {listing.areaUnit}{listing.areaBasis ? ` (${listing.areaBasis.replaceAll("_", " ")})` : ""}</dd></div>}
            {listing.bedrooms !== undefined && <div><dt>Bedrooms</dt><dd>{listing.bedrooms}</dd></div>}
            {listing.bathrooms !== undefined && <div><dt>Bathrooms</dt><dd>{listing.bathrooms}</dd></div>}
            <div><dt>Published</dt><dd>{new Date(listing.publishedAt).toLocaleDateString("en-GB")}</dd></div>
          </dl>
          <a className="button button-dark" href="/contact">Ask about this listing</a>
          <p className="small-note">An inquiry is not a confirmed viewing or transaction. Verify all material facts independently before paying or signing.</p>
        </aside>
      </section>
    </PageShell>
  );
}
