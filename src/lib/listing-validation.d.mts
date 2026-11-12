export type SellerListingDraft={title:string;description:string;division:string;district:string;propertyType:"apartment"|"house"|"land"|"commercial"|"industrial"|"other";listingKind:"sale"|"rent"|"lease";publicLocationLabel?:string;priceAmount?:number;images:Array<{src:string;alt:string}>;areaValue?:number;areaUnit?:"sqft"|"katha"|"decimal"|"acre"|"sqm";areaBasis?:"land"|"floor"|"built_up"|"carpet"|"gross";bedrooms?:number;bathrooms?:number;upazila?:string;locality?:string};
export type ListingDraftValidation={success:true;data:SellerListingDraft}|{success:false;errors:Record<string,string[]>};
/** Validates seller-editable fields against the property_listings database contract. */
export function validateListingDraft(input:unknown):ListingDraftValidation;
