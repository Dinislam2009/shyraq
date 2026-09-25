import Link from "next/link";
import {AppShell} from "@/components/app-shell";
import {createClient} from "@/lib/supabase/server";
import {getDecks,getReviewPreferences} from "@/lib/supabase/queries";
import {startReviewSession} from "@/app/review/config/actions";

export default async function ReviewConfigPage(){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return null;
  const decks=await getDecks();
  const {data:prefs}=await supabase.from("review_preferences").select("session_defaults").eq("user_id",user.id).maybeSingle();
  const defaults=prefs?.session_defaults&&typeof prefs.session_defaults==="object"&&!Array.isArray(prefs.session_defaults)?prefs.session_defaults as Record<string,unknown>:{};
  return <AppShell><div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
    <Link href="/review" className="text-sm text-slate-400 hover:text-slate-700">← Back to review</Link>
    <h1 className="mt-6 text-3xl font-semibold tracking-tight">Review session configuration</h1>
    <p className="mt-2 text-sm text-slate-500">Configure this session without changing the scheduler or review history.</p>
    <form action={startReviewSession} className="mt-8 rounded-2xl border border-black/[0.06] bg-white p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block"><span className="text-sm font-medium">Deck</span><select name="deck" defaultValue="" className="mt-2 h-11 w-full rounded-xl border px-3 text-sm"><option value="">All available decks</option>{decks.map((deck:any)=><option key={deck.id} value={deck.id}>{deck.name}</option>)}</select></label>
        <label className="block"><span className="text-sm font-medium">Cards in session</span><input name="limit" type="number" min="1" max="100" defaultValue={Number(defaults.batchSize||20)} className="mt-2 h-11 w-full rounded-xl border px-3 text-sm"/></label>
        <label className="block"><span className="text-sm font-medium">Auto reveal after (seconds)</span><input name="auto_reveal" type="number" min="0" max="60" defaultValue={Number(defaults.autoRevealSeconds||0)} className="mt-2 h-11 w-full rounded-xl border px-3 text-sm"/></label>
        <label className="mt-7 flex items-center gap-3 text-sm"><input type="checkbox" name="shuffle" defaultChecked={defaults.shuffle===true} className="h-4 w-4 rounded border-slate-300"/> Shuffle session order</label>
      </div>
      <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">The FSRS scheduler still determines due intervals. These options only control the current review queue.</div>
      <div className="mt-5 flex justify-end"><button className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white">Start session</button></div>
    </form>
  </div></AppShell>;
}
