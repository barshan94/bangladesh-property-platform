import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageIntro, PageShell } from "@/components/page-shell";
import { services } from "@/data/services";

export function generateStaticParams() { return services.map((service) => ({ slug: service.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = services.find((item) => item.slug === slug);
  return { title: service?.title ?? "Property service", description: service?.summary };
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = services.find((item) => item.slug === slug);
  if (!service) notFound();
  return <PageShell>
    <PageIntro eyebrow={service.group.toUpperCase()} title={service.title} description={service.summary} />
    <section className="section-pad"><div className="container detail-layout">
      <div><span className="eyebrow">POSSIBLE PROCESS</span><h2>What the process may involve</h2>
        <ol className="detail-list">{service.details.map((item) => <li key={item}>{item}</li>)}</ol>
        <div className="notice"><strong>Important limitation</strong><p>{service.note}</p></div>
        <a className="button button-dark" href="/contact">Ask about this service ↗</a>
      </div>
      <aside className="detail-aside"><span className="eyebrow">BEFORE YOU PROCEED</span><h3>Start with the facts.</h3><p>Share a brief description without sending sensitive identity or ownership documents through an unsecured channel.</p><a className="text-link" href="/faqs">Read common questions →</a></aside>
    </div></section>
  </PageShell>;
}
