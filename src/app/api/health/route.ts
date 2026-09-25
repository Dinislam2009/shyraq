import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";

export async function GET(){
 try{
  const supabase=await createClient();
  const started=Date.now();
  const {error}=await supabase.from("profiles").select("id",{head:true,count:"exact"});
  if(error)return NextResponse.json({ok:false,service:"supabase",error:error.message},{status:503});
  return NextResponse.json({ok:true,service:"shyraq",database:"ok",latencyMs:Date.now()-started,timestamp:new Date().toISOString()});
 }catch(error){
  return NextResponse.json({ok:false,service:"shyraq",error:error instanceof Error?error.message:"Unknown error"},{status:503});
 }
}