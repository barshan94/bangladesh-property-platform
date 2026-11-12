import type { Metadata } from "next";
import { PageIntro, PageShell } from "@/components/page-shell";
export const metadata: Metadata = { title: "Properties", description: "Browse Bangladesh property listings as the moderated catalogue is prepared." };
export default function PropertiesPage() { return <PageShell>
  <PageIntro eyebrow="PROPERTY DISCOVERY" title="Explore property opportunities in Bangladesh." description="The public catalogue is being prepared. No listings are published until the submission and moderation process is in place." />
  <section className="section-pad"><div className="container property-empty"><div className="empty-icon" aria-hidden="true">⌂</div><div><span className="eyebrow">CATALOGUE IN PREPARATION</span><h3>There are no published listings yet.</h3><p>We will not display invented sample properties or imply a listing has a legally verified title.</p></div><a className="button button-dark" href="/contact">Discuss a property requirement</a></div></section>
</PageShell>; }
