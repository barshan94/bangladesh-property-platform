import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro, PageShell } from "@/components/page-shell";
import { InquiryForm } from "./inquiry-form";
import { SERVICE_CODES } from "@/data/service-codes.mjs";

export const metadata: Metadata = {
  title: "Contact",
  description: "Send a general property service inquiry to Bangladesh Property Platform.",
};

type ContactPageProps = {
  searchParams: Promise<{ requestType?: string; propertyReference?: string; service?: string }>;
};

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const params = await searchParams;
  const initialRequestType = params.requestType === "site_visit" ? "site_visit" : "general";
  const initialServiceCode = typeof params.service === "string" && (SERVICE_CODES as readonly string[]).includes(params.service) ? params.service : undefined;
  const propertyReference = typeof params.propertyReference === "string"
    && /^BPP-[A-Z0-9]{6,12}$/.test(params.propertyReference)
    ? params.propertyReference
    : undefined;
  return (
    <PageShell>
      <PageIntro eyebrow="CONTACT THE TEAM" title="Start with a conversation." description="Tell us the general nature of your property requirement. We will confirm whether the relevant service is available and explain the next step." />
      <section className="section-pad">
        <div className="container detail-layout">
          <div>
            <span className="eyebrow">SERVICE INQUIRY</span>
            <h2>Tell us what kind of support you need.</h2>
            <p>Use this form for an initial, non-confidential inquiry only. Submitting it does not create a client relationship, confirm service availability or provide legal advice.</p>
            <div className="notice">
              <strong>Protect your information</strong>
              <p>Do not include NID/passport numbers, deeds, bank information, passwords, payment details or confidential case files. Do not upload or send documents through this form.</p>
            </div>
            <p>There is currently no verified public phone number, office address or WhatsApp channel published for this platform. We will not display unverified contact details.</p>
          </div>
          <aside>
            <InquiryForm initialRequestType={initialRequestType} initialServiceCode={initialServiceCode} propertyReference={propertyReference} />
            <div className="small-note">Review the possible service scope before submitting an inquiry.</div>
            <Link className="text-link" href="/services">Explore services <span>↗</span></Link>
          </aside>
        </div>
      </section>
    </PageShell>
  );
}
