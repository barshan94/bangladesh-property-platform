export type ListingStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "changes_requested"
  | "approved"
  | "published"
  | "rejected"
  | "withdrawn"
  | "expired"
  | "archived";

export type ListingActorRole =
  | "seller"
  | "listing_reviewer"
  | "listing_publisher"
  | "administrator";

export const allowedListingTransitions: Readonly<
  Record<ListingStatus, readonly ListingStatus[]>
>;

export function isAllowedListingTransition(
  from: ListingStatus,
  to: ListingStatus
): boolean;

export function canRolePerformListingTransition(
  role: ListingActorRole,
  from: ListingStatus,
  to: ListingStatus
): boolean;

export function assertListingTransition(
  role: ListingActorRole,
  from: ListingStatus,
  to: ListingStatus
): void;
