import Link from "next/link";
import {notFound} from "next/navigation";
import {AppShell} from "@/components/app-shell";
import {createClient} from "@/lib/supabase/server";
import {getEffectiveDeckRole} from "@/lib/workspace/deck-permissions";
import {removeDeckMemberRole,setDeckMemberRole} from "@/app/decks/[id]/permissions/actions";

export default async function DeckPermissionsPage({params,searchParams}:{params:Promise<{id:string}>;searchParams?:Promise<{error?:string;saved?:string}>}){
 const {id}=await params;const query=searchParams?await searchParams:{};
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();if(!user)return null;
 const {data:deck}=await supabase.from("decks").select("id,name,workspace_id,owner_id").eq("id",id).maybeSingle();
 if(!deck)notFound();
 const permission=await getEffectiveDeckRole(id);
 const workspaceRole=String(permission.workspaceRole);
 if(!["owner","admin"].includes(workspaceRole))return <AppShell><div className="mx-auto max-w-3xl px-5 py-10">Only workspace owners/admins can manage deck-specific permissions.</div></AppShell>;
 const [{data:members},{data:workspaceMembers}]=await Promise.all([
  supabase.from("deck_members").select("user_id,role,created_at").eq("deck_id",id).order("created_at"),
  supabase.from("workspace_members").select("user_id,role").eq("workspace_id",deck.workspace_id)
 ]);
 const ids=(members??[]).map((m:any)=>m.user_id);
 const {data:profiles}=ids.length?await supabase.from("profiles").select("id,username,display_name,avatar_url").in("id",ids):{data:[]};
 const profileMap=new Map((profiles??[]).map((p:any)=>[p.id,p]));
 const workspaceMap=new Map((workspaceMembers??[]).map((m:any)=>[m.user_id,m.role]));
 return <AppShell><div className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
  <Link href={"/decks/"+id+"/settings"} className="text-sm text-slate-400">← Deck settings</Link>
  <h1 className="mt-5 text-3xl font-semibold tracking-tight">Deck permissions</h1>
  <p className="mt-2 text-sm text-slate-500">Override the workspace role for this deck. Users without an override inherit their workspace role.</p>
  {query.error?<div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{query.error}</div>:null}
  {query.saved?<div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">Deck permission saved.</div>:null}
  <form action={setDeckMemberRole.bind(null,id)} className="mt-7 grid gap-3 rounded-2xl border border-black/[0.06] bg-white p-5 sm:grid-cols-[1fr_180px_auto]"><input name="username" required placeholder="@username" className="h-11 rounded-xl border border-slate-200 px-3 text-sm"/><select name="role" className="h-11 rounded-xl border border-slate-200 px-3 text-sm"><option value="viewer">Viewer</option><option value="commenter">Commenter</option><option value="editor">Editor</option></select><button className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Set permission</button></form>

  <section className="mt-6 overflow-hidden rounded-2xl border border-black/[0.06] bg-white"><div className="border-b border-black/[0.05] px-5 py-4"><h2 className="font-semibold">Overrides</h2><p className="mt-1 text-xs text-slate-400">{members?.length??0} explicit deck permissions.</p></div>{(members??[]).map((member:any)=>{const profile=profileMap.get(member.user_id);return <div key={member.user_id} className="flex flex-col gap-3 border-b border-black/[0.05] p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3">{profile?.avatar_url?<img src={profile.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover"/>:<div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold">{String(profile?.display_name||profile?.username||"U").slice(0,1).toUpperCase()}</div>}<div><p className="text-sm font-medium">{profile?.display_name||profile?.username||member.user_id.slice(0,8)+"…"}</p><p className="mt-1 text-xs text-slate-400">@{profile?.username||"member"} · workspace role {workspaceMap.get(member.user_id)||"member"}</p></div></div><div className="flex items-center gap-2"><span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold capitalize">{member.role}</span><form action={removeDeckMemberRole.bind(null,id,member.user_id)}><button className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600">Reset to workspace role</button></form></div></div>})}{!(members??[]).length?<div className="p-10 text-center text-sm text-slate-400">No overrides yet.</div>:null}</section>
 </div></AppShell>;
}
