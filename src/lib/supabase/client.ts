import {createBrowserClient} from "@supabase/ssr";
import type {Database} from "@/types/database.types";
import {getSupabasePublicEnv} from "./env";
let browserClient:ReturnType<typeof createBrowserClient<Database>>|undefined;
export function createClient(){
  if(!browserClient){const {url,publishableKey}=getSupabasePublicEnv();browserClient=createBrowserClient<Database>(url,publishableKey);}
  return browserClient;
}
