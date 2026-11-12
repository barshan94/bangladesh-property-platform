"use server";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
function siteUrl(){const value=process.env.NEXT_PUBLIC_SITE_URL;if(!value)throw new Error("NEXT_PUBLIC_SITE_URL must be configured for auth email links.");return new URL(value).origin;}
function msg(value:string){return encodeURIComponent(value.slice(0,180));}
export async function signUp(formData:FormData){
 const email=String(formData.get("email")??"").trim().toLowerCase(),password=String(formData.get("password")??"");
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))redirect("/signup?error="+msg("Enter a valid email address."));
 if(password.length<12)redirect("/signup?error="+msg("Use a password with at least 12 characters."));
 const supabase=await createClient();
 const {error}=await supabase.auth.signUp({email,password,options:{emailRedirectTo:\`\${siteUrl()}/auth/callback?next=/dashboard\`}});
 if(error)redirect("/signup?error="+msg("We could not create the account. Check the details or try signing in."));
 redirect("/login?message="+msg("Check your email for the confirmation link before signing in."));
}
export async function signIn(formData:FormData){
 const email=String(formData.get("email")??"").trim().toLowerCase(),password=String(formData.get("password")??"");
 if(!email||!password)redirect("/login?error="+msg("Enter your email and password."));
 const supabase=await createClient();const {error}=await supabase.auth.signInWithPassword({email,password});
 if(error)redirect("/login?error="+msg("Sign-in failed. Check your details and email confirmation."));
 redirect("/dashboard");
}
export async function requestPasswordReset(formData:FormData){
 const email=String(formData.get("email")??"").trim().toLowerCase();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))redirect("/forgot-password?error="+msg("Enter a valid email address."));
 const supabase=await createClient();const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:\`\${siteUrl()}/auth/callback?next=/account/update-password\`});
 if(error)redirect("/forgot-password?error="+msg("We could not send a reset email. Please try again later."));
 redirect("/forgot-password?message="+msg("If an account exists for that email, a password reset link has been sent."));
}
export async function updatePassword(formData:FormData){
 const password=String(formData.get("password")??""),confirmation=String(formData.get("password_confirmation")??"");
 if(password.length<12)redirect("/account/update-password?error="+msg("Use a password with at least 12 characters."));
 if(password!==confirmation)redirect("/account/update-password?error="+msg("The passwords do not match."));
 const supabase=await createClient();const {data, error:claimsError}=await supabase.auth.getClaims();
 if(claimsError||!data.claims?.sub)redirect("/login?error="+msg("Your reset link is invalid or expired. Request a new one."));
 const {error}=await supabase.auth.updateUser({password});
 if(error)redirect("/account/update-password?error="+msg("Password update failed. Request a new reset link."));
 redirect("/login?message="+msg("Your password has been updated. Sign in with your new password."));
}
export async function signOut(){const supabase=await createClient();await supabase.auth.signOut();redirect("/login?message="+msg("You have been signed out."));}
