"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function saveInquiryFollowUp(formData: FormData) {
  const inquiryId = String(formData.get("inquiry_id") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!uuidPattern.test(inquiryId) || note.length < 5 || note.length > 4000) {
    redirect("/dashboard/inquiries?error=Enter%20a%20valid%20inquiry%20and%20a%205%E2%80%934000%20character%20follow-up%20note.");
  }
  const sessionClient = await createClient();
  const { data, error } = await sessionClient.auth.getClaims();
  const claims = data?.claims;
  const roles = (claims?.app_metadata as { roles?: unknown } | undefined)?.roles;
  if (error || typeof claims?.sub !== "string" || !Array.isArray(roles) || !roles.includes("administrator")) {
    redirect("/dashboard?message=Administrator%20access%20is%20required.");
  }
  const { error: insertError } = await sessionClient.rpc("admin_add_inquiry_staff_note", {
    p_inquiry_id: inquiryId,
    p_note: note,
  });
  if (insertError) redirect("/dashboard/inquiries?error=The%20follow-up%20note%20could%20not%20be%20saved.%20Confirm%20that%20your%20administrator%20access%20is%20active.");
  redirect("/dashboard/inquiries?saved=1");
}

export async function updateInquiryStatus(formData: FormData) {
  const inquiryId = String(formData.get("inquiry_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!uuidPattern.test(inquiryId)) redirect("/dashboard/inquiries?error=Invalid%20inquiry%20reference.");
  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const roles = (claims?.app_metadata as { roles?: unknown } | undefined)?.roles;
  if (authError || typeof claims?.sub !== "string" || !Array.isArray(roles) || !roles.includes("administrator")) {
    redirect("/dashboard?message=Administrator%20access%20is%20required.");
  }
  const { error } = await supabase.rpc("admin_update_inquiry_status", {
    p_inquiry_id: inquiryId, p_status: status, p_request_id: randomUUID(),
  });
  if (error) redirect("/dashboard/inquiries?error=The%20inquiry%20status%20could%20not%20be%20updated.");
  redirect("/dashboard/inquiries?statusUpdated=1");
}
