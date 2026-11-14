import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { setListingMediaPublication } from "./actions";

export const dynamic = "force-dynamic";

type MediaRecord = {
  media_id: string;
  listing_id: string;
  public_reference: string;
  headline: string;
  original_filename: string;
  size_bytes: number;
  approved_at: string;
  publication_status: "published" | "unpublished";
  published_at: string | null;
};

type RpcClient = {
  rpc: (name: string) => Promise<{ data: unknown; error: { message: string } | null }>;
};

function isMediaRecord(value: unknown): value is MediaRecord {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return typeof row.media_id === "string" &&
    typeof row.listing_id === "string" &&
    typeof row.public_reference === "string" &&
    typeof row.headline === "string" &&
    typeof row.original_filename === "string" &&
    typeof row.size_bytes === "number" &&
    typeof row.approved_at === "string" &&
    (row.publication_status === "published" || row.publication_status === "unpublished") &&
    (row.published_at === null || typeof row.published_at === "string");
}

export default async function ListingMediaPublicationPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; updated?: string }>;
}) {
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getClaims();
  const claims = auth?.claims;
  const roles = (claims?.app_metadata as { roles?: unknown } | undefined)?.roles;
  const canPublish = Array.isArray(roles) &&
    (roles.includes("listing_publisher") || roles.includes("administrator"));
  if (authError || !claims?.sub || !canPublish) {
    redirect("/dashboard?message=Listing%20media%20publisher%20access%20is%20required.");
  }

  const params = await searchParams;
  const rpc = supabase as unknown as RpcClient;
  const { data, error } = await rpc.rpc("list_approved_listing_media_for_publication");
  const records = Array.isArray(data) ? data.filter(isMediaRecord) : [];

  return (
    <main className="seller-workspace">
      <div className="container">
        <Link className="seller-back" href="/dashboard">← Account workspace</Link>
        <span className="eyebrow">MEDIA PUBLICATION</span>
        <h1>Approved property images</h1>
        <p className="seller-intro">Only separately approved images appear here. Publishing is a second decision, requires a reason, and is recorded in the audit log. This queue does not make images publicly accessible yet.</p>
        {params.error ? <p className="seller-notice seller-error" role="alert">{params.error}</p> : null}
        {params.updated ? <p className="seller-notice" role="status">The publication decision was recorded.</p> : null}
        {error ? (
          <p className="seller-notice seller-error" role="alert">The publisher queue is unavailable. The publication migration may not yet be installed. No publication decision was made.</p>
        ) : records.length ? (
          <div className="seller-listing-grid">
            {records.map((item) => (
              <article className="seller-listing-card" key={item.media_id}>
                <div className="seller-listing-top">
                  <span className="seller-reference">{item.public_reference}</span>
                  <span className={item.publication_status === "published" ? "seller-status seller-status-published" : "seller-status seller-status-under_review"}>
                    {item.publication_status === "published" ? "Published decision" : "Not published"}
                  </span>
                </div>
                <h2>{item.headline}</h2>
                <p className="seller-location">{item.original_filename}</p>
                <dl className="seller-facts">
                  <div><dt>Approved</dt><dd>{new Intl.DateTimeFormat("en-BD", { dateStyle: "medium", timeZone: "Asia/Dhaka" }).format(new Date(item.approved_at))}</dd></div>
                  <div><dt>Canonical size</dt><dd>{(item.size_bytes / 1024).toFixed(0)} KiB</dd></div>
                  <div><dt>Publication</dt><dd>{item.published_at ? new Intl.DateTimeFormat("en-BD", { dateStyle: "medium", timeZone: "Asia/Dhaka" }).format(new Date(item.published_at)) : "Not published"}</dd></div>
                </dl>
                <form action={setListingMediaPublication} className="seller-review-actions">
                  <input type="hidden" name="media_id" value={item.media_id} />
                  <label htmlFor={"publication-reason-" + item.media_id}>Publication decision reason (required)</label>
                  <textarea id={"publication-reason-" + item.media_id} name="reason" required minLength={5} maxLength={1000} rows={3} />
                  <button
                    className={item.publication_status === "published" ? "button button-outline-dark" : "button button-dark"}
                    name="decision"
                    value={item.publication_status === "published" ? "unpublished" : "published"}
                    type="submit"
                  >
                    {item.publication_status === "published" ? "Unpublish image" : "Approve for publication"}
                  </button>
                </form>
              </article>
            ))}
          </div>
        ) : (
          <section className="seller-empty">
            <h2>No approved images</h2>
            <p>There are no approved images awaiting a publication decision.</p>
          </section>
        )}
        <p className="seller-disclaimer">A published media decision is not a property verification or ownership guarantee. Public image delivery remains disabled until its separate secure delivery route is implemented, tested and deployed.</p>
      </div>
    </main>
  );
}
