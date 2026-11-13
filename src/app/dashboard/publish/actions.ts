"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function publishApprovedListing(formData: FormData) {
  const listingId = String(formData.get("listing_id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(listingId)) {
    redirect("/dashboard/publish?error=Invalid%20listing%20reference.");
  }
  if (reason.length < 10 || reason.length > 1000 || /[\u0000-\u001f\u007f]/.test(reason)) {
    redirect("/dashboard/publish?error=Enter%20a%20publication%20note%20between%2010%20and%201000%20characters.");
  }

  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const roles = (claims?.app_metadata as { roles?: unknown } | undefined)?.roles;
  if (authError || !claims?.sub || !Array.isArray(roles) || !roles.includes("listing_publisher")) {
    redirect("/dashboard?message=Publisher%20access%20is%20required.");
  }

  const { error } = await supabase.rpc("transition_property_listing", {
    p_listing_id: listingId,
    p_to_status: "published",
    p_reason: reason,
    p_request_id: randomUUID(),
  });
  if (error) {
    redirect("/dashboard/publish?error=Publication%20was%20not%20accepted.%20Refresh%20the%20queue%20and%20check%20the%20listing%20status.");
  }
  redirect("/dashboard/publish?published=1");
}
