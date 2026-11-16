"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SERVICE_CODES } from "@/data/service-codes.mjs";

type WriteClient = {
  from: (table: string) => {
    upsert: (values: Record<string, unknown>, options: { onConflict: string }) => Promise<{ error: { message: string } | null }>;
  };
};

function approvedVideoUrl(value: string, provider: "youtube" | "facebook"): string | null {
  if (!value) return null;
  if (value.length > 500) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    const host = url.hostname.toLowerCase();
    const allowed = provider === "youtube"
      ? ["youtube.com", "www.youtube.com", "youtu.be"]
      : ["facebook.com", "www.facebook.com", "fb.watch"];
    return allowed.includes(host) ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function saveServicePage(formData: FormData) {
  const serviceCode = String(formData.get("service_code") ?? "");
  const longDescription = String(formData.get("long_description") ?? "").trim();
  const youtubeInput = String(formData.get("youtube_url") ?? "").trim();
  const facebookInput = String(formData.get("facebook_url") ?? "").trim();

  if (!(SERVICE_CODES as readonly string[]).includes(serviceCode)) {
    redirect("/dashboard/services?error=Choose%20a%20valid%20service.");
  }
  if (longDescription.length < 30 || longDescription.length > 12000) {
    redirect("/dashboard/services?error=Service%20details%20must%20contain%2030%E2%80%9312%2C000%20characters.");
  }
  const youtubeUrl = approvedVideoUrl(youtubeInput, "youtube");
  const facebookUrl = approvedVideoUrl(facebookInput, "facebook");
  if (youtubeInput && !youtubeUrl) {
    redirect("/dashboard/services?error=Enter%20a%20valid%20HTTPS%20YouTube%20link.");
  }
  if (facebookInput && !facebookUrl) {
    redirect("/dashboard/services?error=Enter%20a%20valid%20HTTPS%20Facebook%20video%20link.");
  }

  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const roles = (claims?.app_metadata as { roles?: unknown } | undefined)?.roles;
  if (authError || typeof claims?.sub !== "string" || !Array.isArray(roles) || !roles.includes("administrator")) {
    redirect("/dashboard?message=Administrator%20access%20is%20required.");
  }

  const writer = supabase as unknown as WriteClient;
  const { error } = await writer.from("service_pages").upsert({
    service_code: serviceCode,
    long_description: longDescription,
    youtube_url: youtubeUrl,
    facebook_url: facebookUrl,
    updated_by: claims.sub,
    updated_at: new Date().toISOString(),
  }, { onConflict: "service_code" });

  if (error) {
    redirect("/dashboard/services?error=The%20service%20could%20not%20be%20saved.%20The%20database%20migration%20may%20not%20be%20installed.");
  }
  redirect("/dashboard/services?saved=1");
}
