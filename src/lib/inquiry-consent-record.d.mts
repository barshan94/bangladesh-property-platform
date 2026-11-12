export type InquiryConsentRecord = Readonly<{
  purpose: "public_service_inquiry";
  channel: "website";
  noticeVersion: string;
  acceptedAt: string;
}>;

export type InquiryConsentRecordResult =
  | { success: true; record: InquiryConsentRecord }
  | { success: false; error: string };

/**
 * Builds a minimal affirmative-consent record using a server-selected,
 * published notice version and a server-generated canonical UTC timestamp.
 * This does not persist the record or establish legal sufficiency of the notice.
 */
export function createInquiryConsentRecord(input: unknown): InquiryConsentRecordResult;
