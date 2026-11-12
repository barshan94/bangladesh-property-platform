import Link from"next/link";
import{redirect}from"next/navigation";
import{createClient}from"@/lib/supabase/server";
import{createListingDraft}from"../actions";
export const dynamic="force-dynamic";
export default async function NewListingPage({searchParams}:{searchParams:Promise<{error?:string}>}){
 const supabase=await createClient();const{data,error}=await supabase.auth.getClaims();if(error||!data?.claims?.sub)redirect("/login?message=Sign%20in%20to%20create%20a%20listing.");const params=await searchParams;
 return <main className="seller-workspace"><div className="container seller-form-container"><Link className="seller-back" href="/dashboard/listings">← My property listings</Link><span className="eyebrow">NEW PROPERTY DRAFT</span><h1>Describe your property.</h1><p className="seller-intro">This saves a private draft to your account. It does not publish the property, verify ownership or start a legal review.</p>
 {params.error?<p className="seller-notice seller-error" role="alert">{params.error}</p>:null}
 <form action={createListingDraft} className="seller-form"><div className="seller-form-grid">
 <label className="seller-field seller-field-wide">Listing title<input name="title" required minLength={10} maxLength={180}/></label>
 <label className="seller-field seller-field-wide">Description<textarea name="description" required minLength={30} maxLength={12000} rows={6}/></label>
 <label className="seller-field">Listing type<select name="listingKind"><option value="sale">For sale</option><option value="rent">For rent</option><option value="lease">For lease</option></select></label>
 <label className="seller-field">Property type<select name="propertyType"><option value="apartment">Apartment</option><option value="house">House</option><option value="land">Land</option><option value="commercial">Commercial</option><option value="industrial">Industrial</option><option value="other">Other</option></select></label>
 <label className="seller-field">Division<input name="division" required minLength={2} maxLength={80}/></label><label className="seller-field">District<input name="district" required minLength={2} maxLength={80}/></label>
 <label className="seller-field">Upazila / Thana<input name="upazila" maxLength={80}/></label><label className="seller-field">Locality / Area<input name="locality" maxLength={160}/></label>
 <label className="seller-field seller-field-wide">Public location label<input name="publicLocationLabel" maxLength={180} placeholder="e.g. Dhanmondi, Dhaka"/></label>
 <label className="seller-field">Price in BDT (optional)<input name="priceAmount" type="number" min="0.01" max="99999999999999.99" step="0.01"/></label>
 <label className="seller-field">Bedrooms<input name="bedrooms" type="number" min="0" max="100" step="1"/></label><label className="seller-field">Bathrooms<input name="bathrooms" type="number" min="0" max="100" step="0.1"/></label>
 <label className="seller-field">Area value<input name="areaValue" type="number" min="0.001" step="0.001"/></label>
 <label className="seller-field">Area unit<select name="areaUnit"><option value="">Select unit</option><option value="sqft">Square feet</option><option value="sqm">Square metres</option><option value="katha">Katha</option><option value="decimal">Decimal</option><option value="acre">Acre</option></select></label>
 <label className="seller-field">Area basis<select name="areaBasis"><option value="">Select basis</option><option value="land">Land</option><option value="floor">Floor</option><option value="built_up">Built-up</option><option value="carpet">Carpet</option><option value="gross">Gross</option></select></label>
 </div><p className="seller-form-note">Area value, unit and basis must be completed together. Property images and private ownership documents are not accepted in this form.</p><button className="button button-dark" type="submit">Save private draft</button></form></div></main>;
}
