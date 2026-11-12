export function getSupabasePublicEnv() {
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!publishableKey) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  let parsed:URL; try { parsed=new URL(url); } catch { throw new Error("NEXT_PUBLIC_SUPABASE_URL must be a valid URL."); }
  if(parsed.protocol!=="https:"&&parsed.hostname!=="localhost"&&parsed.hostname!=="127.0.0.1") throw new Error("Supabase URL must use HTTPS outside local development.");
  if(!publishableKey.startsWith("sb_publishable_")) throw new Error("Use a Supabase publishable key, never a secret/service-role key.");
  return {url:parsed.origin,publishableKey};
}
