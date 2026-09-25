import {AppShell} from "@/components/app-shell";
import {createClient} from "@/lib/supabase/server";
import {WorkspaceInviteForm} from "@/components/workspace-invite-form";
import {createTeamWorkspace,updateMemberRole,removeMember} from "@/app/settings/workspace/actions";

export default async function WorkspacePage({searchParams}:{searchParams:Promise<{workspace?:string}>}){
 const {workspace:workspaceParam}=await searchParams;
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return null;
 const {data:workspaces}=await supabase.from("workspaces").select("id,name,kind,description,owner_id").order("kind").order("created_at");
 const workspaceList=workspaces??[];
 const selected=workspaceList.find(w=>w.id===workspaceParam)??workspaceList.find(w=>w.kind==="team")??workspaceList.find(w=>w.kind==="personal");
 if(!selected)return <AppShell><div className="mx-auto max-w-4xl px-5 py-10">No workspace found.</div></AppShell>;
 const {data:members}=await supabase.from("workspace_members").select("user_id,role,created_at").eq("workspace_id",selected.id).order("created_at");
 const myMember=(members??[]).find(m=>m.user_id===user.id);
 return <AppShell><div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
  <p className="text-sm text-slate-400">Workspace</p>
  <h1 className="mt-1 text-3xl font-semibold tracking-tight">Workspaces & collaboration</h1>
  <p className="mt-2 text-sm text-slate-500">Personal and team workspaces share the same Shyraq feature set.</p>

  <div className="mt-8 grid gap-4 md:grid-cols-2">
   {workspaceList.map((w:any)=><a key={w.id} href={"/settings/workspace?workspace="+encodeURIComponent(w.id)} className={"rounded-2xl border p-5 "+(w.id===selected.id?"border-slate-900 bg-white":"border-black/[0.06] bg-white")}><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{w.kind}</p><h2 className="mt-2 font-semibold">{w.name}</h2><p className="mt-1 text-sm text-slate-500">{w.description||"No description"}</p></a>)}
  </div>

  <form action={createTeamWorkspace} className="mt-6 rounded-2xl border border-black/[0.06] bg-white p-6">
   <h2 className="font-semibold">Create team workspace</h2>
   <div className="mt-4 grid gap-4 md:grid-cols-3"><input required name="name" placeholder="Team name" className="h-11 rounded-xl border border-slate-200 px-3 text-sm"/><input name="slug" placeholder="team-slug" className="h-11 rounded-xl border border-slate-200 px-3 text-sm"/><input name="description" placeholder="What is this team for?" className="h-11 rounded-xl border border-slate-200 px-3 text-sm"/></div>
   <button className="mt-4 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Create team</button>
  </form>

  <WorkspaceInviteForm workspaceId={selected.id}/>

  <div className="mt-6 rounded-2xl border border-black/[0.06] bg-white p-6">
   <div className="flex items-center justify-between"><div><h2 className="font-semibold">{selected.name} members</h2><p className="mt-1 text-xs text-slate-400">Your role: {myMember?.role??"member"}</p></div></div>
   <div className="mt-5 space-y-3">{(members??[]).map((m:any)=><div key={m.user_id} className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium">{m.user_id.slice(0,8)}…</p><p className="mt-1 text-xs text-slate-400">{m.created_at?new Date(m.created_at).toLocaleDateString():""}</p></div><div className="flex items-center gap-2">{m.user_id===selected.owner_id?<span className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white">Owner</span>:<><form action={updateMemberRole.bind(null,selected.id,m.user_id,"editor")}><button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold">Editor</button></form><form action={updateMemberRole.bind(null,selected.id,m.user_id,"reviewer")}><button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold">Reviewer</button></form><form action={updateMemberRole.bind(null,selected.id,m.user_id,"viewer")}><button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold">Viewer</button></form><form action={removeMember.bind(null,selected.id,m.user_id)}><button className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600">Remove</button></form></>}</div></div>)}</div>
  </div>
 </div></AppShell>;
}