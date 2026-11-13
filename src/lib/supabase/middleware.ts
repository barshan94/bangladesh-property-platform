import {createServerClient} from "@supabase/ssr";
import {NextResponse,type NextRequest} from "next/server";
import type {Database} from "@/types/database.types";
import {getSupabasePublicEnv} from "./env";

export async function updateSession(request:NextRequest){
  const {url,publishableKey}=getSupabasePublicEnv();
  let response=NextResponse.next({request});
  const supabase=createServerClient<Database>(url,publishableKey,{cookies:{
    getAll(){return request.cookies.getAll();},
    setAll(values){
      values.forEach(({name,value})=>request.cookies.set(name,value));

      // Rebuild the forwarded request so downstream handlers see refreshed cookies,
      // while retaining response metadata already attached by earlier middleware.
      const previousHeaders=new Headers(response.headers);
      const previousCookies=response.cookies.getAll();
      response=NextResponse.next({request});
      previousHeaders.forEach((value,key)=>response.headers.set(key,value));
      previousCookies.forEach(cookie=>response.cookies.set(cookie));
      values.forEach(({name,value,options})=>response.cookies.set(name,value,options));
    }
  }});
  await supabase.auth.getClaims();
  return response;
}
