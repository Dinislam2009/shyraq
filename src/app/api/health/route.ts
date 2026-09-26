import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";

export async function GET(){
  const supabaseUrl=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  let supabaseHost: string | null=null;
  try{supabaseHost=supabaseUrl?new URL(supabaseUrl).host:null;}catch{supabaseHost=null;}

  if(!supabaseUrl||!supabaseKey){
    return NextResponse.json({
      ok:false,
      service:"shyraq",
      database:"not_configured",
      supabaseHost,
      publishableKeyConfigured:Boolean(supabaseKey),
      timestamp:new Date().toISOString(),
    },{status:503});
  }

  try{
    const supabase=await createClient();
    const started=Date.now();
    const {error}=await supabase.from("public_profiles").select("id",{head:true,count:"exact"});
    if(error){
      return NextResponse.json({
        ok:false,
        service:"shyraq",
        database:"unavailable",
        supabaseHost,
        publishableKeyConfigured:Boolean(supabaseKey),
        error:error.message,
        latencyMs:Date.now()-started,
        timestamp:new Date().toISOString(),
      },{status:503});
    }
    return NextResponse.json({
      ok:true,
      service:"shyraq",
      database:"ok",
      supabaseHost,
      publishableKeyConfigured:Boolean(supabaseKey),
      latencyMs:Date.now()-started,
      timestamp:new Date().toISOString(),
    });
  }catch(error){
    return NextResponse.json({
      ok:false,
      service:"shyraq",
      database:"unavailable",
      supabaseHost,
      publishableKeyConfigured:Boolean(supabaseKey),
      error:error instanceof Error?error.message:"Unknown error",
      timestamp:new Date().toISOString(),
    },{status:503});
  }
}
