import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {checkAuthRateLimit} from "@/lib/auth-rate-limit";

export async function POST(request:Request){
 try{
  const body=await request.json() as {email?:string;password?:string;name?:string};
  const email=String(body.email||"").trim().toLowerCase();
  const password=String(body.password||"");
  const name=String(body.name||"").trim().slice(0,80);
  const forwarded=request.headers.get("x-forwarded-for")||request.headers.get("x-real-ip")||"unknown";
  const ip=forwarded.split(",")[0].trim();
  const limited=checkAuthRateLimit(ip,email);
  if(!limited.allowed)return NextResponse.json({error:"Too many authentication attempts. Please try again later.",retryAfter:limited.retryAfter},{status:429,headers:{"Retry-After":String(limited.retryAfter)}});
  if(!email||password.length<6)return NextResponse.json({error:"Use a valid email and a password with at least 6 characters."},{status:400});
  const supabase=await createClient();
  const {data,error}=await supabase.auth.signUp({email,password,options:{data:{display_name:name}}});
  if(error)return NextResponse.json({error:"Unable to create the account with these details."},{status:400});
  return NextResponse.json({ok:true,session:Boolean(data.session)});
 }catch{return NextResponse.json({error:"Unable to create the account right now."},{status:500});}
}
