"use server";
import { randomUUID } from "node:crypto";
import{redirect}from"next/navigation";
import{createClient}from"@/lib/supabase/server";
import{validateListingDraft}from"@/lib/listing-validation.mjs";
function fail(message:string):never{redirect("/dashboard/listings/new?error="+encodeURIComponent(message));}
export async function createListingDraft(formData:FormData){
 const supabase=await createClient();const{data,error:authError}=await supabase.auth.getClaims();const userId=data?.claims?.sub;
 if(authError||!userId)redirect("/login?message=Sign%20in%20to%20create%20a%20listing.");
 const latitudeRaw=String(formData.get("latitude")??"").trim();
 const longitudeRaw=String(formData.get("longitude")??"").trim();
 const hasLatitude=latitudeRaw.length>0,hasLongitude=longitudeRaw.length>0;
 const latitude=hasLatitude?Number(latitudeRaw):null;
 const longitude=hasLongitude?Number(longitudeRaw):null;
 if(hasLatitude!==hasLongitude)fail("Enter both map coordinates or leave both blank.");
 if(hasLatitude&&(latitude===null||longitude===null||!Number.isFinite(latitude)||!Number.isFinite(longitude)||latitude < -90||latitude > 90||longitude < -180||longitude > 180))fail("Map coordinates are invalid.");
 const raw={title:String(formData.get("title")??""),description:String(formData.get("description")??""),division:String(formData.get("division")??""),district:String(formData.get("district")??""),propertyType:String(formData.get("propertyType")??""),listingKind:String(formData.get("listingKind")??""),publicLocationLabel:String(formData.get("publicLocationLabel")??"").trim()||undefined,priceAmount:String(formData.get("priceAmount")??"").trim()?Number(formData.get("priceAmount")):undefined,upazila:String(formData.get("upazila")??"").trim()||undefined,locality:String(formData.get("locality")??"").trim()||undefined,areaValue:String(formData.get("areaValue")??"").trim()?Number(formData.get("areaValue")):undefined,areaUnit:String(formData.get("areaUnit")??"").trim()||undefined,areaBasis:String(formData.get("areaBasis")??"").trim()||undefined,bedrooms:String(formData.get("bedrooms")??"").trim()?Number(formData.get("bedrooms")):undefined,bathrooms:String(formData.get("bathrooms")??"").trim()?Number(formData.get("bathrooms")):undefined,images:[]};
 const checked=validateListingDraft(raw);if(!checked.success)fail("Some fields are invalid. Check the required fields and property measurements.");const d=checked.data;
 const{data:listing,error}=await supabase.from("property_listings").insert({public_reference:"BPP-000000",owner_user_id:userId,headline:d.title,description:d.description,division:d.division,district:d.district,upazila:d.upazila??null,locality:d.locality??null,public_location_label:d.publicLocationLabel??null,price_amount:d.priceAmount??null,currency_code:"BDT",listing_kind:d.listingKind,property_type:d.propertyType,area_value:d.areaValue??null,area_unit:d.areaUnit??null,area_basis:d.areaBasis??null,bedrooms:d.bedrooms??null,bathrooms:d.bathrooms??null,occupancy_status:"unknown",status:"draft"}).select("id,public_reference").single();
 if(error||!listing)fail("We could not save this draft. Please review the details and try again.");
 if(latitude!==null&&longitude!==null){
  const{error:locationError}=await supabase.from("listing_private_details").insert({listing_id:listing.id,owner_user_id:userId,latitude,longitude});
  if(locationError)fail("The draft was saved, but its private map coordinates could not be saved. Reopen the draft with an administrator before submitting it.");
 }
 redirect("/dashboard/listings?created="+encodeURIComponent(listing.public_reference));
}

export async function submitListing(formData: FormData) {
  const listingId = String(formData.get("listing_id") ?? "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(listingId)) {
    redirect("/dashboard/listings?error=Invalid%20listing%20reference.");
  }
  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getClaims();
  if (authError || !data?.claims?.sub) redirect("/login?message=Sign%20in%20to%20submit%20a%20listing.");
  const { error } = await supabase.rpc("transition_property_listing", {
    p_listing_id: listingId,
    p_to_status: "submitted",
    p_request_id: randomUUID(),
  });
  if (error) redirect("/dashboard/listings?error=This%20listing%20could%20not%20be%20submitted.%20Check%20its%20status%20and%20try%20again.");
  redirect("/dashboard/listings?submitted=1");
}


