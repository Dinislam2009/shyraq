import Link from "next/link";
import {AppShell} from "@/components/app-shell";
import {createClient} from "@/lib/supabase/server";
import {createCollection,createSmartCollection} from "@/app/collections/actions";

export default async function CollectionsPage(){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return null;
 const {data:workspace}=await supabase.from("workspaces").select("id").eq("owner_id",user.id).eq("kind","personal").limit(1).maybeSingle();if(!workspace)return null;
 const {data:collections}=await supabase.from("collections").select("id,name,kind,created_at,sort_mode,rule,collection_cards(card_id)").eq("workspace_id",workspace.id).order("created_at",{ascending:false});
 return <AppShell><div className="mx-auto max-w-6xl px-5 py-8 sm:px-8"><p className="text-sm text-slate-400">Library</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Collections</h1><p className="mt-2 text-sm text-slate-500">Group cards manually or define smart collections from reusable rules.</p>
 <div className="mt-6 grid gap-4 lg:grid-cols-2">
  <form action={createCollection} className="rounded-2xl border border-black/[0.06] bg-white p-5"><h2 className="font-semibold">New collection</h2><div className="mt-3 flex gap-2"><input required name="name" placeholder="Collection name" className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm"/><button className="rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white">Create</button></div></form>
  <form action={createSmartCollection} className="rounded-2xl border border-black/[0.06] bg-white p-5"><h2 className="font-semibold">Smart collection</h2><div className="mt-3 grid gap-2 sm:grid-cols-2"><input required name="name" placeholder="e.g. Difficult cards" className="h-10 rounded-xl border border-slate-200 px-3 text-sm"/><select name="rule_kind" className="h-10 rounded-xl border border-slate-200 px-3 text-sm"><option value="kind">Card kind</option><option value="marked">Marked</option><option value="suspended">Suspended</option><option value="tag">Tag</option></select><input name="rule_value" placeholder="kind or tag name" className="h-10 rounded-xl border border-slate-200 px-3 text-sm sm:col-span-2"/></div><input type="hidden" name="rule" value="{}"/><p className="mt-2 text-xs text-slate-400">Rules are stored as portable JSON and can evolve without changing card ownership.</p><button className="mt-3 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">Create smart collection</button></form>
 </div>
 <div className="mt-8 grid gap-4 md:grid-cols-2">{(collections??[]).map((c:any)=><Link href={"/collections/"+c.id} key={c.id} className="rounded-2xl border border-black/[0.06] bg-white p-6 hover:shadow-sm"><div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{c.kind}</p><span className="text-xs text-slate-400">{c.sort_mode}</span></div><h2 className="mt-3 font-semibold">{c.name}</h2><p className="mt-2 text-sm text-slate-500">{c.kind==="smart"?"Rule-based collection":"Manual collection"} · {c.collection_cards?.length??0} linked cards</p></Link>)}</div>
 </div></AppShell>;
}
