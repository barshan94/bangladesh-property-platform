import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro, PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact the Bangladesh Property Platform about property services and inquiries.",
};

export default function ContactPage() {
  return (
    <PageShell>
      <PageIntro
        eyebrow="CONTACT THE TEAM"
        title="Start with a conversation."
        description="Tell us the general nature of your property requirement. We will confirm whether the relevant service is available and explain the next step."
      />
      <section className="section-pad">
        <div className="container detail-layout">
          <div>
            <span className="eyebrow">INQUIRY CHANNEL</span>
            <h2>We are preparing the secure contact workflow.</h2>
            <p>The platform does not yet have a verified public phone number, office address, WhatsApp account or live inquiry backend. Those details will be published only after the operating team confirms them.</p>
            <div className="notice">
              <strong>Protect your information</strong>
              <p>Do not send NID/passport copies, deeds, bank information, passwords or confidential case files through this unfinished website.</p>
            </div>
          </div>
          <aside className="detail-aside">
            <span className="eyebrow">NEXT STEP</span>
            <h3>Service inquiry</h3>
            <p>Browse the service catalogue to understand the possible scope before making contact.</p>
            <Link className="button button-dark" href="/services">Explore services ↗</Link>
          </aside>
        </div>
      </section>
    </PageShell>
  );
}
