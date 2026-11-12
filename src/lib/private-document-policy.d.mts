export type PrivateDocumentPurpose = "listing_evidence" | "client_case";
export type PrivateDocumentScanStatus = "pending" | "clean" | "infected" | "error";
export type PrivateDocumentDecision =
  | { accepted: false; disposition: "rejected" | "quarantine"; reason: string }
  | { accepted: true; disposition: "private_storage"; reason: "POLICY_PASSED"; purpose: PrivateDocumentPurpose; detectedMimeType: "application/pdf" | "image/jpeg" | "image/png"; sizeBytes: number };
/** Uses server-detected MIME and scanner state; browser metadata is not trusted. */
export declare function evaluatePrivateDocument(input: {
  purpose: PrivateDocumentPurpose;
  detectedMimeType: string;
  sizeBytes: number;
  scanStatus: PrivateDocumentScanStatus;
}): PrivateDocumentDecision;
