import {AppShell} from "@/components/app-shell";
import {getCurrentUser,getReviewBatch,getReviewPreferences} from "@/lib/supabase/queries";
import {ReviewBootstrap} from "@/components/review-bootstrap";

const defaults={desired_retention:0.9,maximum_interval:36500,learning_steps:["1m","10m"],relearning_steps:["10m"],enable_fuzz:true,enable_short_term:true};

export default async function ReviewPage({searchParams}:{searchParams:Promise<{deck?:string;limit?:string;shuffle?:string;auto?:string}>}){
 const params=await searchParams;
 const deck=params.deck;

 let queue:any[]=[];
 let user:any=null;
 let raw:any=null;

 try{user=await getCurrentUser();}catch{}
 try{raw=await getReviewPreferences();}catch{}

 let preferences=raw
  ? {...defaults,...raw,learning_steps:Array.isArray(raw.learning_steps)?raw.learning_steps:defaults.learning_steps,relearning_steps:Array.isArray(raw.relearning_steps)?raw.relearning_steps:defaults.relearning_steps}
  : defaults;
 const storedSessionDefaults=preferences.session_defaults&&typeof preferences.session_defaults==="object"&&!Array.isArray(preferences.session_defaults)?preferences.session_defaults:{};
 const requestedLimit=Math.min(100,Math.max(1,Number(params.limit||Number((storedSessionDefaults as any).batchSize||20))));
 const shuffleSession=params.shuffle!==undefined ? params.shuffle==="1" : (storedSessionDefaults as any).shuffle===true;
 const autoReveal=params.auto!==undefined ? Math.min(60,Math.max(0,Number(params.auto||0))) : Number((storedSessionDefaults as any).autoRevealSeconds||0);
 try{queue=await getReviewBatch(deck,requestedLimit);}catch{}
 preferences={...preferences,session_defaults:{...storedSessionDefaults,batchSize:requestedLimit,shuffle:shuffleSession,autoRevealSeconds:autoReveal}};
 if(shuffleSession)queue=[...queue].sort(()=>Math.random()-0.5);

 return <AppShell><ReviewBootstrap userId={user?.id||null} initialQueue={queue} initialPreferences={preferences} deckId={deck} limit={requestedLimit}/></AppShell>;
}
