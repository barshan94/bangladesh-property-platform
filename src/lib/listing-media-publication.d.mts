export interface ListingMediaPublicationInput {
  actorId: unknown;
  ownerUserId: unknown;
  claimRoles: unknown;
  activeRoles: unknown;
  moderationStatus: unknown;
  publicationStatus: unknown;
  decision: unknown;
  reason: unknown;
}

export function canChangeListingMediaPublication(
  input: ListingMediaPublicationInput
): boolean;

export function canServeListingMediaPublicly(input: {
  moderationStatus: unknown;
  publicationStatus: unknown;
  listingStatus: unknown;
}): boolean;
