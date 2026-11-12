import type { Metadata } from "next";
import { PageIntro, PageShell } from "@/components/page-shell";
import { services } from "@/data/services";

export const metadata: Metadata = { title: "Property Services", description: "Explore property assistance and request an initial evaluation in Bangladesh." };

export default function ServicesPage() {
  return <PageShell>
    <PageIntro eyebrow="PROPERTY SERVICES" title="A clearer path through property matters." description="Explore the types of support you may request. Each engagement is subject to eligibility, professional review, geographic coverage and agreed terms." />
    <section className="section-pad"><div className="container service-grid inner-service-grid">
      {services.map((service, index) => <article className="service-card" key={service.slug}>
        <span className="service-number">{String(index + 1).padStart(2, "0")} · {service.group}</span>
        <h2>{service.title}</h2><p>{service.summary}</p>
        <a href={`/services/${service.slug}`}>View service scope <span>↗</span></a>
      </article>)}
    </div></section>
  </PageShell>;
}
