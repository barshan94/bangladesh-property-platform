export const SERVICE_CODES: readonly [
  "title-and-record-review",
  "buying-and-selling",
  "transfer-and-mutation",
  "inheritance-and-succession",
  "partition-and-co-ownership",
  "property-disputes",
  "remote-property-support",
  "property-tax-and-finance"
];
export type ServiceCode = (typeof SERVICE_CODES)[number];
