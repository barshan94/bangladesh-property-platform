import Link from "next/link";
import {redirect} from "next/navigation";
import {updatePassword} from "@/app/auth/actions";
import {createClient} from "@/lib/supabase/server";
type Props={searchParams:Promise<{error?:string}>};
export default async function UpdatePasswordPage({searchParams}:Props){
 const p=await searchParams,supabase=await createClient(),{data}=await supabase.auth.getClaims();
 if(!data?.claims?.sub)redirect("/login?error=Your%20reset%20link%20is%20invalid%20or%20expired.");
 return <main className="auth-shell"><section className="auth-card">
  <Link className="auth-brand" href="/">PROPERTY BD</Link><span className="eyebrow">ACCOUNT RECOVERY</span><h1>Choose a new password.</h1>
  {p.error?<p className="auth-alert auth-error" role="alert">{p.error}</p>:null}
  <form action={updatePassword} className="auth-form"><label htmlFor="password">New password</label><input id="password" name="password" type="password" autoComplete="new-password" minLength={12} required/>
   <label htmlFor="password_confirmation">Confirm new password</label><input id="password_confirmation" name="password_confirmation" type="password" autoComplete="new-password" minLength={12} required/>
   <button className="button button-dark" type="submit">Update password</button></form>
 </section></main>;
}
