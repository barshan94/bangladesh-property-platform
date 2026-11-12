import {createServerClient} from "@supabase/ssr";
import {NextResponse,type NextRequest} from "next/server";
import type {Database} from "@/types/database.types";
import {getSupabasePublicEnv} from "./env";
export async function updateSession(request:NextRequest){
  const {url,publishableKey}=getSupabasePublicEnv(); let response=NextResponse.next({request});
  const supabase=createServerClient<Database>(url,publishableKey,{cookies:{
    getAll(){return request.cookies.getAll();},
    setAll(values){values.forEach(({name,value})=>request.cookies.set(name,value));response=NextResponse.next({request});values.forEach(({name,value,options})=>response.cookies.set(name,value,options));}
  }});
  await supabase.auth.getClaims();
  return response;
}
