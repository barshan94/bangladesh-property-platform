import Link from "next/link";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { requireActiveAdministrator } from "@/lib/supabase/require-active-administrator";

export const dynamic = "force-dynamic";

type Listing = {
  id: string;
  public_reference: string;
  headline: string;
  district: string;
  division: string;
  listing_kind: string;
  property_type: string;
  price_amount: number | null;
  currency_code: string;
  status: string;
  created_at: string;
  submitted_at: string | null;
  published_at: string | null;
};

const statuses = ["draft", "submitted", "under_review", "changes_requested", "approved", "published", "rejected", "withdrawn", "expired", "archived"];

function price(value: number | null, currency: string) {
  return value === null ? "Price not provided" : new Intl.NumberFormat("en-BD", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

export default async function AdminPropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; error?: string }>;
}) {
  await requireActiveAdministrator();

  const params = await searchParams;
  const query = (params.q ?? "").replace(/[,.()%_*]/g, " ").replace(/\s+/g, " ").trim().slice(0, 100);
  const status = statuses.includes(params.status ?? "") ? params.status! : "";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    return <main className="seller-workspace"><div className="container seller-form-container"><Link className="seller-back" href="/dashboard/admin">← Admin control panel</Link><h1>Property records</h1><p className="seller-notice seller-error" role="alert">The secure server-side property management connection is not configured. No records were loaded.</p></div></main>;
  }

  const admin = createSupabaseClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false } });
  let request = admin.from("property_listings")
    .select("id,public_reference,headline,district,division,listing_kind,property_type,price_amount,currency_code,status,created_at,submitted_at,published_at")
    .order("created_at", { ascending: false }).limit(100);
  if (status) request = request.eq("status", status);
  if (query) request = request.or("public_reference.ilike.%"+query+"%,headline.ilike.%"+query+"%,district.ilike.%"+query+"%");
  const { data, error } = await request;
  const listings = (data ?? []) as Listing[];

  return (
    <main className="seller-workspace">
      <div className="container seller-form-container">
        <Link className="seller-back" href="/dashboard/admin">← Admin control panel</Link>
        <span className="eyebrow">PROPERTY MANAGEMENT</span>
        <h1>All property records</h1>
        <p className="seller-intro">Search and correct property content across all sellers. Ownership, public references and listing review/publication decisions remain protected by the audited workflow.</p>
        {params.error ? <p className="seller-notice seller-error" role="alert">{params.error}</p> : null}
        <form method="get" className="seller-form-card seller-form">
          <label htmlFor="property-search">Search reference, title or district</label>
          <input id="property-search" name="q" maxLength={100} defaultValue={query} placeholder="e.g. BPP-… or Dhanmondi" />
          <label htmlFor="property-status">Filter by status</label>
          <select id="property-status" name="status" defaultValue={status}>
            <option value="">All statuses</option>
            {statuses.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}
          </select>
          <button className="button button-dark" type="submit">Search properties</button>
          <Link className="button button-outline-dark" href="/dashboard/admin/properties">Clear filters</Link>
        </form>
        {error ? <p className="seller-notice seller-error" role="alert">Property records could not be loaded. Check the server-side database configuration and property table availability.</p> : (
          <>
            <p className="seller-intro">Showing {listings.length} record(s), maximum 100 per search.</p>
            {listings.length ? <div className="seller-listing-grid">
              {listings.map((item) => (
                <article className="seller-listing-card" key={item.id}>
                  <div className="seller-listing-top"><span className="seller-reference">{item.public_reference}</span><span className={"seller-status seller-status-" + item.status}>{item.status.replaceAll("_", " ")}</span></div>
                  <h2>{item.headline}</h2>
                  <Link className="button button-outline-dark" href={"/dashboard/admin/properties/" + item.id}>Edit property content</Link>
                  <p className="seller-location">{[item.district, item.division].filter(Boolean).join(", ")}</p>
                  <p className="seller-price">{price(item.price_amount, item.currency_code)}</p>
                  <dl className="seller-facts">
                    <div><dt>Property</dt><dd>{item.property_type} · {item.listing_kind}</dd></div>
                    <div><dt>Created</dt><dd>{new Intl.DateTimeFormat("en-BD", { dateStyle: "medium" }).format(new Date(item.created_at))}</dd></div>
                    <div><dt>Submitted</dt><dd>{item.submitted_at ? new Intl.DateTimeFormat("en-BD", { dateStyle: "medium" }).format(new Date(item.submitted_at)) : "Not submitted"}</dd></div>
                    <div><dt>Published</dt><dd>{item.published_at ? new Intl.DateTimeFormat("en-BD", { dateStyle: "medium" }).format(new Date(item.published_at)) : "Not published"}</dd></div>
                  </dl>
                  {item.status === "submitted" || item.status === "under_review" ? <Link className="button button-outline-dark" href="/dashboard/review">Open reviewer queue</Link> : null}
                  {item.status === "approved" || item.status === "published" ? <Link className="button button-outline-dark" href="/dashboard/publish">Open publisher queue</Link> : null}
                </article>
              ))}
            </div> : <section className="seller-empty"><h2>No matching properties</h2><p>Try another search term or status.</p></section>}
          </>
        )}
        <p className="seller-disclaimer">Content corrections are recorded in the audit history. This editor cannot change the seller, public reference, listing status or publication state. Use the separate reviewer and publisher workspaces for listing decisions.</p>
      </div>
    </main>
  );
}
