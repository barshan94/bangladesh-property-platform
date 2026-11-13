"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const reviewerDecisions = new Set(["changes_requested", "approved", "rejected"]);

export async function transitionListingForReview(formData: FormData) {
  const listingId = String(formData.get("listing_id") ?? "");
  const toStatus = String(formData.get("to_status") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(listingId)) {
    redirect("/dashboard/review?error=Invalid%20listing%20reference.");
  }
  if (!["under_review", ...reviewerDecisions].includes(toStatus)) {
    redirect("/dashboard/review?error=Unsupported%20review%20decision.");
  }
  if (reviewerDecisions.has(toStatus) && (!reason || reason.length > 2000)) {
    redirect("/dashboard/review?error=A%20clear%20reason%20of%20at%20most%202000%20characters%20is%20required.");
  }

  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const roles = (claims?.app_metadata as { roles?: unknown } | undefined)?.roles;
  if (authError || !claims?.sub || !Array.isArray(roles) || !roles.includes("listing_reviewer")) {
    redirect("/dashboard?message=Reviewer%20access%20is%20required.");
  }

  const { error } = await supabase.rpc("transition_property_listing", {
    p_listing_id: listingId,
    p_to_status: toStatus,
    p_reason: reason || null,
    p_request_id: randomUUID(),
  });
  if (error) {
    redirect("/dashboard/review?error=The%20review%20action%20was%20not%20accepted.%20Refresh%20the%20queue%20and%20check%20the%20listing%20status.");
  }
  redirect("/dashboard/review?updated=1");
}
