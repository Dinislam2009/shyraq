import {AppShell} from "@/components/app-shell";
import {getCurrentUser,getReviewBatch,getReviewPreferences} from "@/lib/supabase/queries";
import {ReviewBootstrap} from "@/components/review-bootstrap";

const defaults={desired_retention:0.9,maximum_interval:36500,learning_steps:["1m","10m"],relearning_steps:["10m"],enable_fuzz:true,enable_short_term:true};

export default async function ReviewPage({searchParams}:{searchParams:Promise<{deck?:string}>}){
 const {deck}=await searchParams;
 let queue:any[]=[];
 let user:any=null;
 let raw:any=null;

 try{queue=await getReviewBatch(deck,20);}catch{}
 try{user=await getCurrentUser();}catch{}
 try{raw=await getReviewPreferences();}catch{}

 const preferences=raw
  ? {...defaults,...raw,learning_steps:Array.isArray(raw.learning_steps)?raw.learning_steps:defaults.learning_steps,relearning_steps:Array.isArray(raw.relearning_steps)?raw.relearning_steps:defaults.relearning_steps}
  : defaults;

 return <AppShell><ReviewBootstrap userId={user?.id||null} initialQueue={queue} initialPreferences={preferences}/></AppShell>;
}
