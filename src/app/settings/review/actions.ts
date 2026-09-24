"use server";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

function fail(message:string):never{redirect("/settings/review?error="+encodeURIComponent(message));}
function steps(value:string,fallback:string[]){const parsed=value.split(",").map(x=>x.trim()).filter(Boolean).slice(0,8);return parsed.length?parsed:fallback;}
export async function updateReviewPreferences(formData:FormData):Promise<void>{
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const desiredRetention=Math.min(0.99,Math.max(0.7,Number(formData.get("desired_retention")||0.9)));
 const maximumInterval=Math.max(1,Number(formData.get("maximum_interval")||36500));
 const newCards=Math.max(0,Number(formData.get("new_cards_per_day")||20));
 const reviews=Math.max(0,Number(formData.get("reviews_per_day")||9999));
 const {error}=await supabase.from("review_preferences").upsert({user_id:user.id,desired_retention:desiredRetention,maximum_interval:maximumInterval,learning_steps:steps(String(formData.get("learning_steps")||""),["1m","10m"]),relearning_steps:steps(String(formData.get("relearning_steps")||""),["10m"]),new_cards_per_day:newCards,reviews_per_day:reviews,enable_fuzz:formData.get("enable_fuzz")==="on",enable_short_term:formData.get("enable_short_term")==="on"});
 if(error)fail(error.message);
 revalidatePath("/settings/review");revalidatePath("/review");redirect("/settings/review?saved=1");
}