"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function activateFirstAdministrator() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  if (userError || !user) redirect("/login?message=Sign%20in%20before%20administrator%20activation.");

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (sessionError || !accessToken) {
    redirect("/dashboard/activate-administrator?error=Your%20session%20could%20not%20be%20verified.%20Please%20sign%20in%20again.");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    redirect("/dashboard/activate-administrator?error=The%20Supabase%20connection%20is%20not%20configured.");
  }

  const response = await fetch(url + "/functions/v1/manage-staff-role", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer " + accessToken,
    },
    body: JSON.stringify({
      action: "grant",
      targetUserId: user.id,
      roleCode: "administrator",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { error?: string };
    const message = payload.error === "BOOTSTRAP_ALREADY_CLAIMED"
      ? "First-administrator setup has already been claimed. Contact the existing administrator."
      : payload.error === "ADMINISTRATOR_ACCESS_REQUIRED"
        ? "This signed-in account is not authorized for first-administrator setup. Confirm you are using the account selected for the client."
        : "The secure activation service rejected the request. No administrator access was granted. Check the Edge Function deployment and bootstrap secret.";
    redirect("/dashboard/activate-administrator?error=" + encodeURIComponent(message));
  }

  const { error: refreshError } = await supabase.auth.refreshSession();
  if (refreshError) {
    redirect("/dashboard/activate-administrator?error=Activation%20was%20accepted.%20Sign%20out%20and%20sign%20in%20again%20to%20refresh%20your%20administrator%20access.");
  }
  redirect("/dashboard/admin");
}
