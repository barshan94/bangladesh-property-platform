import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ServiceRequestForm } from "./service-request-form";

export const dynamic = "force-dynamic";
const labels: Record<string,string> = {
  "title-and-record-review":"Title and record review",
  "buying-and-selling":"Buying and selling support",
  "transfer-and-mutation":"Transfer and mutation",
  "inheritance-and-succession":"Inheritance and succession",
  "partition-and-co-ownership":"Partition and co-ownership",
  "property-disputes":"Property disputes",
  "remote-property-support":"Remote property support",
  "property-tax-and-finance":"Property tax and finance",
};

export default async function ServiceRequestsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getClaims();
  const claims = auth?.claims;
  const userId = claims?.sub;
  const email = typeof claims?.email === "string" ? claims.email : "";
  if (authError || typeof userId !== "string" || !userId || !email) redirect("/login?message=Sign%20in%20to%20manage%20service%20requests.");
  const params = await searchParams;
  const [{ data: profile }, { data: requests, error }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle(),
    supabase.from("service_requests").select("id,service_code,property_district,summary,status,created_at,updated_at").eq("requester_user_id", userId).order("created_at", { ascending: false }).limit(25),
  ]);
  return (
    <main className="seller-workspace">
      <div className="container seller-form-container">
        <Link className="seller-back" href="/dashboard">← Account workspace</Link>
        <span className="eyebrow">CLIENT WORKSPACE</span>
        <h1>My service requests</h1>
        <p className="seller-intro">Submit an authenticated request and track its current administrative status. A request is not confirmation that the service is available, a legal opinion or a client engagement.</p>
        {params.error ? <p className="seller-notice seller-error" role="alert">{params.error}</p> : null}
        <h2 className="service-section-heading">Create a request</h2>
        <ServiceRequestForm email={email} initialName={profile?.display_name ?? ""} />
        <h2 className="service-section-heading service-history-heading">Request history</h2>
        {error ? <p className="seller-notice seller-error" role="alert">Your request history could not be loaded. Refresh and try again.</p> :
          requests?.length ? <div className="seller-listing-grid">{requests.map(request => (
            <article className="seller-listing-card" key={request.id}>
              <div className="seller-listing-top"><span className="seller-reference">REQUEST {request.id.slice(0,8).toUpperCase()}</span><span className={"seller-status seller-status-" + request.status}>{request.status.replaceAll("_"," ")}</span></div>
              <h2>{labels[request.service_code] ?? request.service_code.replaceAll("_"," ")}</h2>
              {request.property_district ? <p className="seller-location">Property district: {request.property_district}</p> : null}
              <p>{request.summary}</p>
              <dl className="seller-facts"><div><dt>Submitted</dt><dd>{new Intl.DateTimeFormat("en-BD",{dateStyle:"medium",timeStyle:"short"}).format(new Date(request.created_at))}</dd></div><div><dt>Updated</dt><dd>{new Intl.DateTimeFormat("en-BD",{dateStyle:"medium",timeStyle:"short"}).format(new Date(request.updated_at))}</dd></div></dl>
            </article>
          ))}</div> : <section className="seller-empty"><h2>No service requests yet</h2><p>Your submitted requests will appear here. You can submit up to five within any 15-minute period.</p></section>}
        <p className="seller-disclaimer">Only your own requests are visible to your account. Authorized intake staff may access requests for handling. Documents are not accepted until a separate secure, scanned evidence workflow is available.</p>
      </div>
    </main>
  );
}
