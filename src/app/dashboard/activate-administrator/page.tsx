import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { activateFirstAdministrator } from "./actions";

export const dynamic = "force-dynamic";

export default async function ActivateAdministratorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (authError || !claims?.sub) redirect("/login?message=Sign%20in%20to%20continue.");

  const roles = (claims.app_metadata as { roles?: unknown } | undefined)?.roles;
  if (Array.isArray(roles) && roles.includes("administrator")) redirect("/dashboard/admin");

  const params = await searchParams;
  return (
    <main className="seller-workspace">
      <div className="container seller-form-container">
        <Link className="seller-back" href="/dashboard">← Account workspace</Link>
        <span className="eyebrow">ONE-TIME ACCOUNT SETUP</span>
        <h1>Activate the first administrator</h1>
        <p className="seller-intro">This secure setup request can only succeed for the specific account pre-authorized in the server-side Supabase bootstrap secret, and only while no active administrator exists. Signing in by itself does not grant administrator access.</p>
        {params.error ? <p className="seller-notice seller-error" role="alert">{params.error}</p> : null}
        <section className="seller-form-card">
          <h2>Confirm administrator activation</h2>
          <p>The request will ask the protected staff-role service to grant the administrator role to the account currently signed in. The service independently verifies the account ID and one-time bootstrap secret.</p>
          <form action={activateFirstAdministrator} className="seller-form">
            <button className="button button-dark" type="submit">Activate this account as administrator</button>
          </form>
        </section>
        <p className="seller-disclaimer">If this account is not the pre-authorized first administrator, the request will be rejected without changing its permissions. Do not share your login credentials.</p>
      </div>
    </main>
  );
}
