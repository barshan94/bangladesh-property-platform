import Link from "next/link";
import {redirect} from "next/navigation";
import {signOut} from "@/app/auth/actions";
import {createClient} from "@/lib/supabase/server";
export const dynamic="force-dynamic";
export default async function DashboardPage(){
 const supabase=await createClient(),{data,error}=await supabase.auth.getClaims(),claims=data?.claims,userId=claims?.sub;
 if(error||!claims||!userId)redirect("/login?message=Sign%20in%20to%20open%20your%20workspace.");
 const roles=(claims.app_metadata as {roles?:unknown}|undefined)?.roles;
 const isReviewer=Array.isArray(roles)&&roles.includes("listing_reviewer");
 const isPublisher=Array.isArray(roles)&&roles.includes("listing_publisher");
 const isServiceStaff=Array.isArray(roles)&&roles.some(role=>["intake_coordinator","case_manager","administrator"].includes(String(role)));
 const {data:profile}=await supabase.from("profiles").select("display_name,preferred_language").eq("id",userId).maybeSingle();
 return <main className="auth-shell"><section className="auth-card dashboard-card">
  <Link className="auth-brand" href="/">PROPERTY BD</Link><span className="eyebrow">YOUR WORKSPACE</span><h1>Welcome to your account.</h1>
  <p className="auth-description">Signed in as <strong>{String(claims.email??"verified user")}</strong>.</p>
  <div className="dashboard-summary"><div><span>Profile</span><strong>{profile?.display_name??"Not completed yet"}</strong></div><div><span>Preferred language</span><strong>{profile?.preferred_language??"English"}</strong></div><div><span>Account ID</span><strong>{userId}</strong></div></div>
  <p className="auth-description">Manage your account and the property drafts associated with it. Create and track your own service requests alongside your property drafts.</p>
  <Link className="button button-outline-dark seller-dashboard-link" href="/dashboard/listings">View my property listings</Link><Link className="button button-outline-dark seller-dashboard-link" href="/dashboard/service-requests">My service requests</Link>{isServiceStaff?<Link className="button button-outline-dark seller-dashboard-link" href="/dashboard/service-requests/manage">Manage service requests</Link>:null}{isPublisher?<Link className="button button-outline-dark seller-dashboard-link" href="/dashboard/publish">Open publisher queue</Link>:null}
  <form action={signOut}><button className="button button-dark" type="submit">Sign out</button></form><Link className="auth-back" href="/">← Back to website</Link>
 </section></main>;
}
