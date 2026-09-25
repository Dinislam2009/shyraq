import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {checkAuthRateLimit} from "@/lib/auth-rate-limit";

export async function POST(request:Request){
 try{
  const body=await request.json() as {email?:string;password?:string};
  const email=String(body.email||"").trim().toLowerCase();
  const password=String(body.password||"");
  const forwarded=request.headers.get("x-forwarded-for")||request.headers.get("x-real-ip")||"unknown";
  const ip=forwarded.split(",")[0].trim();
  const limited=checkAuthRateLimit(ip,email);
  if(!limited.allowed)return NextResponse.json({error:"Too many authentication attempts. Please try again later.",retryAfter:limited.retryAfter},{status:429,headers:{"Retry-After":String(limited.retryAfter)}});
  if(!email||!password)return NextResponse.json({error:"Invalid credentials."},{status:400});
  const supabase=await createClient();
  const {error}=await supabase.auth.signInWithPassword({email,password});
  if(error)return NextResponse.json({error:"Invalid email or password."},{status:401});
  return NextResponse.json({ok:true});
 }catch{ return NextResponse.json({error:"Unable to sign in right now."},{status:500});}
}
