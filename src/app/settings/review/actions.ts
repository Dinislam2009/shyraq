"use server";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

const ratings=["again","hard","good","easy"] as const;
function fail(message:string):never{redirect("/settings/review?error="+encodeURIComponent(message));}
function steps(value:string,fallback:string[]){const parsed=value.split(",").map(x=>x.trim()).filter(Boolean).slice(0,8);return parsed.length?parsed:fallback;}
function order(value:string){const parsed=value.split(",").map(x=>x.trim().toLowerCase()).filter((x):x is typeof ratings[number]=>ratings.includes(x as typeof ratings[number]));const unique=[...new Set(parsed)];return [...unique,...ratings.filter(x=>!unique.includes(x))];}
function label(value:FormDataEntryValue|null,fallback:string){const v=String(value??"").trim().slice(0,24);return v||fallback;}
export async function updateReviewPreferences(formData:FormData):Promise<void>{
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const desiredRetention=Math.min(0.99,Math.max(0.7,Number(formData.get("desired_retention")||0.9)));
 const maximumInterval=Math.max(1,Number(formData.get("maximum_interval")||36500));
 const newCards=Math.max(0,Number(formData.get("new_cards_per_day")||20));
 const reviews=Math.max(0,Number(formData.get("reviews_per_day")||9999));
 const ratingLabels={again:label(formData.get("label_again"),"Again"),hard:label(formData.get("label_hard"),"Hard"),good:label(formData.get("label_good"),"Good"),easy:label(formData.get("label_easy"),"Easy")};
 const {error}=await supabase.from("review_preferences").upsert({user_id:user.id,desired_retention:desiredRetention,maximum_interval:maximumInterval,learning_steps:steps(String(formData.get("learning_steps")||""),["1m","10m"]),relearning_steps:steps(String(formData.get("relearning_steps")||""),["10m"]),new_cards_per_day:newCards,reviews_per_day:reviews,enable_fuzz:formData.get("enable_fuzz")==="on",enable_short_term:formData.get("enable_short_term")==="on",rating_labels:ratingLabels,rating_order:order(String(formData.get("rating_order")||"")),show_keyboard_hints:formData.get("show_keyboard_hints")==="on",swipe_enabled:formData.get("swipe_enabled")==="on"});
 if(error)fail(error.message);
 revalidatePath("/settings/review");revalidatePath("/review");redirect("/settings/review?saved=1");
}