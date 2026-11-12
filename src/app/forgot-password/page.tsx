import Link from "next/link";
import {requestPasswordReset} from "@/app/auth/actions";
type Props={searchParams:Promise<{error?:string;message?:string}>};
export default async function ForgotPasswordPage({searchParams}:Props){
 const p=await searchParams;
 return <main className="auth-shell"><section className="auth-card">
  <Link className="auth-brand" href="/">PROPERTY BD</Link><span className="eyebrow">ACCOUNT RECOVERY</span><h1>Reset your password.</h1>
  <p className="auth-description">Enter your account email. If it exists, Supabase will send a secure reset link.</p>
  {p.error?<p className="auth-alert auth-error" role="alert">{p.error}</p>:null}{p.message?<p className="auth-alert auth-success" role="status">{p.message}</p>:null}
  <form action={requestPasswordReset} className="auth-form"><label htmlFor="email">Email address</label><input id="email" name="email" type="email" autoComplete="email" required/><button className="button button-dark" type="submit">Send reset link</button></form>
  <div className="auth-links"><Link href="/login">Return to sign in</Link></div>
 </section></main>;
}
