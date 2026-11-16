import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const modules = [
  { title: "Staff accounts and roles", description: "Invite staff, assign access roles and revoke access when someone leaves.", href: "/dashboard/staff", action: "Manage staff" },\n  { title: "Property services", description: "Edit all service explanations and attach YouTube or Facebook videos.", href: "/dashboard/services", action: "Manage service pages" },
  { title: "Customer inquiries", description: "Read website inquiries, open a reply in the business email app and record follow-up notes.", href: "/dashboard/inquiries", action: "Open inquiry inbox" },
  { title: "Service requests", description: "Review incoming service requests, assign staff and update their workflow status.", href: "/dashboard/service-requests/manage", action: "Open service queue" },
  { title: "Property listing review", description: "Review seller-submitted property listings. Your account also needs the listing reviewer role.", href: "/dashboard/review", action: "Open listing review" },
  { title: "Knowledge Hub", description: "Create and review property articles and video content.", href: "/dashboard/content", action: "Manage articles and videos" },
  { title: "Property publication", description: "Review the approved-listing publication queue. Your account also needs the publisher role.", href: "/dashboard/publish", action: "Open publisher queue" },
  { title: "Property image review", description: "Review submitted listing photographs. Your account also needs the listing reviewer role.", href: "/dashboard/media-review", action: "Review property images" },
  { title: "Property image publication", description: "Publish or unpublish approved listing photographs. Your account also needs the publisher role.", href: "/dashboard/media-publication", action: "Manage published images" },
  { title: "My account and listings", description: "Return to your own account details and property drafts.", href: "/dashboard/listings", action: "View my listings" },
];

export default async function AdminHome() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const roles = (claims?.app_metadata as { roles?: unknown } | undefined)?.roles;
  if (error || !claims?.sub || !Array.isArray(roles) || !roles.includes("administrator")) {
    redirect("/dashboard?message=Administrator%20access%20is%20required.");
  }

  return (
    <main className="seller-workspace">
      <div className="container">
        <Link className="seller-back" href="/dashboard">← Account workspace</Link>
        <span className="eyebrow">ADMINISTRATOR CONTROL PANEL</span>
        <h1>Website management</h1>
        <p className="seller-intro">Manage the website from these pages. You do not need to edit source code or open the Supabase database for normal content and workflow tasks. Some modules require additional staff roles and completed database setup.</p>
        <div className="seller-listing-grid">
          {modules.map((module) => (
            <article className="seller-listing-card" key={module.href}>
              <h2>{module.title}</h2>
              <p>{module.description}</p>
              <Link className="button button-outline-dark" href={module.href}>{module.action} ↗</Link>
            </article>
          ))}
        </div>
        <p className="seller-disclaimer">Important: this panel links to the existing role-protected management workspaces; it does not grant permissions by itself. An administrator must provision the appropriate staff roles. The inquiry inbox records internal follow-up notes and opens replies in the business email app; automatic in-website email delivery and staff account provisioning are not included.</p>
      </div>
    </main>
  );
}
