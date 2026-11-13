import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { assignServiceRequestToMe, updateServiceRequest } from "./actions";

export const dynamic = "force-dynamic";

const serviceLabels: Record<string, string> = {
  "title-and-record-review": "Title and record review",
  "buying-and-selling": "Buying and selling support",
  "transfer-and-mutation": "Transfer and mutation",
  "inheritance-and-succession": "Inheritance and succession",
  "partition-and-co-ownership": "Partition and co-ownership",
  "property-disputes": "Property disputes",
  "remote-property-support": "Remote property support",
  "property-tax-and-finance": "Property tax and finance",
};
const transitions: Record<string, Record<string, string[]>> = {
  intake_coordinator: {
    new: ["triaged", "spam", "closed"],
    triaged: ["assigned", "waiting_on_client", "spam", "closed"],
    assigned: ["closed"],
    waiting_on_client: ["closed"],
  },
  case_manager: {
    assigned: ["in_progress", "waiting_on_client", "closed"],
    in_progress: ["waiting_on_client", "resolved"],
    waiting_on_client: ["in_progress", "resolved", "closed"],
    resolved: ["closed"],
  },
};

export default async function ServiceRequestManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string; error?: string }>;
}) {
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getClaims();
  const claims = auth?.claims;
  const roles = (claims?.app_metadata as { roles?: unknown } | undefined)?.roles;
  const staffRoles = ["intake_coordinator", "case_manager", "administrator"];
  if (authError || !claims?.sub || !Array.isArray(roles) || !roles.some(role => staffRoles.includes(String(role)))) {
    redirect("/dashboard?message=Authorized%20service%20staff%20access%20is%20required.");
  }

  const actorId = String(claims?.sub ?? "");
  const isIntakeOrAdmin = roles.includes("intake_coordinator") || roles.includes("administrator");
  const params = await searchParams;
  const { data: requests, error } = await supabase
    .from("service_requests")
    .select("id,service_code,contact_name,email_normalized,phone,country_of_residence,property_district,summary,status,assigned_to,created_at,updated_at")
    .order("created_at", { ascending: true })
    .limit(100);

  const ids = (requests ?? []).map(request => request.id);
  const { data: events } = ids.length
    ? await supabase.from("service_request_status_events")
        .select("id,service_request_id,from_status,to_status,assigned_to,actor_user_id,reason,created_at")
        .in("service_request_id", ids)
        .order("created_at", { ascending: false })
        .limit(300)
    : { data: [] };

  return (
    <main className="seller-workspace">
      <div className="container">
        <Link className="seller-back" href="/dashboard">← Account workspace</Link>
        <span className="eyebrow">AUTHORIZED STAFF WORKSPACE</span>
        <h1>Service request queue</h1>
        <p className="seller-intro">Handle incoming service requests, assign work to yourself and record status changes. Only operational details are shown here; clients must not be asked to send identity documents or confidential evidence through this form.</p>
        {params.updated ? <p className="seller-notice" role="status">The request update was recorded.</p> : null}
        {params.error ? <p className="seller-notice seller-error" role="alert">{params.error}</p> : null}
        {error ? <p className="seller-notice seller-error" role="alert">The staff queue could not be loaded. No request was changed.</p> :
          requests?.length ? (
            <div className="seller-listing-grid">
              {requests.map(request => {
                const allowed = [
                  ...(roles.includes("intake_coordinator") ? (transitions.intake_coordinator[request.status] ?? []) : []),
                  ...(roles.includes("case_manager") && request.assigned_to === actorId ? (transitions.case_manager[request.status] ?? []) : []),
                ];
                const choices = [...new Set([request.status, ...allowed])];
                const history = (events ?? []).filter(event => event.service_request_id === request.id).slice(0, 4);
                return (
                  <article className="seller-listing-card" key={request.id}>
                    <div className="seller-listing-top">
                      <span className="seller-reference">REQUEST {request.id.slice(0, 8).toUpperCase()}</span>
                      <span className={"seller-status seller-status-" + request.status}>{request.status.replaceAll("_", " ")}</span>
                    </div>
                    <h2>{serviceLabels[request.service_code] ?? request.service_code.replaceAll("_", " ")}</h2>
                    <dl className="seller-facts">
                      <div><dt>Client</dt><dd>{request.contact_name}</dd></div>
                      <div><dt>Account email</dt><dd>{request.email_normalized}</dd></div>
                      <div><dt>Phone</dt><dd>{request.phone ?? "Not provided"}</dd></div>
                      <div><dt>Country</dt><dd>{request.country_of_residence ?? "Not provided"}</dd></div>
                      <div><dt>Property district</dt><dd>{request.property_district ?? "Not provided"}</dd></div>
                      <div><dt>Assigned staff ID</dt><dd>{request.assigned_to ?? "Unassigned"}</dd></div>
                      <div><dt>Submitted</dt><dd>{new Intl.DateTimeFormat("en-BD", { dateStyle: "medium", timeStyle: "short" }).format(new Date(request.created_at))}</dd></div>
                    </dl>
                    <p>{request.summary}</p>
                    {isIntakeOrAdmin ? <form action={assignServiceRequestToMe} className="seller-submit-form">
                      <input type="hidden" name="request_id" value={request.id} />
                      <input type="hidden" name="reason" value="Assigned to current staff member" />
                      <button className="button button-outline-dark" type="submit">Assign to me</button>
                    </form> : null}
                    <form action={updateServiceRequest} className="seller-review-actions">
                      <input type="hidden" name="request_id" value={request.id} />
                      <label htmlFor={"status-" + request.id}>New status</label>
                      <select id={"status-" + request.id} name="status" defaultValue={request.status}>
                        {choices.map(status => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
                      </select>
                      <label htmlFor={"reason-" + request.id}>Reason for update (required)</label>
                      <textarea id={"reason-" + request.id} name="reason" rows={2} minLength={5} maxLength={1000} required placeholder="Record the operational reason for this change." />
                      <button className="button button-dark" type="submit" disabled={allowed.length === 0}>Save status</button>
                    </form>
                    {history.length ? (
                      <div className="service-history">
                        <h3>Recent history</h3>
                        <ul>{history.map(event => <li key={event.id}>
                          <strong>{event.from_status ? event.from_status.replaceAll("_", " ") + " → " : ""}{event.to_status.replaceAll("_", " ")}</strong>
                          <span>{event.reason}</span>
                          <small>{new Intl.DateTimeFormat("en-BD", { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.created_at))}</small>
                        </li>)}</ul>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : <section className="seller-empty"><h2>No service requests yet</h2><p>New authenticated client requests will appear here.</p></section>}
        <p className="seller-disclaimer">Staff assignment and status changes are audit-logged. The platform does not verify property title, ownership, legal eligibility or physical condition through this queue.</p>
      </div>
    </main>
  );
}
