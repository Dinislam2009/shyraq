"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

function fail(message:string):never{redirect("/settings/review/diagnostics?error="+encodeURIComponent(message));}

export async function applySchedulerProfile(formData:FormData):Promise<void>{
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)redirect("/login");
  const profileId=String(formData.get("profile_id")||"").trim();
  const {data:prefs}=await supabase.from("review_preferences").select("scheduler_profiles").eq("user_id",user.id).maybeSingle();
  const profiles=Array.isArray(prefs?.scheduler_profiles)?prefs.scheduler_profiles:[];
  const profile=profiles.find((item:any)=>String(item?.id||"")===profileId);
  if(!profile)fail("Scheduler profile not found.");
  const {error}=await supabase.from("review_preferences").update({
    desired_retention:Number(profile.desired_retention)||0.9,
    maximum_interval:Number(profile.maximum_interval)||36500,
    learning_steps:Array.isArray(profile.learning_steps)?profile.learning_steps:["1m","10m"],
    relearning_steps:Array.isArray(profile.relearning_steps)?profile.relearning_steps:["10m"],
    enable_fuzz:profile.enable_fuzz!==false,
    enable_short_term:profile.enable_short_term!==false
  }).eq("user_id",user.id);
  if(error)fail(error.message);
  revalidatePath("/settings/review");
  revalidatePath("/review");
  redirect("/settings/review?saved=1");
}

export async function importSchedulerProfile(formData:FormData):Promise<void>{
  const file=formData.get("file");
  if(!(file instanceof File)||file.size===0)fail("Choose a JSON profile file.");
  if(file.size>1024*1024)fail("Profile file is too large.");
  try{
    const data=JSON.parse(await file.text());
    const profile=data?.profile??data;
    if(!profile||typeof profile!=="object")throw new Error("Invalid profile.");
    const clean={
      id:crypto.randomUUID(),
      name:String(profile.name||"Imported FSRS profile").slice(0,50),
      engine:"fsrs",
      desired_retention:Math.min(0.99,Math.max(0.7,Number(profile.desired_retention||0.9))),
      maximum_interval:Math.max(1,Number(profile.maximum_interval||36500)),
      learning_steps:Array.isArray(profile.learning_steps)?profile.learning_steps.map(String).slice(0,8):["1m","10m"],
      relearning_steps:Array.isArray(profile.relearning_steps)?profile.relearning_steps.map(String).slice(0,8):["10m"],
      enable_fuzz:profile.enable_fuzz!==false,
      enable_short_term:profile.enable_short_term!==false
    };
    const supabase=await createClient();
    const {data:{user}}=await supabase.auth.getUser();
    if(!user)redirect("/login");
    const {data:prefs}=await supabase.from("review_preferences").select("scheduler_profiles").eq("user_id",user.id).maybeSingle();
    const profiles=Array.isArray(prefs?.scheduler_profiles)?prefs.scheduler_profiles:[];
    const {error}=await supabase.from("review_preferences").upsert({user_id:user.id,scheduler_profiles:[...profiles.slice(-9),clean]});
    if(error)throw new Error(error.message);
    revalidatePath("/settings/review/diagnostics");
    revalidatePath("/settings/review");
    redirect("/settings/review/diagnostics?imported=1");
  }catch(error){
    fail(error instanceof Error?error.message:"Invalid profile JSON.");
  }
}
