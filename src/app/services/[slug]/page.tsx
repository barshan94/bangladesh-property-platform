import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageIntro, PageShell } from "@/components/page-shell";
import { services } from "@/data/services";
import { createClient } from "@/lib/supabase/server";

export function generateStaticParams() { return services.map((service) => ({ slug: service.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = services.find((item) => item.slug === slug);
  return { title: service?.title ?? "Property service", description: service?.summary };
}

type ServiceContent = { long_description: string; youtube_url: string | null; facebook_url: string | null };
type ServiceContentReader = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{ data: ServiceContent | null }>;
      };
    };
  };
};

function youtubeEmbed(value: string): string | null {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (!["youtube.com", "www.youtube.com", "youtu.be"].includes(host)) return null;
    const id = host === "youtu.be" ? url.pathname.split("/").filter(Boolean)[0] :
      url.searchParams.get("v") ?? url.pathname.split("/").filter(Boolean).slice(-1)[0];
    return id && /^[A-Za-z0-9_-]{6,20}$/.test(id)
      ? "https://www.youtube-nocookie.com/embed/" + id
      : null;
  } catch { return null; }
}

function facebookEmbed(value: string): string | null {
  try {
    const url = new URL(value);
    if (!["facebook.com", "www.facebook.com", "fb.watch"].includes(url.hostname.toLowerCase())) return null;
    return "https://www.facebook.com/plugins/video.php?href=" + encodeURIComponent(url.toString()) + "&show_text=false";
  } catch { return null; }
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = services.find((item) => item.slug === slug);
  if (!service) notFound();

  const supabase = await createClient();
  const reader = supabase as unknown as ServiceContentReader;
  const { data: content } = await reader.from("service_pages").select("long_description,youtube_url,facebook_url")
    .eq("service_code", slug).maybeSingle();

  const paragraphs = content?.long_description.trim()
    ? content.long_description.split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean)
    : service.details;
  const youtube = content?.youtube_url ? youtubeEmbed(content.youtube_url) : null;
  const facebook = content?.facebook_url ? facebookEmbed(content.facebook_url) : null;

  return <PageShell>
    <PageIntro eyebrow={service.group.toUpperCase()} title={service.title} description={service.summary} />
    <section className="section-pad"><div className="container detail-layout">
      <div>
        <span className="eyebrow">SERVICE EXPLANATION</span>
        <h2>How we may help</h2>
        <div className="service-long-description">{paragraphs.map((item, index) => <p key={index}>{item}</p>)}</div>
        <span className="eyebrow">POSSIBLE PROCESS</span>
        <ol className="detail-list">{service.details.map((item) => <li key={item}>{item}</li>)}</ol>
        {(youtube || facebook) ? <section className="service-video-section" aria-label="Service videos">
          <span className="eyebrow">WATCH AND LEARN</span>
          <h2>Learn more about this service</h2>
          {youtube ? <div className="service-video"><iframe src={youtube} title={service.title + " — YouTube video"} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div> : null}
          {facebook ? <div className="service-video"><iframe src={facebook} title={service.title + " — Facebook video"} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowFullScreen /></div> : null}
        </section> : null}
        <div className="notice"><strong>Important limitation</strong><p>{service.note}</p></div>
        <a className="button button-dark" href={"/contact?service=" + encodeURIComponent(slug)}>Discuss this service ↗</a>
      </div>
      <aside className="detail-aside"><span className="eyebrow">BEFORE YOU PROCEED</span><h3>Start with the facts.</h3><p>Share a brief description without sending sensitive identity or ownership documents through an unsecured channel.</p><a className="text-link" href="/faqs">Read common questions →</a></aside>
    </div></section>
  </PageShell>;
}
