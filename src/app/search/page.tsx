import Link from "next/link";
import {AppShell} from "@/components/app-shell";
import {createClient} from "@/lib/supabase/server";
import {deleteSearch,saveSearch} from "@/app/search/actions";

type SearchParams={q?:string;type?:string;visibility?:string;saved?:string;error?:string};

export default async function SearchPage({searchParams}:{searchParams:Promise<SearchParams>}){
 const params=await searchParams;
 const query=String(params.q||"").trim();
 const type=String(params.type||"all");
 const visibility=String(params.visibility||"all");
 const supabase:any=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 const like="%"+query.replace(/[%_]/g,"\\$&")+"%";
 const [{data:decks},{data:cards},{data:tags},{data:collections},{data:profiles},{data:savedSearches}]=await Promise.all([
  query&&type!=="cards"?supabase.from("decks").select("id,name,description,visibility,workspace_id").or("name.ilike."+like+",description.ilike."+like).limit(30):Promise.resolve({data:[]}),
  query&&user&&type!=="decks"?supabase.from("cards").select("id,deck_id,kind,content").or("content->>front.ilike."+like+",content->>back.ilike."+like).limit(50):Promise.resolve({data:[]}),
  query&&user&&type!=="decks"?supabase.from("tags").select("id,name,workspace_id").ilike("name",like).limit(30):Promise.resolve({data:[]}),
  query&&user&&type!=="decks"?supabase.from("collections").select("id,name,kind").ilike("name",like).limit(30):Promise.resolve({data:[]}),
  query&&type!=="decks"?supabase.from("profiles").select("id,username,display_name,bio").or("username.ilike."+like+",display_name.ilike."+like+",bio.ilike."+like).limit(30):Promise.resolve({data:[]}),
  user?supabase.from("saved_searches").select("id,name,query,filters,created_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(20):Promise.resolve({data:[]})
 ]);
 const visibleDecks=(decks??[]).filter((deck:any)=>visibility==="all"||String(deck.visibility)===visibility);

 return <AppShell><div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
  <div><p className="text-sm text-slate-400">Global search</p><h1 className="mt-1 text-3xl font-semibold">{query?"Results for “"+query+"”":"Search"}</h1><p className="mt-2 text-sm text-slate-500">Search decks, cards, tags, collections and creators from one place.</p></div>
  <form className="mt-6 grid gap-2 rounded-2xl border border-black/[0.06] bg-white p-4 sm:grid-cols-3"><input name="q" defaultValue={query} placeholder="Search..." className="h-10 rounded-xl border border-slate-200 px-3 text-sm"/><select name="type" defaultValue={type} className="h-10 rounded-xl border border-slate-200 px-3 text-sm"><option value="all">All content</option><option value="decks">Decks</option><option value="cards">Cards</option><option value="tags">Tags</option><option value="collections">Collections</option><option value="creators">Creators</option></select><select name="visibility" defaultValue={visibility} className="h-10 rounded-xl border border-slate-200 px-3 text-sm"><option value="all">All visible decks</option><option value="public">Public decks</option><option value="workspace">Workspace decks</option><option value="private">Private decks</option></select><button className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white sm:col-span-3">Search</button></form>
  {params.error?<div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{params.error}</div>:null}
  {query&&user?<div className="mt-4 rounded-2xl border border-black/[0.06] bg-white p-4"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold">Save this search</p><span className="text-xs text-slate-400">Recent saved searches are kept here.</span></div><form action={saveSearch} className="mt-3 flex flex-col gap-2 sm:flex-row"><input name="name" required placeholder="Search name" className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm"/><input type="hidden" name="query" value={query}/><input type="hidden" name="filters" value={JSON.stringify({type,visibility})}/><button className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Save</button></form><div className="mt-4 flex flex-wrap gap-2">{(savedSearches??[]).map((search:any)=><div key={search.id} className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5"><a href={"/search?q="+encodeURIComponent(search.query)} className="max-w-48 truncate text-xs font-medium">{search.name}</a><form action={deleteSearch.bind(null,search.id)}><button className="text-[10px] font-semibold text-red-600">Delete</button></form></div>)}</div></div>:null}
  {query?<div className="mt-8 grid gap-5 lg:grid-cols-2"><ResultSection title="Decks" items={visibleDecks.map((x:any)=>({key:x.id,title:x.name,meta:x.visibility,href:"/decks/"+x.id,body:x.description}))}/><ResultSection title="Cards" items={(cards??[]).map((x:any)=>({key:x.id,title:x.content?.front||"Untitled card",meta:x.kind,href:"/decks/"+x.deck_id,body:x.content?.back||""}))}/><ResultSection title="Tags" items={(tags??[]).map((x:any)=>({key:x.id,title:x.name,meta:"tag",href:"/search?q="+encodeURIComponent(x.name)}))}/><ResultSection title="Collections" items={(collections??[]).map((x:any)=>({key:x.id,title:x.name,meta:x.kind,href:"/collections/"+x.id}))}/><ResultSection title="Creators" items={(profiles??[]).map((x:any)=>({key:x.id,title:x.display_name||x.username||"Creator",meta:x.username?"@"+x.username:"creator",href:x.username?"/u/"+x.username:"/settings/profile",body:x.bio||""}))}/></div>:<div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">Press Cmd/Ctrl + K from the top bar or enter a query above.</div>}
 </div></AppShell>;
}
function ResultSection({title,items}:{title:string;items:{key:string;title:string;meta:string;href:string;body?:string}[]}){return <section className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white"><div className="border-b border-black/[0.05] px-5 py-4"><h2 className="text-sm font-semibold">{title}</h2></div><div>{items.length?items.map((item,index)=><Link href={item.href} key={item.key} className={"block px-5 py-4 hover:bg-slate-50 "+(index?"border-t border-black/[0.05]":"")}><div className="flex items-center justify-between gap-3"><p className="truncate text-sm font-medium">{item.title}</p><span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">{item.meta}</span></div>{item.body?<p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{item.body}</p>:null}</Link>):<div className="px-5 py-8 text-center text-xs text-slate-400">No results.</div>}</div></section>}
