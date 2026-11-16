import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { services } from "@/data/services";
import { saveServicePage } from "./actions";

export const dynamic = "force-dynamic";

type ServicePageRow = {
  service_code: string;
  long_description: string;
  youtube_url: string | null;
  facebook_url: string | null;
};
type ReadClient = {
  from: (table: string) => {
    select: (columns: string) => Promise<{ data: ServicePageRow[] | null; error: { message: string } | null }>;
  };
};

export default async function ServiceManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getClaims();
  const claims = auth?.claims;
  const roles = (claims?.app_metadata as { roles?: unknown } | undefined)?.roles;
  if (authError || !claims?.sub || !Array.isArray(roles) || !roles.includes("administrator")) {
    redirect("/dashboard?message=Administrator%20access%20is%20required.");
  }

  const params = await searchParams;
  const reader = supabase as unknown as ReadClient;
  const { data, error } = await reader.from("service_pages").select("service_code,long_description,youtube_url,facebook_url");
  const rows = new Map((data ?? []).map((row) => [row.service_code, row]));

  return (
    <main className="seller-workspace">
      <div className="container seller-form-container">
        <Link className="seller-back" href="/dashboard">← Admin control panel</Link>
        <span className="eyebrow">WEBSITE CONTENT MANAGEMENT</span>
        <h1>Manage property services</h1>
        <p className="seller-intro">Edit the detailed explanation for each service and add an optional YouTube video, Facebook video, or both. These changes appear on the public service detail page after saving.</p>
        {params.saved ? <p className="seller-notice" role="status">Service information saved.</p> : null}
        {params.error ? <p className="seller-notice seller-error" role="alert">{params.error}</p> : null}
        {error ? <p className="seller-notice seller-error" role="alert">Service content could not be loaded. Confirm that the service-page database migration has been applied before using this editor.</p> : null}

        <div className="seller-listing-grid">
          {services.map((service) => {
            const row = rows.get(service.slug);
            return (
              <section className="seller-form-card" key={service.slug}>
                <span className="eyebrow">{service.group}</span>
                <h2>{service.title}</h2>
                <p>{service.summary}</p>
                <form action={saveServicePage} className="seller-form">
                  <input type="hidden" name="service_code" value={service.slug} />
                  <label htmlFor={"service-details-" + service.slug}>Full service explanation</label>
                  <textarea id={"service-details-" + service.slug} name="long_description" rows={8} minLength={30} maxLength={12000} required defaultValue={row?.long_description || service.details.join("\n\n")} />
                  <label htmlFor={"service-youtube-" + service.slug}>YouTube video link (optional)</label>
                  <input id={"service-youtube-" + service.slug} name="youtube_url" type="url" maxLength={500} placeholder="https://www.youtube.com/watch?v=..." defaultValue={row?.youtube_url ?? ""} />
                  <label htmlFor={"service-facebook-" + service.slug}>Facebook video link (optional)</label>
                  <input id={"service-facebook-" + service.slug} name="facebook_url" type="url" maxLength={500} placeholder="https://www.facebook.com/.../videos/..." defaultValue={row?.facebook_url ?? ""} />
                  <button className="button button-dark" type="submit">Save {service.title}</button>
                  <small>Use public HTTPS video links that your visitors are allowed to view. Never paste private or restricted video URLs.</small>
                </form>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
