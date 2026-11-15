import type { Metadata } from "next";
import { PageIntro, PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Privacy Notice",
  description: "Preliminary privacy information for the Bangladesh Property Platform; final terms require client and legal review.",
};

export default function PrivacyPage() {
  return (
    <PageShell>
      <PageIntro
        eyebrow="PRIVACY"
        title="Your information deserves careful handling."
        description="This is a preliminary privacy summary, not a final legal privacy notice. The platform owner must identify the responsible legal entity, approve the purposes and retention rules, and obtain qualified Bangladesh legal/privacy review before live customer data is collected."
      />
      <section className="section-pad">
        <div className="container detail-layout">
          <div>
            <h2>What the application is designed to collect</h2>
            <p>The application source includes an initial inquiry form that can collect your name, email address, optional phone number, country of residence, property district, selected service and a short message. The form asks for consent so the team can respond to the inquiry. Do not include identity numbers, deeds, bank information, payment details, passwords or confidential case information.</p>
            <p>Authenticated account and service-request features are also implemented in the source. Depending on which features are enabled, an account may be associated with an email address, profile name, service category, property district, request summary and request-status history. Staff access is intended to be limited by role and, for case managers, assignment.</p>

            <h2>Property listings and public content</h2>
            <p>Public property pages are designed to show only published listing information and approved public property images. Seller drafts, private evidence, internal review notes and confidential case information are not intended for public display. Publication review does not certify legal title, seller authority or physical property condition.</p>

            <h2>Confidential documents</h2>
            <p>The source contains a private-document intake path that places files in private quarantine and records file metadata and a SHA-256 digest. However, no production malware scanner is deployed, and authorized document download, signed links, download auditing and safe quarantine cleanup are not implemented. This feature is not approved for real customer evidence. Do not submit deeds, NID/passport copies, bank records or other confidential documents through this website or by ordinary email.</p>

            <h2>Service providers and hosting</h2>
            <p>The application is built to use Supabase for authentication, database and private object storage, together with a separately selected hosting provider. The production hosting domain, provider configuration, data locations, subprocessors and cross-border processing arrangements have not been verified in this repository handoff. The platform owner must publish the actual provider and transfer details before launch.</p>

            <h2>Retention, deletion and your choices</h2>
            <p>A complete, approved retention schedule, deletion workflow, data-subject request process and privacy contact have not yet been supplied. The platform owner must define how long inquiry, account, case, audit and uploaded-file records are retained, who can access them, and how requests for access or deletion are handled. Do not rely on this preliminary page as confirmation that a particular deletion period or request channel is available.</p>

            <h2>Current deployment status</h2>
            <p>The repository contains working application code for inquiries, accounts and service requests, but this page does not verify that a production deployment is live or configured. The client/operator must confirm the actual production environment, approved notice wording, consent version and contact details before accepting live inquiries.</p>
          </div>
          <aside className="detail-aside">
            <h3>Before launch</h3>
            <ul className="detail-list">
              <li>Identify the legal entity responsible for processing and publish verified contact details.</li>
              <li>Approve purposes, lawful basis, notice text and consent wording.</li>
              <li>Document providers, data locations and cross-border transfers.</li>
              <li>Set retention, deletion, access-request and incident procedures.</li>
              <li>Complete qualified Bangladesh legal/privacy review.</li>
            </ul>
            <p><strong>Do not submit confidential files.</strong> Private evidence intake remains quarantine-only and is not cleared for customer use.</p>
          </aside>
        </div>
      </section>
    </PageShell>
  );
}
