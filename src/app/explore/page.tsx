import Link from "next/link";
import {AppShell} from "@/components/app-shell";
import {createClient} from "@/lib/supabase/server";

type SearchParams={q?:string;category?:string;subject?:string;language?:string;difficulty?:string;sort?:string};

export default async function ExplorePage({searchParams}:{searchParams:Promise<SearchParams>}){
 const params=await searchParams;
 const query=String(params.q||"").trim();
 const supabase=await createClient();
 let request=supabase.from("decks").select("id,name,description,updated_at,owner_id,settings,cards(count)").eq("visibility","public").order("updated_at",{ascending:false}).limit(100);
 if(query)request=request.or("name.ilike.%"+query+"%,description.ilike.%"+query+"%");
 const {data:rawDecks,error}=await request;
 const decks=(rawDecks??[]).filter((deck:any)=>{
  const settings=deck.settings||{};
  return (!params.category||String(settings.category||"")===params.category)&&(!params.subject||String(settings.subject||"")===params.subject)&&(!params.language||String(settings.language||"")===params.language)&&(!params.difficulty||String(settings.difficulty||"")===params.difficulty);
 });
 const ids=decks.map((deck:any)=>deck.id);
 const [{data:profiles},{data:followCounts}]=await Promise.all([
  [...new Set(decks.map((d:any)=>d.owner_id).filter(Boolean))].length?supabase.from("profiles").select("id,username,display_name").in("id",[...new Set(decks.map((d:any)=>d.owner_id).filter(Boolean))]):Promise.resolve({data:[]}),
  ids.length?supabase.from("public_deck_follow_counts").select("deck_id,follow_count").in("deck_id",ids):Promise.resolve({data:[]})
 ]);
 const counts=new Map((followCounts??[]).map((row:any)=>[row.deck_id,Number(row.follow_count||0)]));
 const profileById=new Map((profiles??[]).map((p:any)=>[p.id,p]));
 const score=(deck:any)=>{
  const text=(String(deck.name)+" "+String(deck.description||"")).toLowerCase();
  const q=query.toLowerCase();
  const followerCount=Number(counts.get(deck.id)||0); const cardCount=Number(deck.cards?.[0]?.count||0); return (q?(text===q?1000:(String(deck.name).toLowerCase()===q?800:(String(deck.name).toLowerCase().startsWith(q)?500:(text.includes(q)?200:0)))):0)+followerCount*10+cardCount;
 };
 const sort=String(params.sort||"recent");
 if(sort==="popular")decks.sort((a:any,b:any)=>(Number(counts.get(b.id)||0)-Number(counts.get(a.id)||0))||new Date(String(b.updated_at)).getTime()-new Date(String(a.updated_at)).getTime());
 else if(sort==="cards")decks.sort((a:any,b:any)=>(Number(b.cards?.[0]?.count||0)-Number(a.cards?.[0]?.count||0)));
 else if(query)decks.sort((a:any,b:any)=>score(b)-score(a));
 else decks.sort((a:any,b:any)=>new Date(String(b.updated_at)).getTime()-new Date(String(a.updated_at)).getTime());

 const values=(key:string)=>[...new Set((rawDecks??[]).map((deck:any)=>String((deck.settings||{})[key]||"")).filter(Boolean))].sort();
 const categories=values("category"),subjects=values("subject"),languages=values("language"),difficulties=values("difficulty");

 const base=new URLSearchParams();
 if(query)base.set("q",query);if(params.category)base.set("category",params.category);if(params.subject)base.set("subject",params.subject);if(params.language)base.set("language",params.language);if(params.difficulty)base.set("difficulty",params.difficulty);

 return <AppShell><div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><p className="text-sm text-slate-400">Community</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Public decks</h1><p className="mt-2 text-sm text-slate-500">Browse decks shared by Shyraq creators with practical metadata filters and relevance ranking.</p></div><Link href="/explore/following" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold">Following</Link></div>
  <form className="mt-6 grid gap-2 rounded-2xl border border-black/[0.06] bg-white p-4 sm:grid-cols-2 lg:grid-cols-6">
   <input name="q" defaultValue={query} placeholder="Search decks..." className="h-10 rounded-xl border border-slate-200 px-3 text-sm lg:col-span-2"/>
   <select name="category" defaultValue={params.category||""} className="h-10 rounded-xl border border-slate-200 px-3 text-sm"><option value="">All categories</option>{categories.map(x=><option key={x}>{x}</option>)}</select>
   <select name="subject" defaultValue={params.subject||""} className="h-10 rounded-xl border border-slate-200 px-3 text-sm"><option value="">All subjects</option>{subjects.map(x=><option key={x}>{x}</option>)}</select>
   <select name="language" defaultValue={params.language||""} className="h-10 rounded-xl border border-slate-200 px-3 text-sm"><option value="">All languages</option>{languages.map(x=><option key={x}>{x}</option>)}</select>
   <select name="difficulty" defaultValue={params.difficulty||""} className="h-10 rounded-xl border border-slate-200 px-3 text-sm"><option value="">All difficulties</option>{difficulties.map(x=><option key={x}>{x}</option>)}</select>
   <select name="sort" defaultValue={sort} className="h-10 rounded-xl border border-slate-200 px-3 text-sm"><option value="recent">Recent</option><option value="popular">Popular</option><option value="cards">Most cards</option></select>
   <button className="h-10 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white">Apply</button>
  </form>
  <section className="mt-8"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Community</p><h2 className="mt-1 text-xl font-semibold">Featured collections</h2></div><Link href="/collections" className="text-sm font-semibold text-slate-500">Manage collections</Link></div><div className="mt-4 grid gap-4 md:grid-cols-3">{(await supabase.from("collections").select("id,name,kind,owner_id,collection_cards(card_id)").eq("is_public",true).eq("is_featured",true).order("created_at",{ascending:false}).limit(6)).data?.map((collection:any)=><Link key={collection.id} href={"/collections/public/"+collection.id} className="rounded-2xl border border-black/[0.06] bg-white p-5 hover:shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{collection.kind}</p><h3 className="mt-2 font-semibold">{collection.name}</h3><p className="mt-2 text-sm text-slate-500">{collection.collection_cards?.length??0} cards</p></Link>)}</div></section><div className="mt-8 flex flex-wrap gap-2"><Link href="/explore" className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold">All</Link>{categories.slice(0,8).map(c=><Link key={c} href={"/explore?category="+encodeURIComponent(c)} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold">{c}</Link>)}</div>
  {error?<div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error.message}</div>:null}
  <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{decks.map((d:any)=>{const profile=profileById.get(d.owner_id);const settings=d.settings||{};return <Link href={"/explore/"+d.id} key={d.id} className="rounded-2xl border border-black/[0.06] bg-white p-6 hover:border-black/10 hover:shadow-sm"><div className="flex items-center justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold">S</div>{profile?.username?<span className="text-xs text-slate-400">@{profile.username}</span>:<span className="text-xs text-slate-400">{profile?.display_name||"Creator"}</span>}</div><h2 className="mt-5 font-semibold">{d.name}</h2><p className="mt-2 line-clamp-2 text-sm text-slate-500">{d.description||"No description"}</p><div className="mt-5 flex flex-wrap gap-1">{[settings.category,settings.subject,settings.language,settings.difficulty].filter(Boolean).map((value:any)=><span key={String(value)} className="rounded-md bg-slate-100 px-2 py-1 text-[10px] text-slate-500">{String(value)}</span>)}</div><div className="mt-5 flex items-center justify-between text-xs text-slate-400"><span>{d.cards?.[0]?.count??0} cards</span><span>{Number(counts.get(d.id)||0)} followers</span></div></Link>})}</div>
  {!decks.length?<div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No public decks match these filters.</div>:null}
 </div></AppShell>;
}
