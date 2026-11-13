import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro, PageShell } from "@/components/page-shell";
import { getPublishedKnowledgeContent } from "@/lib/knowledge-content";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Knowledge Hub",
  description: "Published Bangladesh property guides, educational articles and videos.",
};

export default async function KnowledgePage() {
  const { content, error } = await getPublishedKnowledgeContent();
  return (
    <PageShell>
      <PageIntro
        eyebrow="KNOWLEDGE HUB"
        title="Understand the process before you make a decision."
        description="Read published property guides and educational resources for Bangladesh. Each item is general information, not a substitute for advice on your specific circumstances."
      />
      <section className="section-pad">
        <div className="container">
          {error ? (
            <div className="property-empty" role="status">
              <div className="empty-icon" aria-hidden="true">!</div>
              <div><span className="eyebrow">TEMPORARILY UNAVAILABLE</span><h3>Published guides could not be loaded.</h3><p>Please try again later or contact the team. No unpublished editorial content is displayed.</p></div>
              <Link className="button button-dark" href="/faqs">Read FAQs</Link>
            </div>
          ) : content.length === 0 ? (
            <div className="property-empty">
              <div className="empty-icon" aria-hidden="true">✳</div>
              <div><span className="eyebrow">ARTICLES & GUIDES</span><h3>Our first guides are in preparation.</h3><p>We publish content only after editorial approval. Legal and property guidance will identify its jurisdiction, sources and review date.</p></div>
              <Link className="button button-dark" href="/faqs">Read FAQs</Link>
            </div>
          ) : (
            <div className="knowledge-grid">
              {content.map((item) => (
                <article className="knowledge-card" key={item.id}>
                  <span className="knowledge-type">{item.content_type === "video" ? "VIDEO RESOURCE" : "PROPERTY GUIDE"}</span>
                  <h2><Link href={"/knowledge/" + item.slug}>{item.title}</Link></h2>
                  <p>{item.summary}</p>
                  <div className="knowledge-meta"><span>{item.jurisdiction}</span><time dateTime={item.published_at}>{new Intl.DateTimeFormat("en-BD", { dateStyle: "medium", timeZone: "Asia/Dhaka" }).format(new Date(item.published_at))}</time></div>
                  <Link className="text-link" href={"/knowledge/" + item.slug}>{item.content_type === "video" ? "Watch resource" : "Read guide"} <span aria-hidden="true">→</span></Link>
                </article>
              ))}
            </div>
          )}
          <p className="catalogue-disclaimer">Publication is an editorial decision, not legal certification or verification of any property, person or transaction. Check current law and obtain qualified advice before acting.</p>
        </div>
      </section>
    </PageShell>
  );
}
