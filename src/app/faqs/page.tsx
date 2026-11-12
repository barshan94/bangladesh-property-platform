import type { Metadata } from "next";
import { PageIntro, PageShell } from "@/components/page-shell";
const items = [
["Can I manage property in Bangladesh while living abroad?","Depending on service coverage, you may request local inspection or document coordination. Scope, authority, reporting and fees must be agreed before work begins."],
["Does a published listing mean its title is verified?","No. Listing moderation and legal title verification are separate. Any title review must identify the records checked, reviewer, date, scope and limitations."],
["Can a foreign national buy property in Bangladesh?","Eligibility depends on the person's legal status and the transaction. Obtain case-specific advice from qualified Bangladesh counsel before making commitments."],
["Can I submit documents from overseas?","A secure document-intake workflow is planned but is not live yet. Do not send sensitive identity or ownership records through this unfinished website."],
["Does submitting an inquiry guarantee that the platform will take my case?","No. Requests are subject to service availability, conflict checks where applicable, eligibility, professional capacity and agreed engagement terms."],
];
export const metadata: Metadata = { title: "FAQs", description: "Answers to common questions about Bangladesh property assistance." };
export default function FAQsPage() { return <PageShell><PageIntro eyebrow="HELP CENTRE" title="Frequently asked questions." description="General information to help you understand the platform. Individual property and legal matters require case-specific review." /><section className="section-pad"><div className="container faq-list standalone-faq">{items.map(([q,a])=><details key={q}><summary>{q}<span aria-hidden="true">+</span></summary><p>{a}</p></details>)}</div></section></PageShell>; }
