import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  saveKnowledgeContentDraft,
  submitKnowledgeContentForReview,
  transitionKnowledgeContent,
} from "./actions";

export const dynamic = "force-dynamic";

type ContentRecord = {
  id: string; slug: string; content_type: "article" | "video"; title: string;
  summary: string; body_markdown: string | null; video_provider: string | null;
  video_id: string | null; jurisdiction: string; author_name: string | null;
  source_notes: string | null; status: string; author_user_id: string;
  reviewer_user_id: string | null; review_note: string | null;
  created_at: string; updated_at: string; published_at: string | null;
};

type RpcClient = { rpc: (name: string) => Promise<{ data: unknown; error: { message: string } | null }> };

export default async function KnowledgeContentWorkspace({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; error?: string; saved?: string; submitted?: string; updated?: string }>;
}) {
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getClaims();
  const claims = auth?.claims;
  const roles = (claims?.app_metadata as { roles?: unknown } | undefined)?.roles;
  const isAdmin = Array.isArray(roles) && roles.includes("administrator");
  const isEditor = Array.isArray(roles) && roles.includes("content_editor");
  if (authError || !claims?.sub || (!isAdmin && !isEditor)) {
    redirect("/dashboard?message=Content%20editor%20access%20is%20required.");
  }

  const params = await searchParams;
  const rpc = supabase as unknown as RpcClient;
  const { data, error } = await rpc.rpc("list_knowledge_content_for_editor");
  const records = Array.isArray(data) ? data as ContentRecord[] : [];
  const selected = params.edit ? records.find((item) => item.id === params.edit) : undefined;
  const canReview = isAdmin;

  return (
    <main className="seller-workspace">
      <div className="container seller-form-container">
        <Link className="seller-back" href="/dashboard">← Account workspace</Link>
        <span className="eyebrow">EDITORIAL WORKSPACE</span>
        <h1>Knowledge Hub CMS</h1>
        <p className="seller-intro">Prepare Bangladesh property education content. Drafts are private. Submission sends the content for a separate administrator review; nothing becomes public until approved and explicitly published.</p>
        {params.error ? <p className="seller-notice seller-error" role="alert">{params.error}</p> : null}
        {params.saved ? <p className="seller-notice" role="status">Draft saved privately.</p> : null}
        {params.submitted ? <p className="seller-notice" role="status">Draft submitted for editorial review.</p> : null}
        {params.updated ? <p className="seller-notice" role="status">Editorial status updated.</p> : null}
        {error ? (
          <p className="seller-notice seller-error" role="alert">The editorial workspace is not available. The required database migrations may not yet be installed. No content was changed.</p>
        ) : (
          <>
            <section className="seller-form-card">
              <h2>{selected ? "Edit content draft" : "Create content"}</h2>
              <form action={saveKnowledgeContentDraft} className="seller-form">
                {selected ? <input type="hidden" name="content_id" value={selected.id} /> : null}
                <label htmlFor="content-type">Content type</label>
                <select id="content-type" name="content_type" defaultValue={selected?.content_type ?? "article"}>
                  <option value="article">Article / guide</option>
                  <option value="video">Video</option>
                </select>
                <label htmlFor="content-slug">URL slug</label>
                <input id="content-slug" name="slug" required minLength={3} maxLength={160} pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={selected?.slug ?? ""} placeholder="buying-property-in-bangladesh" />
                <label htmlFor="content-title">Title</label>
                <input id="content-title" name="title" required minLength={8} maxLength={180} defaultValue={selected?.title ?? ""} />
                <label htmlFor="content-summary">Short summary</label>
                <textarea id="content-summary" name="summary" required minLength={20} maxLength={500} rows={3} defaultValue={selected?.summary ?? ""} />
                <label htmlFor="content-jurisdiction">Jurisdiction</label>
                <input id="content-jurisdiction" name="jurisdiction" required minLength={2} maxLength={100} defaultValue={selected?.jurisdiction ?? "Bangladesh"} />
                <label htmlFor="content-author">Author / contributor display name (do not invent credentials)</label>
                <input id="content-author" name="author_name" maxLength={120} defaultValue={selected?.author_name ?? ""} />
                <label htmlFor="content-sources">Internal source notes and citations (not public)</label>
                <textarea id="content-sources" name="source_notes" maxLength={4000} rows={4} defaultValue={selected?.source_notes ?? ""} />
                <label htmlFor="content-body">Article Markdown (100–30,000 characters; raw HTML is not supported for public rendering)</label>
                <textarea id="content-body" name="body_markdown" minLength={100} maxLength={30000} rows={14} defaultValue={selected?.body_markdown ?? ""} />
                <label htmlFor="video-provider">Video provider (for video entries)</label>
                <select id="video-provider" name="video_provider" defaultValue={selected?.video_provider ?? "youtube"}>
                  <option value="youtube">YouTube</option><option value="vimeo">Vimeo</option>
                </select>
                <label htmlFor="video-id">Video identifier (not a full URL)</label>
                <input id="video-id" name="video_id" minLength={6} maxLength={32} pattern="[A-Za-z0-9_-]{6,32}" defaultValue={selected?.video_id ?? ""} />
                <div className="seller-review-buttons">
                  <button className="button button-outline-dark" type="submit">Save private draft</button>
                  <button className="button button-dark" type="submit" formAction={submitKnowledgeContentForReview}>Save and submit for review</button>
                </div>
              </form>
              {selected ? <p><Link href="/dashboard/content">Close editor</Link></p> : null}
            </section>

            <h2 className="service-section-heading service-history-heading">Editorial records</h2>
            {records.length ? <div className="seller-listing-grid">{records.map((item) => (
              <article className="seller-listing-card" key={item.id}>
                <div className="seller-listing-top"><span className="seller-reference">{item.content_type.toUpperCase()}</span><span className={"seller-status seller-status-" + item.status}>{item.status.replaceAll("_", " ")}</span></div>
                <h2>{item.title}</h2><p className="seller-location">/{item.slug} · {item.jurisdiction}</p>
                <p>{item.summary}</p>
                <dl className="seller-facts"><div><dt>Updated</dt><dd>{new Intl.DateTimeFormat("en-BD", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.updated_at))}</dd></div><div><dt>Author</dt><dd>{item.author_name ?? "Not specified"}</dd></div></dl>
                {(item.status === "draft" || item.status === "rejected") && (item.author_user_id === claims.sub || isAdmin) ? <Link className="button button-outline-dark" href={"/dashboard/content?edit=" + item.id}>Edit draft</Link> : null}
                {item.status === "draft" && (item.author_user_id === claims.sub || isAdmin) ? (
                  <form action={submitKnowledgeContentForReview} className="seller-submit-form">
                    <input type="hidden" name="content_id" value={item.id} />
                    <input type="hidden" name="slug" value={item.slug} />
                    <input type="hidden" name="content_type" value={item.content_type} />
                    <input type="hidden" name="title" value={item.title} />
                    <input type="hidden" name="summary" value={item.summary} />
                    <input type="hidden" name="jurisdiction" value={item.jurisdiction} />
                    <input type="hidden" name="author_name" value={item.author_name ?? ""} />
                    <input type="hidden" name="source_notes" value={item.source_notes ?? ""} />
                    <input type="hidden" name="body_markdown" value={item.body_markdown ?? ""} />
                    <input type="hidden" name="video_provider" value={item.video_provider ?? ""} />
                    <input type="hidden" name="video_id" value={item.video_id ?? ""} />
                    <button className="button button-dark" type="submit">Submit for review</button>
                  </form>
                ) : null}
                {canReview && item.status === "in_review" ? (
                  <form action={transitionKnowledgeContent} className="seller-review-actions">
                    <input type="hidden" name="content_id" value={item.id} />
                    <label htmlFor={"review-reason-" + item.id}>Review reason (required)</label>
                    <textarea id={"review-reason-" + item.id} name="reason" required minLength={5} maxLength={1000} rows={3} />
                    <div className="seller-review-buttons">
                      <button className="button button-dark" name="to_status" value="approved" type="submit">Approve</button>
                      <button className="button button-outline-dark" name="to_status" value="rejected" type="submit">Reject</button>
                    </div>
                  </form>
                ) : null}
                {canReview && item.status === "approved" ? (
                  <form action={transitionKnowledgeContent} className="seller-submit-form">
                    <input type="hidden" name="content_id" value={item.id} />
                    <input type="hidden" name="to_status" value="published" />
                    <label htmlFor={"publish-reason-" + item.id}>Publication note</label>
                    <textarea id={"publish-reason-" + item.id} name="reason" required minLength={5} maxLength={1000} rows={2} />
                    <button className="button button-dark" type="submit">Publish</button>
                  </form>
                ) : null}
                {canReview && item.status === "published" ? (
                  <form action={transitionKnowledgeContent} className="seller-submit-form">
                    <input type="hidden" name="content_id" value={item.id} />
                    <input type="hidden" name="to_status" value="archived" />
                    <label htmlFor={"archive-reason-" + item.id}>Archive reason</label>
                    <textarea id={"archive-reason-" + item.id} name="reason" required minLength={5} maxLength={1000} rows={2} />
                    <button className="button button-outline-dark" type="submit">Archive</button>
                  </form>
                ) : null}
              </article>
            ))}</div> : <section className="seller-empty"><h2>No editorial records yet</h2><p>Create a draft above. It remains private until an administrator approves and publishes it.</p></section>}
          </>
        )}
        <p className="seller-disclaimer">Editorial approval is an internal content-quality decision, not legal certification. Verify sources, jurisdiction and current law before publication. No unreviewed content is publicly visible.</p>
      </div>
    </main>
  );
}
