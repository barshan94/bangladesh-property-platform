import Link from "next/link";
import {signUp} from "@/app/auth/actions";
type Props={searchParams:Promise<{error?:string}>};
export default async function SignupPage({searchParams}:Props){
 const p=await searchParams;
 return <main className="auth-shell"><section className="auth-card">
  <Link className="auth-brand" href="/">PROPERTY BD</Link><span className="eyebrow">CREATE YOUR ACCOUNT</span><h1>Start with a secure account.</h1>
  <p className="auth-description">Create an account to manage your property enquiries. Staff permissions are assigned separately and cannot be self-selected.</p>
  {p.error?<p className="auth-alert auth-error" role="alert">{p.error}</p>:null}
  <form action={signUp} className="auth-form"><label htmlFor="email">Email address</label><input id="email" name="email" type="email" autoComplete="email" required/>
   <label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="new-password" minLength={12} required/>
   <small>Use at least 12 characters. Email confirmation is required before sign-in.</small><button className="button button-dark" type="submit">Create account</button></form>
  <div className="auth-links"><Link href="/login">Already have an account? Sign in</Link></div><Link className="auth-back" href="/">← Back to website</Link>
 </section></main>;
}
