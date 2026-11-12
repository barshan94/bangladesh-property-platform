import Link from "next/link";
import {signIn} from "@/app/auth/actions";
type Props={searchParams:Promise<{error?:string;message?:string}>};
export default async function LoginPage({searchParams}:Props){
 const p=await searchParams;
 return <main className="auth-shell"><section className="auth-card">
  <Link className="auth-brand" href="/">PROPERTY BD</Link><span className="eyebrow">WELCOME BACK</span><h1>Sign in to your account.</h1>
  <p className="auth-description">Access your property enquiries and account workspace.</p>
  {p.error?<p className="auth-alert auth-error" role="alert">{p.error}</p>:null}
  {p.message?<p className="auth-alert auth-success" role="status">{p.message}</p>:null}
  <form action={signIn} className="auth-form"><label htmlFor="email">Email address</label><input id="email" name="email" type="email" autoComplete="email" required/>
   <label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="current-password" required/>
   <button className="button button-dark" type="submit">Sign in</button></form>
  <div className="auth-links"><Link href="/forgot-password">Forgot password?</Link><Link href="/signup">Create an account</Link></div>
  <Link className="auth-back" href="/">← Back to website</Link>
 </section></main>;
}
