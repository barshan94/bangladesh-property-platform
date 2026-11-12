"use server";
import{redirect}from"next/navigation";
import{createClient}from"@/lib/supabase/server";
import{validateListingDraft}from"@/lib/listing-validation.mjs";
function fail(message:string):never{redirect("/dashboard/listings/new?error="+encodeURIComponent(message));}
export async function createListingDraft(formData:FormData){
 const supabase=await createClient();const{data,error:authError}=await supabase.auth.getClaims();const userId=data?.claims?.sub;
 if(authError||!userId)redirect("/login?message=Sign%20in%20to%20create%20a%20listing.");
 const raw={title:String(formData.get("title")??""),description:String(formData.get("description")??""),division:String(formData.get("division")??""),district:String(formData.get("district")??""),propertyType:String(formData.get("propertyType")??""),listingKind:String(formData.get("listingKind")??""),publicLocationLabel:String(formData.get("publicLocationLabel")??"").trim()||undefined,priceAmount:String(formData.get("priceAmount")??"").trim()?Number(formData.get("priceAmount")):undefined,upazila:String(formData.get("upazila")??"").trim()||undefined,locality:String(formData.get("locality")??"").trim()||undefined,areaValue:String(formData.get("areaValue")??"").trim()?Number(formData.get("areaValue")):undefined,areaUnit:String(formData.get("areaUnit")??"").trim()||undefined,areaBasis:String(formData.get("areaBasis")??"").trim()||undefined,bedrooms:String(formData.get("bedrooms")??"").trim()?Number(formData.get("bedrooms")):undefined,bathrooms:String(formData.get("bathrooms")??"").trim()?Number(formData.get("bathrooms")):undefined,images:[]};
 const checked=validateListingDraft(raw);if(!checked.success)fail("Some fields are invalid. Check the required fields and property measurements.");const d=checked.data;
 const{data:listing,error}=await supabase.from("property_listings").insert({public_reference:"BPP-000000",owner_user_id:userId,headline:d.title,description:d.description,division:d.division,district:d.district,upazila:d.upazila??null,locality:d.locality??null,public_location_label:d.publicLocationLabel??null,price_amount:d.priceAmount??null,currency_code:"BDT",listing_kind:d.listingKind,property_type:d.propertyType,area_value:d.areaValue??null,area_unit:d.areaUnit??null,area_basis:d.areaBasis??null,bedrooms:d.bedrooms??null,bathrooms:d.bathrooms??null,occupancy_status:"unknown",status:"draft"}).select("id,public_reference").single();
 if(error||!listing)fail("We could not save this draft. Please review the details and try again.");
 redirect("/dashboard/listings?created="+encodeURIComponent(listing.public_reference));
}
