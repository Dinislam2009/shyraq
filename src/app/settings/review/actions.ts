"use server";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

const ratings=["again","hard","good","easy"] as const;
function fail(message:string):never{redirect("/settings/review?error="+encodeURIComponent(message));}
function steps(value:string,fallback:string[]){const parsed=value.split(",").map(x=>x.trim()).filter(Boolean).slice(0,8);return parsed.length?parsed:fallback;}
function order(value:string){const parsed=value.split(",").map(x=>x.trim().toLowerCase()).filter((x):x is typeof ratings[number]=>ratings.includes(x as typeof ratings[number]));const unique=[...new Set(parsed)];return [...unique,...ratings.filter(x=>!unique.includes(x))];}
function label(value:FormDataEntryValue|null,fallback:string){const v=String(value??"").trim().slice(0,24);return v||fallback;}
function hex(value:FormDataEntryValue|null,fallback:string){const v=String(value??"").trim();return /^#[0-9a-fA-F]{6}$/.test(v)?v:fallback;}
export async function updateReviewPreferences(formData:FormData):Promise<void>{
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const desiredRetention=Math.min(0.99,Math.max(0.7,Number(formData.get("desired_retention")||0.9)));
 const maximumInterval=Math.max(1,Number(formData.get("maximum_interval")||36500));
 const newCards=Math.max(0,Number(formData.get("new_cards_per_day")||20));
 const reviews=Math.max(0,Number(formData.get("reviews_per_day")||9999));
 const ratingLabels={again:label(formData.get("label_again"),"Again"),hard:label(formData.get("label_hard"),"Hard"),good:label(formData.get("label_good"),"Good"),easy:label(formData.get("label_easy"),"Easy")};
 const ratingStyles={
  again:{background:hex(formData.get("color_again"),"#fee2e2"),text:hex(formData.get("text_again"),"#991b1b")},
  hard:{background:hex(formData.get("color_hard"),"#fef3c7"),text:hex(formData.get("text_hard"),"#92400e")},
  good:{background:hex(formData.get("color_good"),"#dcfce7"),text:hex(formData.get("text_good"),"#166534")},
  easy:{background:hex(formData.get("color_easy"),"#dbeafe"),text:hex(formData.get("text_easy"),"#1e40af")}
 };
 const accessibility={
  scale:Math.min(1.4,Math.max(0.9,Number(formData.get("access_scale")||1))),
  highContrast:formData.get("high_contrast")==="on",
  reducedMotion:formData.get("reduced_motion")==="on",
  focusRing:formData.get("focus_ring")!=="off"
 };
 const engine=String(formData.get("scheduler_engine")||"fsrs")==="sm2"?"sm2":"fsrs";
 const sessionDefaults={
  schedulerEngine:engine,
  batchSize:Math.min(100,Math.max(1,Number(formData.get("session_batch")||20))),
  shuffle:formData.get("session_shuffle")==="on",
  autoRevealSeconds:Math.min(60,Math.max(0,Number(formData.get("auto_reveal_seconds")||0)))
 };
 const profileName=String(formData.get("profile_name")||"").trim().slice(0,50);
 const {data:current}=await supabase.from("review_preferences").select("scheduler_profiles").eq("user_id",user.id).maybeSingle();
 const existingProfiles=Array.isArray(current?.scheduler_profiles)?current.scheduler_profiles:[];
 const profile={id:crypto.randomUUID(),name:profileName||(engine==="sm2"?"SM-2 profile":"FSRS profile"),engine,desired_retention:desiredRetention,maximum_interval:maximumInterval,learning_steps:steps(String(formData.get("learning_steps")||""),["1m","10m"]),relearning_steps:steps(String(formData.get("relearning_steps")||""),["10m"]),enable_fuzz:formData.get("enable_fuzz")==="on",enable_short_term:formData.get("enable_short_term")==="on"};
 const profileList=[...existingProfiles.filter((item:any)=>String(item?.name||"")!==profile.name).slice(-9),profile];
 const {error}=await supabase.from("review_preferences").upsert({
  user_id:user.id,
  desired_retention:desiredRetention,
  maximum_interval:maximumInterval,
  learning_steps:steps(String(formData.get("learning_steps")||""),["1m","10m"]),
  relearning_steps:steps(String(formData.get("relearning_steps")||""),["10m"]),
  new_cards_per_day:newCards,
  reviews_per_day:reviews,
  enable_fuzz:formData.get("enable_fuzz")==="on",
  enable_short_term:formData.get("enable_short_term")==="on",
  rating_labels:ratingLabels,
  rating_order:order(String(formData.get("rating_order")||"")),
  show_keyboard_hints:formData.get("show_keyboard_hints")==="on",
  swipe_enabled:formData.get("swipe_enabled")==="on",
  rating_styles:ratingStyles,
  accessibility:accessibility,
  session_defaults:sessionDefaults,
  scheduler_profiles:profileList
 });
 if(error)fail(error.message);
 revalidatePath("/settings/review");revalidatePath("/review");redirect("/settings/review?saved=1");
}