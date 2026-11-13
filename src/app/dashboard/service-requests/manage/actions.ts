"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const staffRoles = new Set(["intake_coordinator", "case_manager", "administrator"]);
const statuses = new Set(["new", "triaged", "assigned", "in_progress", "waiting_on_client", "resolved", "closed", "spam"]);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function requireStaff() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const roles = (claims?.app_metadata as { roles?: unknown } | undefined)?.roles;
  if (error || typeof claims?.sub !== "string" || !Array.isArray(roles) || !roles.some(role => typeof role === "string" && staffRoles.has(role))) {
    redirect("/dashboard?message=Authorized%20service%20staff%20access%20is%20required.");
  }
  return { supabase, actorId: claims.sub };
}

export async function updateServiceRequest(formData: FormData) {
  const id = String(formData.get("request_id") ?? "");
  const statusValue = String(formData.get("status") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!uuidPattern.test(id) || (statusValue && !statuses.has(statusValue)) || reason.length < 5 || reason.length > 1000) {
    redirect("/dashboard/service-requests/manage?error=Check%20the%20request,%20status%20and%20reason.");
  }
  const { supabase } = await requireStaff();
  const { error } = await supabase.rpc("manage_service_request", {
    p_service_request_id: id,
    p_new_status: statusValue || null,
    p_assigned_to: null,
    p_reason: reason,
    p_request_id: randomUUID(),
  });
  if (error) redirect("/dashboard/service-requests/manage?error=The%20update%20was%20not%20accepted.%20Check%20the%20allowed%20status%20transitions.");
  redirect("/dashboard/service-requests/manage?updated=1");
}

export async function assignServiceRequestToMe(formData: FormData) {
  const id = String(formData.get("request_id") ?? "");
  const reason = String(formData.get("reason") ?? "Assigned to current staff member").trim();
  if (!uuidPattern.test(id) || reason.length < 5 || reason.length > 1000) {
    redirect("/dashboard/service-requests/manage?error=Invalid%20assignment%20request.");
  }
  const { supabase, actorId } = await requireStaff();
  const { error } = await supabase.rpc("manage_service_request", {
    p_service_request_id: id,
    p_new_status: null,
    p_assigned_to: actorId,
    p_reason: reason,
    p_request_id: randomUUID(),
  });
  if (error) redirect("/dashboard/service-requests/manage?error=Assignment%20failed.%20Confirm%20your%20active%20staff%20role.");
  redirect("/dashboard/service-requests/manage?updated=1");
}
