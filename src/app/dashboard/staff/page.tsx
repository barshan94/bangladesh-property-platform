import Link from "next/link";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { requireActiveAdministrator } from "@/lib/supabase/require-active-administrator";
import { grantStaffRole, inviteStaffMember, revokeStaffRole } from "./actions";

export const dynamic = "force-dynamic";

const roleOptions = [
  ["seller", "Seller"],
  ["listing_reviewer", "Listing reviewer"],
  ["listing_publisher", "Listing publisher"],
  ["intake_coordinator", "Intake coordinator"],
  ["case_manager", "Case manager"],
  ["content_editor", "Content editor"],
  ["administrator", "Administrator"],
] as const;

type RoleRow = { user_id: string; role_code: string; revoked_at: string | null };

export default async function StaffManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; updated?: string; invited?: string }>;
}) {
  await requireActiveAdministrator();

  const params = await searchParams;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    return <main className="seller-workspace"><div className="container"><Link className="seller-back" href="/dashboard/admin">← Admin control panel</Link><h1>Staff management unavailable</h1><p className="seller-notice seller-error">The server-only Supabase secret is not configured. No staff information was loaded.</p></div></main>;
  }

  const admin = createSupabaseClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false } });
  const [{ data: userData, error: userError }, { data: roleData, error: roleError }] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 100 }),
    admin.from("user_roles").select("user_id,role_code,revoked_at"),
  ]);
  const roleRows = (roleData ?? []) as RoleRow[];
  const roleMap = new Map<string, string[]>();
  for (const row of roleRows) {
    if (row.revoked_at) continue;
    roleMap.set(row.user_id, [...(roleMap.get(row.user_id) ?? []), row.role_code]);
  }

  return (
    <main className="seller-workspace">
      <div className="container seller-form-container">
        <Link className="seller-back" href="/dashboard/admin">← Admin control panel</Link>
        <span className="eyebrow">STAFF AND ACCESS CONTROL</span>
        <h1>Manage staff accounts</h1>
        <p className="seller-intro">Invite a staff member by email, assign the role they need, or change access for an existing staff account. Every role change is checked and recorded by the protected staff-role service.</p>
        {params.invited ? <p className="seller-notice" role="status">Invitation sent and role assigned. The staff member must accept the invitation and sign in.</p> : null}
        {params.updated ? <p className="seller-notice" role="status">Staff role change completed.</p> : null}
        {params.error ? <p className="seller-notice seller-error" role="alert">{params.error}</p> : null}
        {userError || roleError ? <p className="seller-notice seller-error" role="alert">Staff accounts or roles could not be loaded. Check server credentials and the staff-role database setup.</p> : null}

        <section className="seller-form-card">
          <h2>Invite a staff member</h2>
          <form action={inviteStaffMember} className="seller-form">
            <label htmlFor="staff-email">Staff email address</label>
            <input id="staff-email" name="email" type="email" maxLength={254} required placeholder="staff@example.com" />
            <label htmlFor="staff-role">Role to assign</label>
            <select id="staff-role" name="role_code" defaultValue="seller" required>
              {roleOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <button className="button button-dark" type="submit">Send invitation and assign role</button>
            <small>The invitation is sent using the configured Supabase Auth email delivery. Do not invite someone unless the client has approved their access.</small>
          </form>
        </section>

        <h2 className="service-section-heading service-history-heading">Existing accounts (first 100)</h2>
        {userData?.users?.length ? <div className="seller-listing-grid">
          {userData.users.map((user) => {
            const assigned = roleMap.get(user.id) ?? [];
            return <article className="seller-listing-card" key={user.id}>
              <div className="seller-listing-top"><span className="seller-reference">{user.id.slice(0, 8).toUpperCase()}</span><span className="seller-status">{user.email_confirmed_at ? "Email confirmed" : "Invitation pending"}</span></div>
              <h2>{user.email ?? "Email unavailable"}</h2>
              <p className="seller-location">Created {new Intl.DateTimeFormat("en-BD", { dateStyle: "medium" }).format(new Date(user.created_at))}</p>
              <p><strong>Active roles:</strong> {assigned.length ? assigned.map((role) => role.replaceAll("_", " ")).join(", ") : "No active roles"}</p>
              <form action={grantStaffRole} className="seller-submit-form">
                <input type="hidden" name="user_id" value={user.id} />
                <label htmlFor={"grant-role-" + user.id}>Grant role</label>
                <select id={"grant-role-" + user.id} name="role_code" defaultValue="seller">
                  {roleOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <button className="button button-outline-dark" type="submit">Grant selected role</button>
              </form>
              <form action={revokeStaffRole} className="seller-submit-form">
                <input type="hidden" name="user_id" value={user.id} />
                <label htmlFor={"revoke-role-" + user.id}>Revoke role</label>
                <select id={"revoke-role-" + user.id} name="role_code" defaultValue={assigned[0] ?? "seller"}>
                  {roleOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <button className="button button-outline-dark" type="submit" disabled={!assigned.length}>Revoke selected role</button>
              </form>
            </article>;
          })}
        </div> : <section className="seller-empty"><h2>No accounts found</h2><p>New users will appear after an invitation or signup.</p></section>}
        <p className="seller-disclaimer">Security rules: do not share accounts; grant only the minimum role needed; use MFA for administrators; revoke access promptly when staff leave. The role service prevents removal of the last administrator. If the invitation email provider is not configured, the invitation will fail safely.</p>
      </div>
    </main>
  );
}
