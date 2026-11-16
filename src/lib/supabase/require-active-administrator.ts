import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Require both the trusted JWT role claim and the current database role row.
 * The second check prevents a revoked administrator with an unexpired token
 * from reaching server-only administrative reads or writes.
 */
export async function requireActiveAdministrator() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const roles = (claims?.app_metadata as { roles?: unknown } | undefined)?.roles;

  if (error || typeof claims?.sub !== "string" || !Array.isArray(roles) || !roles.includes("administrator")) {
    redirect("/dashboard?message=Administrator%20access%20is%20required.");
  }

  const { data: active, error: roleError } = await supabase.rpc("current_user_is_active_administrator");
  if (roleError || active !== true) {
    redirect("/dashboard?message=Your%20administrator%20access%20is%20not%20active.%20Sign%20in%20again%20or%20contact%20the%20project%20administrator.");
  }

  return { supabase, actorId: claims.sub };
}
