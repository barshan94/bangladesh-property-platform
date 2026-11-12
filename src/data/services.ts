import { SERVICE_CODES, type ServiceCode } from "./service-codes.mjs";

type ServiceDefinition = {
  title: string;
  group: string;
  summary: string;
  details: readonly string[];
  note: string;
};

const serviceDetails: Record<ServiceCode, ServiceDefinition> = {
  "title-and-record-review": { title: "Title & record review", group: "Ownership and verification", summary: "Coordinate a scoped review of available ownership records and supporting documents.", details: ["Clarify the property location and available record references.", "Identify documents that may be relevant to a professional review.", "Coordinate review by an appropriately qualified local professional where available."], note: "A document review is not a guarantee of ownership, clear title or future legal outcome." },
  "buying-and-selling": { title: "Buying & selling assistance", group: "Transactions", summary: "Understand the process and coordinate practical steps around a property transaction.", details: ["Initial requirement and eligibility discussion.", "Document checklist and transaction coordination.", "Referral or coordination with relevant professionals, subject to availability."], note: "Do not pay a seller or sign transaction documents based only on information displayed on this website." },
  "transfer-and-mutation": { title: "Transfer & mutation support", group: "Transactions", summary: "Request help understanding property transfer and mutation procedures.", details: ["Review the nature of the requested transfer.", "Identify relevant records and procedural requirements.", "Coordinate next steps with the appropriate office or professional."], note: "Requirements vary by property and circumstances; no processing time or outcome is guaranteed." },
  "inheritance-and-succession": { title: "Inheritance & succession", group: "Ownership rights", summary: "Discuss inherited property, succession documentation and ownership questions.", details: ["Collect a high-level description of the family and property context.", "Identify the documents that may need professional review.", "Coordinate appropriate legal consultation."], note: "Inheritance rights depend on applicable personal law, facts and records. Obtain case-specific legal advice." },
  "partition-and-co-ownership": { title: "Partition & co-ownership", group: "Ownership rights", summary: "Explore options for jointly owned or undivided property.", details: ["Clarify the ownership structure and dispute status.", "Identify available records and co-owner information.", "Refer for legal and survey input where appropriate."], note: "This website does not determine ownership shares or resolve disputes automatically." },
  "property-disputes": { title: "Property disputes", group: "Disputes", summary: "Request an initial evaluation of a developer, landlord, tenant or other property dispute.", details: ["Summarize the dispute and relevant dates.", "Identify urgent deadlines that may require immediate counsel.", "Arrange review by qualified professionals where available."], note: "Submitting an inquiry does not create a lawyer-client relationship or suspend any legal deadline." },
  "remote-property-support": { title: "Remote property assistance", group: "Overseas owner support", summary: "Explore local inspection, document coordination and owner-support options.", details: ["Discuss property location and the task required.", "Confirm whether local coverage and an authorized representative are available.", "Agree scope, reporting format, fees and limitations before work starts."], note: "No physical inspection or property-management service is represented as available until confirmed in writing." },
  "property-tax-and-finance": { title: "Property tax & finance coordination", group: "Finance and compliance", summary: "Identify property-related tax, mortgage or banking questions for appropriate professional guidance.", details: ["Clarify the type of tax or finance question.", "Gather only the minimum information needed for initial routing.", "Coordinate with an appropriately qualified adviser where available."], note: "This is not a bank, tax authority or financial adviser. Advice and availability must be confirmed case by case." },
};

export const services = SERVICE_CODES.map((slug) => ({ slug, ...serviceDetails[slug] }));
