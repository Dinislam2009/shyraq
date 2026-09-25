import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";
import { updateReviewPreferences } from "@/app/settings/review/actions";

const defaultLabels={again:"Again",hard:"Hard",good:"Good",easy:"Easy"} as const;
const ratings=["again","hard","good","easy"] as const;

export default async function ReviewSettingsPage(){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return null;
 const {data:prefs}=await supabase.from("review_preferences").select("*").eq("user_id",user.id).maybeSingle();
 const rawLabels=prefs?.rating_labels;
 const labelsSource=rawLabels&&typeof rawLabels==="object"&&!Array.isArray(rawLabels)?rawLabels as Record<string,unknown>:{};
 const labels=Object.fromEntries(ratings.map(r=>[r,typeof labelsSource[r]==="string"?String(labelsSource[r]):defaultLabels[r]]));
 const rawOrder=prefs?.rating_order;
 const order=Array.isArray(rawOrder)?rawOrder.map(String).filter((x):x is typeof ratings[number]=>ratings.includes(x as typeof ratings[number])):ratings;
 const styles=prefs?.rating_styles&&typeof prefs.rating_styles==="object"&&!Array.isArray(prefs.rating_styles)?prefs.rating_styles as Record<string,{background?:string;text?:string}>:{};
 const accessibility=prefs?.accessibility&&typeof prefs.accessibility==="object"&&!Array.isArray(prefs.accessibility)?prefs.accessibility as Record<string,unknown>:{};
 const sessionDefaults=prefs?.session_defaults&&typeof prefs.session_defaults==="object"&&!Array.isArray(prefs.session_defaults)?prefs.session_defaults as Record<string,unknown>:{};
 const profiles=Array.isArray(prefs?.scheduler_profiles)?prefs.scheduler_profiles:[];
 return <AppShell><div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
   <p className="text-sm text-slate-400">Review</p>
   <h1 className="mt-1 text-3xl font-semibold tracking-tight">Scheduler settings</h1>
   <p className="mt-2 text-sm text-slate-500">Tune the FSRS scheduler and customize the review controls without changing review history.</p>
   <form action={updateReviewPreferences} className="mt-8 space-y-5 rounded-2xl border border-black/[0.06] bg-white p-6">
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block"><span className="text-sm font-medium">Desired retention</span><input name="desired_retention" type="number" min="0.7" max="0.99" step="0.01" defaultValue={prefs?.desired_retention??0.9} className="mt-2 h-11 w-full rounded-xl border px-3 text-sm"/></label>
      <label className="block"><span className="text-sm font-medium">Maximum interval (days)</span><input name="maximum_interval" type="number" min="1" defaultValue={prefs?.maximum_interval??36500} className="mt-2 h-11 w-full rounded-xl border px-3 text-sm"/></label>
      <label className="block"><span className="text-sm font-medium">New cards / day</span><input name="new_cards_per_day" type="number" min="0" defaultValue={prefs?.new_cards_per_day??20} className="mt-2 h-11 w-full rounded-xl border px-3 text-sm"/></label>
      <label className="block"><span className="text-sm font-medium">Reviews / day</span><input name="reviews_per_day" type="number" min="0" defaultValue={prefs?.reviews_per_day??9999} className="mt-2 h-11 w-full rounded-xl border px-3 text-sm"/></label>
    </div>
    <label className="block"><span className="text-sm font-medium">Learning steps</span><input name="learning_steps" defaultValue={(Array.isArray(prefs?.learning_steps)?prefs.learning_steps:["1m","10m"]).join(", ")} placeholder="1m, 10m" className="mt-2 h-11 w-full rounded-xl border px-3 text-sm"/></label>
    <label className="block"><span className="text-sm font-medium">Relearning steps</span><input name="relearning_steps" defaultValue={(Array.isArray(prefs?.relearning_steps)?prefs.relearning_steps:["10m"]).join(", ")} placeholder="10m" className="mt-2 h-11 w-full rounded-xl border px-3 text-sm"/></label>
    <div className="space-y-3">
      <label className="flex items-center gap-3 text-sm"><input type="checkbox" name="enable_fuzz" defaultChecked={prefs?.enable_fuzz??true}/> Enable interval fuzzing</label>
      <label className="flex items-center gap-3 text-sm"><input type="checkbox" name="enable_short_term" defaultChecked={prefs?.enable_short_term??true}/> Enable short-term scheduling</label>
    </div>
    <div className="border-t border-slate-100 pt-5">
      <h2 className="text-base font-semibold">Review buttons</h2>
      <p className="mt-1 text-sm text-slate-500">Customize labels and order. Keyboard shortcuts stay mapped to the positions shown.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {ratings.map(r=><label key={r} className="block"><span className="text-sm font-medium capitalize">{r}</span><input name={"label_"+r} defaultValue={labels[r]} maxLength={24} className="mt-2 h-11 w-full rounded-xl border px-3 text-sm"/></label>)}
      </div>
      <label className="mt-4 block"><span className="text-sm font-medium">Button order</span><input name="rating_order" defaultValue={order.join(",")} className="mt-2 h-11 w-full rounded-xl border px-3 text-sm" placeholder="again, hard, good, easy"/></label>
      <div className="mt-4 space-y-3">
        <label className="flex items-center gap-3 text-sm"><input type="checkbox" name="show_keyboard_hints" defaultChecked={prefs?.show_keyboard_hints??true}/> Show keyboard shortcuts</label>
        <label className="flex items-center gap-3 text-sm"><input type="checkbox" name="swipe_enabled" defaultChecked={prefs?.swipe_enabled??true}/> Enable swipe gestures</label>
      </div>
    </div>
    <div className="border-t border-slate-100 pt-5">
      <h2 className="text-base font-semibold">Review button appearance</h2>
      <p className="mt-1 text-sm text-slate-500">Customize each rating button independently.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {ratings.map(r=><div key={r} className="grid grid-cols-2 gap-3">
          <label className="block"><span className="text-xs font-medium capitalize">{r} background</span><input name={"color_"+r} defaultValue={styles[r]?.background||""} placeholder="#e2e8f0" className="mt-2 h-10 w-full rounded-xl border px-3 text-sm"/></label>
          <label className="block"><span className="text-xs font-medium capitalize">{r} text</span><input name={"text_"+r} defaultValue={styles[r]?.text||""} placeholder="#0f172a" className="mt-2 h-10 w-full rounded-xl border px-3 text-sm"/></label>
        </div>)}
      </div>
    </div>
    <div className="border-t border-slate-100 pt-5">
      <h2 className="text-base font-semibold">Accessibility</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block"><span className="text-sm font-medium">Review text scale</span><input name="access_scale" type="number" min="0.9" max="1.4" step="0.05" defaultValue={Number(accessibility.scale||1)} className="mt-2 h-11 w-full rounded-xl border px-3 text-sm"/></label>
        <div className="space-y-3 pt-7">
          <label className="flex items-center gap-3 text-sm"><input type="checkbox" name="high_contrast" defaultChecked={accessibility.highContrast===true}/> High contrast</label>
          <label className="flex items-center gap-3 text-sm"><input type="checkbox" name="reduced_motion" defaultChecked={accessibility.reducedMotion===true}/> Reduce motion</label>
          <label className="flex items-center gap-3 text-sm"><input type="checkbox" name="focus_ring" defaultChecked={accessibility.focusRing!==false}/> Strong focus ring</label>
        </div>
      </div>
    </div>
    <div className="border-t border-slate-100 pt-5">
      <h2 className="text-base font-semibold">Session defaults</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="block"><span className="text-sm font-medium">Cards per session</span><input name="session_batch" type="number" min="1" max="100" defaultValue={Number(sessionDefaults.batchSize||20)} className="mt-2 h-11 w-full rounded-xl border px-3 text-sm"/></label>
        <label className="block"><span className="text-sm font-medium">Auto reveal (sec)</span><input name="auto_reveal_seconds" type="number" min="0" max="60" defaultValue={Number(sessionDefaults.autoRevealSeconds||0)} className="mt-2 h-11 w-full rounded-xl border px-3 text-sm"/></label>
        <label className="mt-7 flex items-center gap-3 text-sm"><input type="checkbox" name="session_shuffle" defaultChecked={sessionDefaults.shuffle===true}/> Shuffle queue</label>
      </div>
    </div>
    <div className="border-t border-slate-100 pt-5">
      <h2 className="text-base font-semibold">Scheduler profiles</h2>
      <p className="mt-1 text-sm text-slate-500">Save the current FSRS configuration as a named profile.</p>
      <label className="mt-4 block"><span className="text-sm font-medium">Profile name</span><input name="profile_name" maxLength={50} placeholder="Exam mode" className="mt-2 h-11 w-full rounded-xl border px-3 text-sm"/></label>
      <div className="mt-4 space-y-2">{profiles.map((profile:any)=><div key={String(profile.id||profile.name)} className="rounded-xl bg-slate-50 px-3 py-3 text-sm"><span className="font-medium">{String(profile.name||"FSRS profile")}</span><span className="ml-2 text-xs text-slate-400">FSRS · retention {String(profile.desired_retention||"—")}</span></div>)}</div>
    </div>
    <div className="flex flex-wrap justify-end gap-2"><a href="/settings/review/diagnostics" className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold">Diagnostics</a><a href="/review/config" className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold">Session configuration</a><button className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white">Save scheduler</button></div>
   </form>
 </div></AppShell>;
}