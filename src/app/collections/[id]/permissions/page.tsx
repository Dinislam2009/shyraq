import Link from "next/link";
import {notFound} from "next/navigation";
import {AppShell} from "@/components/app-shell";
import {createClient} from "@/lib/supabase/server";
import {getEffectiveCollectionRole} from "@/lib/workspace/collection-permissions";
import {removeCollectionMemberRole,setCollectionMemberRole} from "@/app/collections/[id]/permissions/actions";

export default async function CollectionPermissionsPage({params,searchParams}:{params:Promise<{id:string}>;searchParams?:Promise<{error?:string;saved?:string}>}){
 const {id}=await params;const query=searchParams?await searchParams:{};
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();if(!user)return null;
 const {data:collection}=await supabase.from("collections").select("id,name,workspace_id,owner_id").eq("id",id).maybeSingle();if(!collection)notFound();
 const permission=await getEffectiveCollectionRole(id);
 if(!["owner","admin"].includes(String(permission.workspaceRole)))return <AppShell><div className="mx-auto max-w-3xl px-5 py-10">Only workspace owners/admins can manage collection permissions.</div></AppShell>;
 const {data:members}=await supabase.from("collection_members").select("user_id,role,created_at").eq("collection_id",id).order("created_at");
 const ids=(members??[]).map((m:any)=>m.user_id);
 const {data:profiles}=ids.length?await supabase.from("profiles").select("id,username,display_name").in("id",ids):{data:[]};
 const profileMap=new Map((profiles??[]).map((p:any)=>[p.id,p]));
 return <AppShell><div className="mx-auto max-w-4xl px-5 py-8 sm:px-8"><Link href={"/collections/"+id} className="text-sm text-slate-400">← Collection</Link><h1 className="mt-5 text-3xl font-semibold tracking-tight">Collection permissions</h1><p className="mt-2 text-sm text-slate-500">{collection.name} · users without an override inherit workspace access.</p>{query.error?<div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{query.error}</div>:null}{query.saved?<div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">Collection permission saved.</div>:null}<form action={setCollectionMemberRole.bind(null,id)} className="mt-7 grid gap-3 rounded-2xl border border-black/[0.06] bg-white p-5 sm:grid-cols-[1fr_180px_auto]"><input name="username" required placeholder="@username" className="h-11 rounded-xl border border-slate-200 px-3 text-sm"/><select name="role" className="h-11 rounded-xl border border-slate-200 px-3 text-sm"><option value="viewer">Viewer</option><option value="commenter">Commenter</option><option value="editor">Editor</option></select><button className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Set permission</button></form><section className="mt-6 overflow-hidden rounded-2xl border border-black/[0.06] bg-white"><div className="border-b border-black/[0.05] px-5 py-4"><h2 className="font-semibold">Overrides</h2></div>{(members??[]).map((member:any)=>{const p=profileMap.get(member.user_id);return <div key={member.user_id} className="flex items-center justify-between gap-3 border-b border-black/[0.05] p-5"><div><p className="text-sm font-medium">{p?.display_name||p?.username||member.user_id.slice(0,8)+"…"}</p><p className="mt-1 text-xs text-slate-400">@{p?.username||"member"}</p></div><div className="flex items-center gap-2"><span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold capitalize">{member.role}</span><form action={removeCollectionMemberRole.bind(null,id,member.user_id)}><button className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600">Reset</button></form></div></div>})}{!(members??[]).length?<div className="p-10 text-center text-sm text-slate-400">No overrides yet.</div>:null}</section></div></AppShell>;
}
