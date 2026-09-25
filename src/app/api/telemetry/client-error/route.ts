import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";

export async function POST(request:Request){
 try{
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
