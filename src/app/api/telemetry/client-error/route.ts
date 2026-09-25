import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";

const buckets=new Map<string,{count:number;resetAt:number}>();
const WINDOW_MS=60_000;
const MAX_PER_MINUTE=20;

function allowed(ip:string){
 const now=Date.now();const current=buckets.get(ip);
 if(!current||current.resetAt<=now){buckets.set(ip,{count:1,resetAt:now+WINDOW_MS});return true;}
 current.count++;
 return current.count<=MAX_PER_MINUTE;
}


export async function POST(request:Request){
 try{
  const ip=(request.headers.get("x-forwarded-for")||request.headers.get("x-real-ip")||"unknown").split(",")[0].trim();
  if(!allowed(ip))return NextResponse.json({ok:false},{status:429,headers:{"Retry-After":"60"}});
  const body=await request.json() as {source?:string;level?:string;message?:string;digest?:string;route?:string;metadata?:Record<string,unknown>};
  const source=String(body.source||"client").slice(0,40);
  const level=["error","warn","fatal"].includes(String(body.level))?String(body.level):"error";
  const message=String(body.message||"Unknown error").slice(0,2000);
  const digest=String(body.digest||"").slice(0,200);
  const routePath=String(body.route||"").slice(0,500);
  const metadata=body.metadata&&typeof body.metadata==="object"?body.metadata:{};
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  const {error}=await supabase.from("error_logs").insert({user_id:user?.id??null,source,level,message,digest:digest||null,route:routePath||null,metadata});
  if(error)return NextResponse.json({ok:false},{status:503});
  return NextResponse.json({ok:true});
 }catch{return NextResponse.json({ok:false},{status:400});}
}
