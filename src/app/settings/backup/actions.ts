"use server";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

type Frequency="daily"|"weekly"|"monthly";

function nextRun(frequency:Frequency,from=new Date()){
 const next=new Date(from);
 if(frequency==="daily")next.setUTCDate(next.getUTCDate()+1);
 else if(frequency==="weekly")next.setUTCDate(next.getUTCDate()+7);
 else next.setUTCMonth(next.getUTCMonth()+1);
 return next.toISOString();
}

export async function saveBackupSchedule(formData:FormData):Promise<void>{
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/login");
 const frequencyRaw=String(formData.get("frequency")||"weekly");
 const frequency:Frequency=frequencyRaw==="daily"||frequencyRaw==="monthly"?frequencyRaw:"weekly";
 const enabled=formData.get("enabled")==="on";
 const {error}=await supabase.from("backup_schedules").upsert({
  user_id:user.id,
  frequency,
  enabled,
  next_run_at:enabled?nextRun(frequency):null,
  last_error:null,
  updated_at:new Date().toISOString()
 },{onConflict:"user_id"});
 if(error)redirect("/export?error="+encodeURIComponent(error.message));
 revalidatePath("/export");
 redirect("/export?backup=schedule");
}
