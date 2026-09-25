import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";

const providers=["google","apple"] as const;
type Provider=typeof providers[number];

export async function GET(request:Request,{params}:{params:Promise<{provider:string}>}){
 const {provider}=await params;
 if(!providers.includes(provider as Provider))return NextResponse.json({error:"Unsupported OAuth provider."},{status:400});
 const url=new URL(request.url);
 const next=url.searchParams.get("next")||"/dashboard";
 const safeNext=next.startsWith("/")&&!next.startsWith("//")?next:"/dashboard";
 const supabase=await createClient();
 const {data,error}=await supabase.auth.signInWithOAuth({
  provider:provider as Provider,
  options:{redirectTo:new URL("/auth/callback?next="+encodeURIComponent(safeNext),url.origin).toString()}
 });
 if(error||!data.url)return NextResponse.json({error:error?.message||"OAuth provider is not configured."},{status:400});
 return NextResponse.redirect(data.url);
}
