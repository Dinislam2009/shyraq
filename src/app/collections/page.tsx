import Link from "next/link";
import {AppShell} from "@/components/app-shell";
import {createClient} from "@/lib/supabase/server";
import {createCollection} from "@/app/collections/actions";

export default async function CollectionsPage(){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return null;
 const {data:workspace}=await supabase.from("workspaces").select("id").eq("owner_id",user.id).eq("kind","personal").limit(1).maybeSingle();if(!workspace)return null;
 const {data:collections}=await supabase.from("collections").select("id,name,kind,created_at,collection_cards(card_id)").eq("workspace_id",workspace.id).order("created_at");
 return <AppShell><div className="mx-auto max-w-5xl px-5 py-8 sm:px-8"><p className="text-sm text-slate-400">Library</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Collections</h1><p className="mt-2 text-sm text-slate-500">Group important cards without changing their deck.</p>
 <form action={createCollection} className="mt-6 flex max-w-xl gap-2"><input required name="name" placeholder="New collection name" className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm"/><button className="rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white">Create</button></form>
 <div className="mt-8 grid gap-4 md:grid-cols-2">{(collections??[]).map((c:any)=><Link href={"/collections/"+c.id} key={c.id} className="rounded-2xl border border-black/[0.06] bg-white p-6 hover:shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{c.kind}</p><h2 className="mt-3 font-semibold">{c.name}</h2><p className="mt-2 text-sm text-slate-500">{c.collection_cards?.length??0} cards</p></Link>)}</div>
 </div></AppShell>;
}