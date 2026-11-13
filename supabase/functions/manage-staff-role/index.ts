import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.119.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const BOOTSTRAP_ADMIN_ID = Deno.env.get("STAFF_BOOTSTRAP_ADMIN_USER_ID") ?? "";
const ROLE_CODES = new Set([
  "seller", "listing_reviewer", "listing_publisher", "intake_coordinator",
  "case_manager", "content_editor", "administrator",
]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const headers = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const response = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers });

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") return response(405, { error: "METHOD_NOT_ALLOWED" });
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return response(503, { error: "STAFF_MANAGEMENT_NOT_CONFIGURED" });

  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return response(401, { error: "AUTHENTICATION_REQUIRED" });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: actorData, error: actorError } = await admin.auth.getUser(token);
  const actor = actorData.user;
  if (actorError || !actor) return response(401, { error: "INVALID_SESSION" });

  let input: unknown;
  try { input = await request.json(); } catch { return response(400, { error: "INVALID_JSON" }); }
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return response(400, { error: "EXPECTED_OBJECT" });
  }
  const body = input as Record<string, unknown>;
  if (Object.keys(body).some((key) => !["action", "targetUserId", "roleCode"].includes(key))) {
    return response(400, { error: "UNKNOWN_FIELD" });
  }
  const action = body.action;
  const targetUserId = body.targetUserId;
  const roleCode = body.roleCode;
  if ((action !== "grant" && action !== "revoke") ||
      typeof targetUserId !== "string" || !UUID.test(targetUserId) ||
      typeof roleCode !== "string" || !ROLE_CODES.has(roleCode)) {
    return response(400, { error: "INVALID_ROLE_OPERATION" });
  }

  const { data: actorAdminRole, error: actorRoleError } = await admin
    .from("user_roles").select("id").eq("user_id", actor.id)
    .eq("role_code", "administrator").is("revoked_at", null).maybeSingle();
  if (actorRoleError) return response(503, { error: "ROLE_AUTHORIZATION_UNAVAILABLE" });

  const isActiveAdministrator =
    actorAdminRole !== null &&
    Array.isArray(actor.app_metadata?.roles) &&
    actor.app_metadata.roles.includes("administrator");

  const isBootstrapAttempt =
    !isActiveAdministrator &&
    BOOTSTRAP_ADMIN_ID.length > 0 &&
    actor.id === BOOTSTRAP_ADMIN_ID &&
    action === "grant" &&
    roleCode === "administrator" &&
    targetUserId === actor.id;

  if (!isActiveAdministrator && !isBootstrapAttempt) {
    return response(403, { error: "ADMINISTRATOR_ACCESS_REQUIRED" });
  }

  if (isBootstrapAttempt) {
    const { data: existingAdmins, error } = await admin.from("user_roles")
      .select("id").eq("role_code", "administrator").is("revoked_at", null).limit(1);
    if (error) return response(503, { error: "BOOTSTRAP_CHECK_FAILED" });
    if (existingAdmins && existingAdmins.length > 0) {
      return response(409, { error: "BOOTSTRAP_ALREADY_CLAIMED" });
    }
  }

  const { data: targetData, error: targetError } = await admin.auth.admin.getUserById(targetUserId);
  const target = targetData.user;
  if (targetError || !target) return response(404, { error: "TARGET_USER_NOT_FOUND" });

  const { data: activeRows, error: rowsError } = await admin.from("user_roles")
    .select("id, role_code").eq("user_id", targetUserId).is("revoked_at", null);
  if (rowsError) return response(503, { error: "ROLE_RECORDS_UNAVAILABLE" });
  const currentRoles = new Set((activeRows ?? []).map((row) => row.role_code));
  const hasRole = currentRoles.has(roleCode);

  if ((action === "grant" && hasRole) || (action === "revoke" && !hasRole)) {
    return response(200, { ok: true, action, roleCode, targetUserId, unchanged: true });
  }
  if (action === "revoke" && roleCode === "administrator") {
    const { data: admins, error } = await admin.from("user_roles")
      .select("user_id").eq("role_code", "administrator").is("revoked_at", null);
    if (error) return response(503, { error: "ADMINISTRATOR_COUNT_UNAVAILABLE" });
    if ((admins ?? []).length <= 1) {
      return response(409, { error: "CANNOT_REVOKE_LAST_ADMINISTRATOR" });
    }
  }

  const nextRoles = new Set(currentRoles);
  if (action === "grant") nextRoles.add(roleCode);
  else nextRoles.delete(roleCode);
  const previousMetadata = target.app_metadata ?? {};
  const previousRoles = Array.isArray(previousMetadata.roles) ? previousMetadata.roles : [];
  const nextMetadata = { ...previousMetadata, roles: [...nextRoles].sort() };

  const { error: authUpdateError } = await admin.auth.admin.updateUserById(targetUserId, {
    app_metadata: nextMetadata,
  });
  if (authUpdateError) return response(502, { error: "AUTH_METADATA_UPDATE_FAILED" });

  const now = new Date().toISOString();
  const databaseChange = action === "grant"
    ? await admin.from("user_roles").insert({
        user_id: targetUserId, role_code: roleCode, granted_by: actor.id,
      })
    : await admin.from("user_roles").update({ revoked_at: now })
        .eq("user_id", targetUserId).eq("role_code", roleCode).is("revoked_at", null);

  if (databaseChange.error) {
    await admin.auth.admin.updateUserById(targetUserId, { app_metadata: { ...previousMetadata, roles: previousRoles } });
    return response(502, { error: "ROLE_RECORD_UPDATE_FAILED", rollbackAttempted: true });
  }

  const { error: auditError } = await admin.from("audit_events").insert({
    actor_user_id: actor.id,
    action: `staff_role.${action}`,
    resource_type: "user_role",
    resource_id: null,
    before_summary: { user_id: targetUserId, roles: [...currentRoles] },
    after_summary: { user_id: targetUserId, roles: [...nextRoles], changed_role: roleCode },
    request_id: crypto.randomUUID(),
  });
  if (auditError) {
    if (action === "grant") {
      await admin.from("user_roles").delete().eq("user_id", targetUserId)
        .eq("role_code", roleCode).is("revoked_at", null);
    } else {
      await admin.from("user_roles").update({ revoked_at: null }).eq("user_id", targetUserId)
        .eq("role_code", roleCode).eq("revoked_at", now);
    }
    await admin.auth.admin.updateUserById(targetUserId, {
      app_metadata: { ...previousMetadata, roles: previousRoles },
    });
    return response(502, { error: "AUDIT_WRITE_FAILED", rollbackAttempted: true });
  }

  return response(200, {
    ok: true, action, roleCode, targetUserId,
    roles: [...nextRoles].sort(),
    note: "The target user must refresh their session to receive updated JWT claims.",
  });
});
