import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { requireActiveAdministrator } from "@/lib/supabase/require-active-administrator";

export const dynamic = "force-dynamic";

const modules = [
  { title: "All property records", description: "Search and inspect property listings across all sellers and see their current workflow status.", href: "/dashboard/admin/properties", action: "Manage property records" },
  { title: "Staff accounts and roles", description: "Invite staff, assign access roles and revoke access when someone leaves.", href: "/dashboard/staff", action: "Manage staff" },
  { title: "Property services", description: "Edit all service explanations and attach YouTube or Facebook videos.", href: "/dashboard/services", action: "Manage service pages" },
  { title: "Customer inquiries", description: "Read website inquiries, open a reply in the business email app and record private follow-up notes.", href: "/dashboard/inquiries", action: "Open inquiry inbox" },
  { title: "Service requests", description: "Review incoming service requests, assign staff and update their workflow status.", href: "/dashboard/service-requests/manage", action: "Open service queue" },
  { title: "Property listing review", description: "Review seller-submitted property listings. Your account also needs the listing reviewer role.", href: "/dashboard/review", action: "Open listing review" },
  { title: "Knowledge Hub", description: "Create and review property articles and video content.", href: "/dashboard/content", action: "Manage articles and videos" },
  { title: "Property publication", description: "Review the approved-listing publication queue. Your account also needs the publisher role.", href: "/dashboard/publish", action: "Open publisher queue" },
  { title: "Property image review", description: "Review submitted listing photographs. Your account also needs the listing reviewer role.", href: "/dashboard/media-review", action: "Review property images" },
  { title: "Property image publication", description: "Publish or unpublish approved listing photographs. Your account also needs the publisher role.", href: "/dashboard/media-publication", action: "Manage published images" },
  { title: "My account and listings", description: "Return to your own account details and property drafts.", href: "/dashboard/listings", action: "View my listings" },
];

async function getWorkCounts() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) return null;
  const admin = createSupabaseClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false } });
  const [listings, inquiries, requests] = await Promise.all([
    admin.from("property_listings").select("id", { count: "exact", head: true }).in("status", ["submitted", "under_review"]),
    admin.from("inquiries").select("id", { count: "exact", head: true }).in("status", ["new", "triaged"]),
    admin.from("service_requests").select("id", { count: "exact", head: true }).in("status", ["new", "triaged"]),
  ]);
  if (listings.error || inquiries.error || requests.error) return null;
  return {
    listings: listings.count ?? 0,
    inquiries: inquiries.count ?? 0,
    requests: requests.count ?? 0,
  };
}

export default async function AdminHome() {
  await requireActiveAdministrator();
  const counts = await getWorkCounts();

  return (
    <main className="seller-workspace">
      <div className="container">
        <Link className="seller-back" href="/dashboard">← Account workspace</Link>
        <span className="eyebrow">ADMINISTRATOR CONTROL PANEL</span>
        <h1>Website management</h1>
        <p className="seller-intro">Manage the website from these pages. You do not need to edit source code or open the Supabase database for normal content and workflow tasks. Some modules require additional staff roles and completed database setup.</p>
        <section aria-labelledby="admin-work-queue-heading">
          <h2 id="admin-work-queue-heading">Work needing attention</h2>
          {counts ? (
            <div className="seller-listing-grid">
              <article className="seller-listing-card"><h3>Property reviews</h3><p className="seller-price">{counts.listings}</p><p>Submitted or under-review listings</p><Link className="button button-outline-dark" href="/dashboard/review">Open review queue</Link></article>
              <article className="seller-listing-card"><h3>Customer inquiries</h3><p className="seller-price">{counts.inquiries}</p><p>New or triaged website inquiries</p><Link className="button button-outline-dark" href="/dashboard/inquiries">Open inquiry inbox</Link></article>
              <article className="seller-listing-card"><h3>Service requests</h3><p className="seller-price">{counts.requests}</p><p>New or triaged customer requests</p><Link className="button button-outline-dark" href="/dashboard/service-requests/manage">Open service queue</Link></article>
            </div>
          ) : (
            <p className="seller-notice">Live work counts are unavailable. Configure the server-only database connection and apply the required migrations to enable this overview. The management pages remain available below.</p>
          )}
        </section>
        <h2>Management workspaces</h2>
        <div className="seller-listing-grid">
          {modules.map((module) => (
            <article className="seller-listing-card" key={module.href}>
              <h3>{module.title}</h3>
              <p>{module.description}</p>
              <Link className="button button-outline-dark" href={module.href}>{module.action} ↗</Link>
            </article>
          ))}
        </div>
        <p className="seller-disclaimer">Important: this panel links to the existing role-protected management workspaces; it does not grant permissions by itself. An administrator must provision the appropriate staff roles. The inquiry inbox records internal follow-up notes and opens replies in the business email app; automatic in-website email delivery is not included. The first administrator still requires one-time operator bootstrap.</p>
      </div>
    </main>
  );
}
