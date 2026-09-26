import {NextResponse} from "next/server";
import {createHash} from "node:crypto";
import {createClient as createSupabaseClient} from "@supabase/supabase-js";
import {buildJsonBackup} from "@/lib/backup/json";

function dueNext(frequency:"daily"|"weekly"|"monthly",from=new Date()){
 const next=new Date(from);
 if(frequency==="daily")next.setUTCDate(next.getUTCDate()+1);
 else if(frequency==="weekly")next.setUTCDate(next.getUTCDate()+7);
 else next.setUTCMonth(next.getUTCMonth()+1);
 next.setUTCHours(2,0,0,0);
 return next.toISOString();
}

export async function GET(request:Request){
 const auth=request.headers.get("authorization");
 if(!process.env.CRON_SECRET||auth!=="Bearer "+process.env.CRON_SECRET)return NextResponse.json({error:"Unauthorized"},{status:401});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const serviceRole=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!serviceRole)return NextResponse.json({error:"Supabase service credentials are not configured."},{status:503});
 const supabase=createSupabaseClient(url,serviceRole,{auth:{autoRefreshToken:false,persistSession:false}});
 const now=new Date().toISOString();
 const {data:schedules,error:scheduleError}=await supabase.from("backup_schedules").select("id,user_id,frequency,next_run_at").eq("enabled",true).lte("next_run_at",now).order("next_run_at",{ascending:true}).limit(50);
 if(scheduleError)return NextResponse.json({error:scheduleError.message},{status:500});
 const results:{userId:string;ok:boolean;error?:string}[]=[];
 for(const schedule of schedules??[]){
  try{
   const {data:userData,error:userError}=await supabase.auth.admin.getUserById(schedule.user_id);
   if(userError||!userData.user)throw new Error(userError?.message||"User not found.");
   const payload=await buildJsonBackup(supabase,{id:userData.user.id,email:userData.user.email});
   const bytes=new TextEncoder().encode(JSON.stringify(payload,null,2));
   const checksum=createHash("sha256").update(bytes).digest("hex");
   const path=schedule.user_id+"/backups/"+new Date().toISOString().replace(/[:.]/g,"-")+"-"+crypto.randomUUID()+".json";
   const {error:uploadError}=await supabase.storage.from("user-media").upload(path,bytes,{contentType:"application/json",upsert:false});
   if(uploadError)throw new Error(uploadError.message);
   const {error:versionError}=await supabase.from("backup_versions").insert({user_id:schedule.user_id,format:"json",storage_path:path,size_bytes:bytes.byteLength,checksum});
   if(versionError){
    await supabase.storage.from("user-media").remove([path]);
    throw new Error(versionError.message);
   }
   await supabase.from("backup_schedules").update({last_run_at:new Date().toISOString(),last_error:null,next_run_at:dueNext(String(schedule.frequency) as "daily"|"weekly"|"monthly"),updated_at:new Date().toISOString()}).eq("id",schedule.id);
   results.push({userId:schedule.user_id,ok:true});
  }catch(error){
   const message=error instanceof Error?error.message:"Scheduled backup failed.";
   await supabase.from("backup_schedules").update({last_run_at:new Date().toISOString(),last_error:message,next_run_at:dueNext(String(schedule.frequency) as "daily"|"weekly"|"monthly"),updated_at:new Date().toISOString()}).eq("id",schedule.id);
   results.push({userId:schedule.user_id,ok:false,error:message});
  }
 }
 return NextResponse.json({processed:results.length,results});
}
