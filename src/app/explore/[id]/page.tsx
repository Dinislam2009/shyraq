import Link from "next/link";
import {notFound} from "next/navigation";
import {AppShell} from "@/components/app-shell";
import {createClient} from "@/lib/supabase/server";
import {copyDeckWithOptions} from "@/app/explore/[id]/actions";
import {copyDeck,followDeck,reportDeck,unfollowDeck} from "@/app/explore/[id]/actions";

export default async function PublicDeckPage({params}:{params:Promise<{id:string}>}){
 const {id}=await params;const supabase=await createClient();
 const {data:deck}=await supabase.from("decks").select("id,name,description,updated_at,settings,cards(id,content,kind,sort_order),owner_id").eq("id",id).eq("visibility","public").maybeSingle();
 if(!deck)notFound();
 const {data:profile}=await supabase.from("public_profiles").select("username,display_name,bio").eq("id",deck.owner_id).maybeSingle();
 const {data:{user}}=await supabase.auth.getUser();
 const following=user?(await supabase.from("public_deck_follows").select("deck_id").eq("user_id",user.id).eq("deck_id",id).maybeSingle()).data: null;
 const settings=(deck.settings||{}) as any;
 return <AppShell><div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
  <Link href="/explore" className="text-sm text-slate-400">← Public decks</Link>
  <div className="mt-6 rounded-3xl border border-black/[0.06] bg-white p-8">
   <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Public deck</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">{deck.name}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">{deck.description||"No description"}</p><p className="mt-3 text-xs text-slate-400">{profile?.username?"@"+profile.username:(profile?.display_name||"Creator")}</p></div><Link href={"/profile/"+deck.owner_id} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">Creator profile</Link></div>
   <div className="mt-5 flex flex-wrap gap-1">{[settings.category,settings.subject,settings.language,settings.difficulty].filter(Boolean).map((value:any)=><span key={String(value)} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{String(value)}</span>)}</div>
   <div className="mt-6 flex flex-wrap gap-2"><form action={(following?unfollowDeck:followDeck).bind(null,id)}><button className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">{following?"Unfollow":"Follow"}</button></form><form action={copyDeck.bind(null,id)}><button className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Copy to my decks</button></form></div><form action={copyDeckWithOptions.bind(null,id)} className="mt-4 grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[1fr_220px_auto]"><input name="name" placeholder="Custom copy name (optional)" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"/><select name="update_policy" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="ask">Ask before author updates</option><option value="accept_all">Accept future author updates</option></select><button className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold">Copy with options</button></form>
   <form action={reportDeck.bind(null,id)} className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5"><p className="text-sm font-semibold">Report this deck</p><div className="mt-3 grid gap-3 md:grid-cols-2"><select name="reason" required className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="">Reason</option><option value="copyright">Copyright</option><option value="spam">Spam</option><option value="unsafe">Unsafe content</option><option value="misleading">Misleading</option><option value="other">Other</option></select><input name="details" maxLength={1000} placeholder="Optional details" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"/></div><button className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold">Submit report</button></form>
  </div>
  <div className="mt-6 overflow-hidden rounded-2xl border border-black/[0.06] bg-white">{(deck.cards??[]).slice(0,50).map((c:any,i:number)=><div key={c.id} className={"grid gap-5 p-5 md:grid-cols-2 "+(i?"border-t border-black/[0.05]":"")}><div><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Front</p><p className="mt-2 whitespace-pre-wrap text-sm">{c.content?.front||""}</p></div><div><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Back</p><p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{c.content?.back||""}</p></div></div>)}</div>
 </div></AppShell>;
}
