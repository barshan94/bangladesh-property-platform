import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { reviewListingMedia } from "./actions";

export const dynamic = "force-dynamic";

type MediaRecord = {
  media_id: string;
  listing_id: string;
  public_reference: string;
  headline: string;
  original_filename: string;
  size_bytes: number;
  sha256_hex: string;
  created_at: string;
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
    typeof row.sha256_hex === "string" &&
    typeof row.created_at === "string";
}

export default async function ListingMediaReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; updated?: string }>;
}) {
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getClaims();
  const claims = auth?.claims;
  const roles = (claims?.app_metadata as { roles?: unknown } | undefined)?.roles;
  const canReview = Array.isArray(roles) &&
    (roles.includes("listing_reviewer") || roles.includes("administrator"));
  if (authError || !claims?.sub || !canReview) {
    redirect("/dashboard?message=Listing%20media%20reviewer%20access%20is%20required.");
  }

  const params = await searchParams;
  const rpc = supabase as unknown as RpcClient;
  const { data, error } = await rpc.rpc("list_pending_listing_media_for_review");
  const records = Array.isArray(data) ? data.filter(isMediaRecord) : [];

  return (
    <main className="seller-workspace">
      <div className="container">
        <Link className="seller-back" href="/dashboard">← Account workspace</Link>
        <span className="eyebrow">MEDIA MODERATION</span>
        <h1>Pending property images</h1>
        <p className="seller-intro">Review canonicalized images submitted for editable property listings. Approval does not publish an image; public promotion remains a separate controlled step.</p>
        {params.error ? <p className="seller-notice seller-error" role="alert">{params.error}</p> : null}
        {params.updated ? <p className="seller-notice" role="status">The moderation decision was recorded.</p> : null}
        {error ? (
          <p className="seller-notice seller-error" role="alert">The review queue is unavailable. The required database migrations may not yet be installed. No moderation decision was made.</p>
        ) : records.length ? (
          <div className="seller-listing-grid">
            {records.map((item) => (
              <article className="seller-listing-card" key={item.media_id}>
                <div className="seller-listing-top">
                  <span className="seller-reference">{item.public_reference}</span>
                  <span className="seller-status seller-status-under_review">Pending review</span>
                </div>
                <h2>{item.headline}</h2>
                <p className="seller-location">{item.original_filename}</p>
                <Image
                  src={"/api/listing-media/" + item.media_id}
                  alt={"Private property image awaiting review for " + item.public_reference}
                  width={960}
                  height={720}
                  unoptimized
                  style={{ width: "100%", height: "auto", maxHeight: 420, objectFit: "contain", background: "#f3f3f3", borderRadius: 8 }}
                />
                <dl className="seller-facts">
                  <div><dt>Received</dt><dd>{new Intl.DateTimeFormat("en-BD", { dateStyle: "medium", timeZone: "Asia/Dhaka" }).format(new Date(item.created_at))}</dd></div>
                  <div><dt>Canonical size</dt><dd>{(item.size_bytes / 1024).toFixed(0)} KiB</dd></div>
                  <div><dt>Digest</dt><dd>{item.sha256_hex.slice(0, 16)}…</dd></div>
                </dl>
                <form action={reviewListingMedia} className="seller-review-actions">
                  <input type="hidden" name="media_id" value={item.media_id} />
                  <label htmlFor={"media-reason-" + item.media_id}>Review reason (required)</label>
                  <textarea id={"media-reason-" + item.media_id} name="reason" required minLength={5} maxLength={1000} rows={3} />
                  <div className="seller-review-buttons">
                    <button className="button button-dark" name="decision" value="approved" type="submit">Approve image</button>
                    <button className="button button-outline-dark" name="decision" value="rejected" type="submit">Reject image</button>
                  </div>
                </form>
              </article>
            ))}
          </div>
        ) : (
          <section className="seller-empty">
            <h2>No pending images</h2>
            <p>There are no property images awaiting moderation.</p>
          </section>
        )}
        <p className="seller-disclaimer">A moderation decision is an internal quality-control state, not proof of property ownership, image authenticity or property condition. Approved images are not public until a separate publisher-controlled promotion process exists.</p>
      </div>
    </main>
  );
}
