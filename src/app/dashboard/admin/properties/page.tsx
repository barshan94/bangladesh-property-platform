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
const pageSize = 25;

function price(value: number | null, currency: string) {
  return value === null ? "Price not provided" : new Intl.NumberFormat("en-BD", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

function pageHref(query: string, status: string, page: number) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (status) params.set("status", status);
  params.set("page", String(page));
  return "/dashboard/admin/properties?" + params.toString();
}

export default async function AdminPropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string; error?: string }>;
}) {
  await requireActiveAdministrator();

  const params = await searchParams;
  const query = (params.q ?? "").replace(/[,.()%_*]/g, " ").replace(/\s+/g, " ").trim().slice(0, 100);
  const status = statuses.includes(params.status ?? "") ? params.status! : "";
  const requestedPage = /^\d{1,6}$/.test(params.page ?? "") ? Math.max(1, Number(params.page)) : 1;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    return <main className="seller-workspace"><div className="container seller-form-container"><Link className="seller-back" href="/dashboard/admin">← Admin control panel</Link><h1>Property records</h1><p className="seller-notice seller-error" role="alert">The secure server-side property management connection is not configured. No records were loaded.</p></div></main>;
  }

  const admin = createSupabaseClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false } });
  let request = admin.from("property_listings")
    .select("id,public_reference,headline,district,division,listing_kind,property_type,price_amount,currency_code,status,created_at,submitted_at,published_at", { count: "exact" })
    .order("created_at", { ascending: false });
  if (status) request = request.eq("status", status);
  if (query) request = request.or("public_reference.ilike.%"+query+"%,headline.ilike.%"+query+"%,district.ilike.%"+query+"%");

  const totalResult = await request.select("id", { count: "exact", head: true });
  if (totalResult.error) {
    return <main className="seller-workspace"><div className="container seller-form-container"><Link className="seller-back" href="/dashboard/admin">← Admin control panel</Link><h1>All property records</h1><p className="seller-notice seller-error" role="alert">Property records could not be loaded. Check the server-side database configuration and property table availability.</p></div></main>;
  }
  const total = totalResult.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);
  const from = (currentPage - 1) * pageSize;
  const { data, error } = await request
    .select("id,public_reference,headline,district,division,listing_kind,property_type,price_amount,currency_code,status,created_at,submitted_at,published_at")
    .range(from, from + pageSize - 1);
  const listings = (data ?? []) as Listing[];
  const firstRecord = total === 0 ? 0 : from + 1;
  const lastRecord = Math.min(from + listings.length, total);

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
            <p className="seller-intro">Showing {firstRecord}–{lastRecord} of {total} record(s), {pageSize} per page.</p>
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
            {totalPages > 1 ? (
              <nav aria-label="Property record pages" className="seller-pagination">
                {currentPage > 1 ? <Link className="button button-outline-dark" href={pageHref(query, status, currentPage - 1)}>← Previous</Link> : <span aria-disabled="true">← Previous</span>}
                <span aria-current="page">Page {currentPage} of {totalPages}</span>
                {currentPage < totalPages ? <Link className="button button-outline-dark" href={pageHref(query, status, currentPage + 1)}>Next →</Link> : <span aria-disabled="true">Next →</span>}
              </nav>
            ) : null}
          </>
        )}
        <p className="seller-disclaimer">Content corrections are recorded in the audit history. This editor cannot change the seller, public reference, listing status or publication state. Use the separate reviewer and publisher workspaces for listing decisions.</p>
      </div>
    </main>
  );
}
