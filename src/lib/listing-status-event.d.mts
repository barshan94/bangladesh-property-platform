import type { ListingActorRole, ListingStatus } from "./listing-lifecycle.mjs";
export type ListingStatusEventInput = Readonly<{
  listingId:string; actorId:string; actorRole:ListingActorRole;
  fromStatus:ListingStatus; toStatus:ListingStatus; reason?:string;
  occurredAt:string; requestId:string;
}>;
export type ListingStatusEvent = Readonly<{
  eventType:"listing.status_changed"; listingId:string; actorId:string;
  actorRole:ListingActorRole; fromStatus:ListingStatus; toStatus:ListingStatus;
  reason:string|null; occurredAt:string; requestId:string;
}>;
export function createListingStatusEvent(input:ListingStatusEventInput):ListingStatusEvent;
