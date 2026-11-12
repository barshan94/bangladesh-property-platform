import type { Metadata } from "next";
import { PageIntro, PageShell } from "@/components/page-shell";
export const metadata: Metadata = { title: "About Us", description: "Learn about the Bangladesh Property Platform's approach to property discovery and local assistance." };
export default function AboutPage() { return <PageShell>
  <PageIntro eyebrow="ABOUT THE PLATFORM" title="Local property matters deserve clear communication." description="We are building a Bangladesh-focused platform that brings property discovery and coordinated property assistance into one experience for people at home and overseas." />
  <section className="section-pad"><div className="container detail-layout"><div>
    <span className="eyebrow">OUR APPROACH</span><h2>Useful information. Defined responsibilities. No invented guarantees.</h2>
    <p>Property decisions can involve documents, local procedures, family interests, physical inspections and specialist advice. The platform is being designed to help people understand the next step and connect with appropriate local support.</p>
    <p>We will publish team credentials, service coverage, fees and professional relationships only when they are confirmed. We will not invent client stories, success rates or legal credentials to create an impression of trust.</p>
  </div><aside className="detail-aside"><span className="eyebrow">OUR PRINCIPLES</span><h3>Trust must be earned.</h3><ul><li>Transparent service scope</li><li>Confidential handling of client information</li><li>Separate listing moderation from legal verification</li><li>Qualified professional review where required</li><li>Clear communication for overseas clients</li></ul></aside></div></section>
</PageShell>; }
