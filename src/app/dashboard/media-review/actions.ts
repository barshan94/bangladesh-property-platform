"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type RpcClient = {
  rpc: (name: string, args: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f]/u;

export async function reviewListingMedia(formData: FormData) {
  const mediaIds = formData.getAll("media_id");
  const decisions = formData.getAll("decision");
  const reasons = formData.getAll("reason");

  if (mediaIds.length !== 1 || decisions.length !== 1 || reasons.length !== 1 ||
      typeof mediaIds[0] !== "string" || typeof decisions[0] !== "string" ||
      typeof reasons[0] !== "string") {
    redirect("/dashboard/media-review?error=Invalid%20review%20submission.");
  }

  const mediaId = mediaIds[0];
  const decision = decisions[0];
  const rawReason = reasons[0];
  if (rawReason.length > 1000 || CONTROL_CHARACTERS.test(rawReason)) {
    redirect("/dashboard/media-review?error=A%20valid%20reason%20of%205%E2%80%931000%20characters%20is%20required.");
  }
  const reason = rawReason.trim();

  if (!UUID.test(mediaId)) redirect("/dashboard/media-review?error=Invalid%20media%20reference.");
  if (decision !== "approved" && decision !== "rejected") {
    redirect("/dashboard/media-review?error=Unsupported%20moderation%20decision.");
  }
  if (reason.length < 5 || reason.length > 1000) {
    redirect("/dashboard/media-review?error=A%20valid%20reason%20of%205%E2%80%931000%20characters%20is%20required.");
  }

  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const roles = (claims?.app_metadata as { roles?: unknown } | undefined)?.roles;
  if (authError || !claims?.sub || !Array.isArray(roles) ||
      (!roles.includes("listing_reviewer") && !roles.includes("administrator"))) {
    redirect("/dashboard?message=Listing%20media%20reviewer%20access%20is%20required.");
  }

  const rpc = supabase as unknown as RpcClient;
  const { error } = await rpc.rpc("review_listing_media", {
    p_media_id: mediaId,
    p_decision: decision,
    p_reason: reason,
  });
  if (error) redirect("/dashboard/media-review?error=The%20moderation%20decision%20was%20not%20accepted.");
  redirect("/dashboard/media-review?updated=1");
}
