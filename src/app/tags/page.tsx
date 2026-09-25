import {AppShell} from "@/components/app-shell";
import {createClient} from "@/lib/supabase/server";
import {createTag,deleteTag,mergeTag,moveTag,renameTag} from "@/app/tags/actions";

export default async function TagsPage({searchParams}:{searchParams?:Promise<{error?:string}>}){
 const params=searchParams?await searchParams:{};
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return null;
 const {data:ws}=await supabase.from("workspaces").select("id").eq("owner_id",user.id).eq("kind","personal").limit(1).maybeSingle();if(!ws)return null;
 const [{data:tags},{data:links}]=await Promise.all([
  supabase.from("tags").select("id,name,parent_id").eq("workspace_id",ws.id).order("name"),
  supabase.from("card_tags").select("tag_id,card_id")
 ]);
 const counts=new Map<string,number>();for(const link of links??[])counts.set(String(link.tag_id),(counts.get(String(link.tag_id))||0)+1);
 const parents=(tags??[]).filter((tag:any)=>!tag.parent_id);
 return <AppShell><div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
  <div><p className="text-sm text-slate-400">Organization</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Tag manager</h1><p className="mt-2 text-sm text-slate-500">Rename, merge, delete and organize tags globally across your cards.</p></div>
  {params.error?<div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{params.error}</div>:null}
  <form action={createTag} className="mt-7 flex flex-wrap gap-2 rounded-2xl border border-black/[0.06] bg-white p-4"><input required name="name" placeholder="New tag" className="h-10 w-56 rounded-xl border border-slate-200 px-3 text-sm"/><select name="parent_id" className="h-10 rounded-xl border border-slate-200 px-3 text-sm"><option value="">No parent</option>{(tags??[]).map((tag:any)=><option key={tag.id} value={tag.id}>{tag.name}</option>)}</select><button className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Create tag</button></form>
  <div className="mt-6 grid gap-4">{parents.map((tag:any)=><TagNode key={tag.id} tag={tag} all={tags??[]} count={counts.get(tag.id)||0} counts={counts}/>)}</div>
  {!tags?.length?<div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">No tags yet. Tags will also be created automatically when you save cards.</div>:null}
 </div></AppShell>;
}
function TagNode({tag,all,count,counts}:{tag:any;all:any[];count:number;counts:Map<string,number>}){
 const children=all.filter(item=>item.parent_id===tag.id);
 return <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
  <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h2 className="font-semibold">{tag.name}</h2><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{count} cards</span></div>{children.length?<p className="mt-1 text-xs text-slate-400">{children.length} child tag(s)</p>:null}</div><div className="flex flex-wrap gap-2"><form action={renameTag.bind(null,tag.id)} className="flex gap-1"><input name="name" defaultValue={tag.name} className="h-9 w-36 rounded-lg border border-slate-200 px-2 text-xs"/><button className="rounded-lg border border-slate-200 px-2.5 text-xs font-semibold">Rename</button></form><form action={deleteTag.bind(null,tag.id)}><button className="rounded-lg border border-red-200 px-2.5 py-2 text-xs font-semibold text-red-700">Delete</button></form></div></div>
  <div className="mt-4 flex flex-wrap gap-2"><form action={moveTag.bind(null,tag.id)} className="flex gap-1"><select name="parent_id" defaultValue={tag.parent_id||""} className="h-9 rounded-lg border border-slate-200 px-2 text-xs"><option value="">No parent</option>{all.filter((item:any)=>item.id!==tag.id).map((item:any)=><option key={item.id} value={item.id}>{item.name}</option>)}</select><button className="rounded-lg border border-slate-200 px-2.5 text-xs font-semibold">Move</button></form><form action={mergeTag.bind(null,tag.id)} className="flex gap-1"><select name="target_id" className="h-9 rounded-lg border border-slate-200 px-2 text-xs"><option value="">Merge into…</option>{all.filter((item:any)=>item.id!==tag.id).map((item:any)=><option key={item.id} value={item.id}>{item.name}</option>)}</select><button className="rounded-lg border border-slate-200 px-2.5 text-xs font-semibold">Merge</button></form></div>
  {children.length?<div className="mt-4 space-y-2 border-l-2 border-slate-100 pl-4">{children.map(child=><div key={child.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"><span className="text-sm">{child.name}</span><span className="text-xs text-slate-400">{counts.get(child.id)||0} cards</span></div>)}</div>:null}
 </div>;
}
