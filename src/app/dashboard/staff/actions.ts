"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const rolesAllowed = new Set([
  "seller", "listing_reviewer", "listing_publisher", "intake_coordinator",
  "case_manager", "content_editor", "administrator",
]);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function getAdminContext() {
  const sessionClient = await createClient();
  const { data, error } = await sessionClient.auth.getClaims();
  const claims = data?.claims;
  const roles = (claims?.app_metadata as { roles?: unknown } | undefined)?.roles;
  if (error || typeof claims?.sub !== "string" || !Array.isArray(roles) || !roles.includes("administrator")) {
    redirect("/dashboard?message=Administrator%20access%20is%20required.");
  }
  const { data: sessionData } = await sessionClient.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!accessToken || !url || !secret) redirect("/dashboard/staff?error=Staff%20management%20is%20not%20configured.");
  return { actorId: claims.sub, accessToken, url, admin: createAdminClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false } }) };
}

async function changeRole(action: "grant" | "revoke", targetUserId: string, roleCode: string) {
  if (!uuidPattern.test(targetUserId) || !rolesAllowed.has(roleCode)) {
    redirect("/dashboard/staff?error=Choose%20a%20valid%20staff%20member%20and%20role.");
  }
  const context = await getAdminContext();
  const response = await fetch(context.url + "/functions/v1/manage-staff-role", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer " + context.accessToken },
    body: JSON.stringify({ action, targetUserId, roleCode }),
    cache: "no-store",
  });
  if (!response.ok) {
    redirect("/dashboard/staff?error=The%20role%20change%20was%20not%20accepted.%20Check%20the%20staff%20role%20function%20deployment%20and%20permissions.");
  }
  redirect("/dashboard/staff?updated=1");
}

export async function grantStaffRole(formData: FormData) {
  await changeRole("grant", String(formData.get("user_id") ?? ""), String(formData.get("role_code") ?? ""));
}

export async function revokeStaffRole(formData: FormData) {
  await changeRole("revoke", String(formData.get("user_id") ?? ""), String(formData.get("role_code") ?? ""));
}

export async function inviteStaffMember(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const roleCode = String(formData.get("role_code") ?? "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !rolesAllowed.has(roleCode)) {
    redirect("/dashboard/staff?error=Enter%20a%20valid%20email%20and%20choose%20a%20role.");
  }
  const context = await getAdminContext();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) redirect("/dashboard/staff?error=The%20website%20callback%20address%20is%20not%20configured.");
  let redirectTo: string;
  try { redirectTo = new URL("/auth/callback?next=%2Fdashboard", siteUrl).toString(); }
  catch { redirect("/dashboard/staff?error=The%20website%20callback%20address%20is%20invalid."); }

  const { data, error } = await context.admin.auth.admin.inviteUserByEmail(email, { redirectTo });
  const invitedUser = data.user;
  if (error || !invitedUser) {
    redirect("/dashboard/staff?error=The%20invitation%20could%20not%20be%20sent.%20Check%20email%20configuration%20or%20whether%20the%20account%20already%20exists.");
  }

  const response = await fetch(context.url + "/functions/v1/manage-staff-role", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer " + context.accessToken },
    body: JSON.stringify({ action: "grant", targetUserId: invitedUser.id, roleCode }),
    cache: "no-store",
  });
  if (!response.ok) {
    redirect("/dashboard/staff?error=The%20invitation%20was%20sent,%20but%20the%20role%20could%20not%20be%20assigned.%20Review%20the%20staff%20role%20function%20before%20inviting%20again.");
  }
  redirect("/dashboard/staff?invited=1");
}
