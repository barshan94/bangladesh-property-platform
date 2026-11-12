export type PublicInquiryInput = {
  name: string;
  email: string;
  phone?: string;
  country?: string;
  serviceCode:
    | "title-and-record-review"
    | "buying-and-selling"
    | "transfer-and-mutation"
    | "inheritance-and-succession"
    | "partition-and-co-ownership"
    | "property-disputes"
    | "remote-property-support"
    | "property-tax-and-finance";
  propertyDistrict?: string;
  message: string;
  consent: true;
};

export type InquiryValidation =
  | { success: true; data: PublicInquiryInput }
  | { success: false; errors: Record<string, string[]> };

/**
 * Validates a minimal public service inquiry. Never accepts attachments,
 * identity numbers, deed contents, payment data, or confidential case files.
 */
export function validateInquiry(input: unknown): InquiryValidation;
