import {NextResponse,type NextRequest} from "next/server";
import {createClient} from "@/lib/supabase/server";
function safeNext(value:string|null){return value&&value.startsWith("/")&&!value.startsWith("//")?value:"/dashboard";}
export async function GET(request:NextRequest){
 const code=request.nextUrl.searchParams.get("code"),next=safeNext(request.nextUrl.searchParams.get("next"));
 if(code){const supabase=await createClient();const {error}=await supabase.auth.exchangeCodeForSession(code);if(!error)return NextResponse.redirect(new URL(next,request.url));}
 return NextResponse.redirect(new URL("/login?error=The%20confirmation%20link%20is%20invalid%20or%20expired.",request.url));
}
