export type ServiceRequestInput = {
  name: string;
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
  summary: string;
  consent: true;
};
export type ServiceRequestValidation =
  | { success: true; data: ServiceRequestInput }
  | { success: false; errors: Record<string, string[]> };
/** Validates authenticated service intake; does not accept attachments or confidential evidence. */
export function validateServiceRequest(input: unknown): ServiceRequestValidation;