export async function updateListingDraft(formData: FormData) {
  const listingId = String(formData.get("listing_id") ?? "");
  const editUrl = "/dashboard/listings/" + encodeURIComponent(listingId) + "/edit";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(listingId)) {
    redirect("/dashboard/listings?error=Invalid%20listing%20reference.");
  }

  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (authError || typeof userId !== "string" || !userId) {
    redirect("/login?message=Sign%20in%20to%20edit%20your%20listing.");
  }

  const latitudeRaw = String(formData.get("latitude") ?? "").trim();
  const longitudeRaw = String(formData.get("longitude") ?? "").trim();
  const hasLatitude = latitudeRaw.length > 0;
  const hasLongitude = longitudeRaw.length > 0;
  const latitude = hasLatitude ? Number(latitudeRaw) : null;
  const longitude = hasLongitude ? Number(longitudeRaw) : null;
  if (hasLatitude !== hasLongitude) {
    redirect(editUrl + "?error=Enter%20both%20map%20coordinates%20or%20leave%20both%20blank.");
  }
  if (hasLatitude && (
    latitude === null || longitude === null ||
    !Number.isFinite(latitude) || !Number.isFinite(longitude) ||
    latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180
  )) {
    redirect(editUrl + "?error=Map%20coordinates%20are%20invalid.");
  }

  const raw = {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    division: String(formData.get("division") ?? ""),
    district: String(formData.get("district") ?? ""),
    propertyType: String(formData.get("propertyType") ?? ""),
    listingKind: String(formData.get("listingKind") ?? ""),
    publicLocationLabel: String(formData.get("publicLocationLabel") ?? "").trim() || undefined,
    priceAmount: String(formData.get("priceAmount") ?? "").trim() ? Number(formData.get("priceAmount")) : undefined,
    upazila: String(formData.get("upazila") ?? "").trim() || undefined,
    locality: String(formData.get("locality") ?? "").trim() || undefined,
    areaValue: String(formData.get("areaValue") ?? "").trim() ? Number(formData.get("areaValue")) : undefined,
    areaUnit: String(formData.get("areaUnit") ?? "").trim() || undefined,
    areaBasis: String(formData.get("areaBasis") ?? "").trim() || undefined,
    bedrooms: String(formData.get("bedrooms") ?? "").trim() ? Number(formData.get("bedrooms")) : undefined,
    bathrooms: String(formData.get("bathrooms") ?? "").trim() ? Number(formData.get("bathrooms")) : undefined,
    images: [],
  };
  const checked = validateListingDraft(raw);
  if (!checked.success) {
    redirect(editUrl + "?error=Some%20fields%20are%20invalid.%20Check%20the%20required%20fields%20and%20property%20measurements.");
  }
  const d = checked.data;

  const { data: updated, error } = await supabase
    .from("property_listings")
    .update({
      headline: d.title,
      description: d.description,
      division: d.division,
      district: d.district,
      upazila: d.upazila ?? null,
      locality: d.locality ?? null,
      public_location_label: d.publicLocationLabel ?? null,
      price_amount: d.priceAmount ?? null,
      listing_kind: d.listingKind,
      property_type: d.propertyType,
      area_value: d.areaValue ?? null,
      area_unit: d.areaUnit ?? null,
      area_basis: d.areaBasis ?? null,
      bedrooms: d.bedrooms ?? null,
      bathrooms: d.bathrooms ?? null,
    })
    .eq("id", listingId)
    .eq("owner_user_id", userId)
    .in("status", ["draft", "changes_requested"])
    .select("id")
    .maybeSingle();

  if (error || !updated) {
    redirect("/dashboard/listings?error=This%20listing%20cannot%20be%20edited.%20Only%20your%20drafts%20and%20listings%20returned%20for%20changes%20can%20be%20edited.");
  }

  if (latitude !== null && longitude !== null) {
    const { error: locationError } = await supabase
      .from("listing_private_details")
      .upsert(
        { listing_id: listingId, owner_user_id: userId, latitude, longitude },
        { onConflict: "listing_id" },
      );
    if (locationError) {
      redirect(editUrl + "?saved=1&warning=Listing%20details%20were%20saved%2C%20but%20map%20coordinates%20were%20not.%20Please%20retry%20the%20coordinates.");
    }
  }

  redirect("/dashboard/listings?updated=1");
}
