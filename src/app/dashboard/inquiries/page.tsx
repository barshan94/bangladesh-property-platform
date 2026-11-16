import Link from "next/link";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { saveInquiryFollowUp } from "./actions";

export const dynamic = "force-dynamic";

type Inquiry = {
  id: string;
  contact_name: string;
  email_normalized: string;
  phone: string | null;
  country_of_residence: string | null;
  property_district: string | null;
  message: string;
  service_code: string | null;
  status: string;
  created_at: string;
  listing_id: string | null;
};
type StaffNote = { id: string; inquiry_id: string; note: string; created_at: string };

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

export default async function AdminInquiryInbox({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const sessionClient = await createClient();
  const { data: auth, error: authError } = await sessionClient.auth.getClaims();
  const claims = auth?.claims;
  const roles = (claims?.app_metadata as { roles?: unknown } | undefined)?.roles;
  if (authError || !claims?.sub || !Array.isArray(roles) || !roles.includes("administrator")) {
    redirect("/dashboard?message=Administrator%20access%20is%20required.");
  }

  const params = await searchParams;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  let inquiries: Inquiry[] = [];
  let notes: StaffNote[] = [];
  let loadError = !url || !secret ? "The secure inquiry-management service is not configured on the server." : "";
  if (url && secret) {
    const admin = createSupabaseClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data, error } = await admin.from("inquiries")
      .select("id,contact_name,email_normalized,phone,country_of_residence,property_district,message,service_code,status,created_at,listing_id")
      .order("created_at", { ascending: false }).limit(100);
    if (error) loadError = "The inquiry inbox could not be loaded. Confirm that the database migration and server secret are configured.";
    else inquiries = (data ?? []) as Inquiry[];
    if (inquiries.length) {
      const result = await admin.from("inquiry_staff_notes").select("id,inquiry_id,note,created_at")
        .in("inquiry_id", inquiries.map((item) => item.id)).order("created_at", { ascending: false }).limit(500);
      if (result.error) loadError = "Inquiries loaded, but follow-up notes are unavailable until the inquiry-notes migration is applied.";
      else notes = (result.data ?? []) as StaffNote[];
    }
  }

  return (
    <main className="seller-workspace">
      <div className="container seller-form-container">
        <Link className="seller-back" href="/dashboard/admin">← Admin control panel</Link>
        <span className="eyebrow">CUSTOMER COMMUNICATION</span>
        <h1>Website inquiries</h1>
        <p className="seller-intro">View messages submitted through the public website and record staff follow-up notes here. Use the email link to reply to a customer from your approved business email account.</p>
        {params.saved ? <p className="seller-notice" role="status">Follow-up note saved.</p> : null}
        {params.error ? <p className="seller-notice seller-error" role="alert">{params.error}</p> : null}
        {loadError ? <p className="seller-notice seller-error" role="alert">{loadError}</p> : null}
        {!loadError && inquiries.length === 0 ? <section className="seller-empty"><h2>No inquiries received yet</h2><p>New public website inquiries will appear here.</p></section> : null}
        <div className="seller-listing-grid">
          {inquiries.map((item) => {
            const history = notes.filter((note) => note.inquiry_id === item.id);
            const subject = "Re: Your property inquiry";
            return (
              <article className="seller-listing-card" key={item.id}>
                <div className="seller-listing-top">
                  <span className="seller-reference">INQUIRY {item.id.slice(0, 8).toUpperCase()}</span>
                  <span className={"seller-status seller-status-" + item.status}>{item.status.replaceAll("_", " ")}</span>
                </div>
                <h2>{item.contact_name}</h2>
                <dl className="seller-facts">
                  <div><dt>Email</dt><dd><a href={"mailto:" + encodeURIComponent(item.email_normalized) + "?subject=" + encodeURIComponent(subject)}>{item.email_normalized}</a></dd></div>
                  <div><dt>Phone</dt><dd>{item.phone ?? "Not provided"}</dd></div>
                  <div><dt>Country</dt><dd>{item.country_of_residence ?? "Not provided"}</dd></div>
                  <div><dt>Property district</dt><dd>{item.property_district ?? "Not provided"}</dd></div>
                  <div><dt>Service</dt><dd>{item.service_code ? serviceLabels[item.service_code] ?? item.service_code : "General inquiry"}</dd></div>
                  <div><dt>Received</dt><dd>{new Intl.DateTimeFormat("en-BD", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.created_at))}</dd></div>
                </dl>
                <p>{item.message}</p>
                <a className="button button-outline-dark" href={"mailto:" + encodeURIComponent(item.email_normalized) + "?subject=" + encodeURIComponent(subject)}>Reply using business email ↗</a>
                <form action={saveInquiryFollowUp} className="seller-submit-form">
                  <input type="hidden" name="inquiry_id" value={item.id} />
                  <label htmlFor={"follow-up-" + item.id}>Record follow-up / response note (internal only)</label>
                  <textarea id={"follow-up-" + item.id} name="note" rows={3} minLength={5} maxLength={4000} required placeholder="Record when and how the customer was contacted, or the next action required." />
                  <button className="button button-dark" type="submit">Save follow-up note</button>
                </form>
                {history.length ? <div className="service-history"><h3>Follow-up history</h3><ul>{history.map((note) => <li key={note.id}><strong>{new Intl.DateTimeFormat("en-BD", { dateStyle: "medium", timeStyle: "short" }).format(new Date(note.created_at))}</strong><span>{note.note}</span></li>)}</ul></div> : null}
              </article>
            );
          })}
        </div>
        <p className="seller-disclaimer">The email link opens the device's email application; it does not send a message automatically. This release records internal follow-up notes but does not yet provide in-website email delivery, customer reply threads or automatic notifications.</p>
      </div>
    </main>
  );
}
