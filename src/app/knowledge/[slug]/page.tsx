import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { SafeMarkdown } from "@/components/safe-markdown";
import { getPublishedKnowledgeEntry } from "@/lib/knowledge-content";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { content } = await getPublishedKnowledgeEntry(slug);
  if (!content) return { title: "Guide not found" };
  return {
    title: content.title,
    description: content.summary,
    openGraph: { title: content.title, description: content.summary, type: "article" },
  };
}

export default async function KnowledgeEntryPage({ params }: Props) {
  const { slug } = await params;
  const { content, error } = await getPublishedKnowledgeEntry(slug);
  if (!content && !error) notFound();

  return (
    <PageShell>
      <section className="page-intro">
        <div className="container">
          <Link className="knowledge-back" href="/knowledge">← Knowledge Hub</Link>
          <span className="eyebrow">PUBLISHED {content?.content_type === "video" ? "VIDEO" : "PROPERTY GUIDE"}</span>
          <h1>{content?.title ?? "This guide is temporarily unavailable."}</h1>
          <p>{content?.summary ?? "Please return to the Knowledge Hub and try again later."}</p>
        </div>
      </section>
      <section className="section-pad">
        <div className="container knowledge-detail">
          {error ? <p className="seller-notice seller-error" role="status">The published guide could not be loaded. Please try again later.</p> : null}
          {content ? (
            <>
              <div className="knowledge-meta knowledge-detail-meta">
                <span>{content.jurisdiction}</span>
                {content.author_name ? <span>Contributor: {content.author_name}</span> : null}
                <time dateTime={content.published_at}>Published {new Intl.DateTimeFormat("en-BD", { dateStyle: "long", timeZone: "Asia/Dhaka" }).format(new Date(content.published_at))}</time>
              </div>
              {content.content_type === "article" && content.body_markdown ? (
                <SafeMarkdown source={content.body_markdown} />
              ) : content.content_type === "video" && content.video_provider && content.video_id ? (
                <div className="knowledge-video">
                  <iframe
                    src={content.video_provider === "youtube"
                      ? "https://www.youtube-nocookie.com/embed/" + content.video_id
                      : "https://player.vimeo.com/video/" + content.video_id}
                    title={content.title}
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                    sandbox="allow-scripts allow-same-origin allow-presentation"
                    allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                  />
                </div>
              ) : null}
              <aside className="notice knowledge-notice">
                <strong>Important information</strong>
                <p>This material is general educational information for the stated jurisdiction. It is not legal, tax, investment or title advice, and does not verify any property or transaction. Laws and procedures can change. Obtain current advice from a qualified professional before acting.</p>
              </aside>
            </>
          ) : null}
          <Link className="button button-outline-dark" href="/knowledge">Back to all guides</Link>
        </div>
      </section>
    </PageShell>
  );
}
