import {AppShell} from "@/components/app-shell";
import {createClient} from "@/lib/supabase/server";
import {WorkspaceInviteForm} from "@/components/workspace-invite-form";
import {createTeamWorkspace,updateMemberRole,removeMember,updateWorkspaceSettings,selectWorkspace,cancelWorkspaceInvite} from "@/app/settings/workspace/actions";
import {WorkspaceRealtime} from "@/components/workspace-realtime";

export default async function WorkspacePage({searchParams}:{searchParams:Promise<{workspace?:string;member?:string;error?:string;saved?:string}>}){
 const {workspace:workspaceParam,member:memberQuery,error,saved}=await searchParams;
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return null;
 const {data:workspaces}=await supabase.from("workspaces").select("id,name,kind,description,owner_id,slug").order("kind").order("created_at");
 const workspaceList=workspaces??[];
 const {data:profile}=await supabase.from("profiles").select("selected_workspace_id").eq("id",user.id).maybeSingle();
 const selected=workspaceList.find(w=>w.id===workspaceParam)??workspaceList.find(w=>w.id===profile?.selected_workspace_id)??workspaceList.find(w=>w.kind==="team")??workspaceList.find(w=>w.kind==="personal");
 if(!selected)return <AppShell><div className="mx-auto max-w-4xl px-5 py-10">No workspace found.</div></AppShell>;
 const [{data:members},{data:invites},{data:audit}]=await Promise.all([supabase.from("workspace_members").select("user_id,role,created_at").eq("workspace_id",selected.id).order("created_at"),supabase.from("workspace_invitations").select("id,email,role,expires_at,created_at").eq("workspace_id",selected.id).is("accepted_at",null).order("created_at",{ascending:false}),supabase.from("workspace_audit_logs").select("id,actor_id,event_type,metadata,created_at").eq("workspace_id",selected.id).order("created_at",{ascending:false}).limit(30)]);
 const memberIds=(members??[]).map(m=>m.user_id).filter(Boolean);
 const {data:profiles}=memberIds.length?await supabase.from("profiles").select("id,username,display_name,avatar_url").in("id",memberIds):{data:[]};
 const profileMap=new Map((profiles??[]).map((profile:any)=>[profile.id,profile]));
 const myMember=(members??[]).find(m=>m.user_id===user.id);
 const canAdmin=["owner","admin"].includes(String(myMember?.role||""));
 const normalizedMemberQuery=String(memberQuery||"").trim().toLowerCase();
 const filteredMembers=(members??[]).filter((m:any)=>{
  if(!normalizedMemberQuery)return true;
  const profile=profileMap.get(m.user_id);
  const haystack=[m.user_id,profile?.username,profile?.display_name].filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(normalizedMemberQuery);
 });
 return <AppShell><WorkspaceRealtime workspaceId={selected.id}/><div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
  <p className="text-sm text-slate-400">Workspace</p>
  <h1 className="mt-1 text-3xl font-semibold tracking-tight">Workspaces & collaboration</h1>
  <p className="mt-2 text-sm text-slate-500">Personal and team workspaces share the same Shyraq feature set.</p>
  {error?<div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>:null}{saved?<div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">Workspace settings saved.</div>:null}

  <div className="mt-8 grid gap-4 md:grid-cols-2">
   {workspaceList.map((w:any)=><form action={selectWorkspace.bind(null,w.id)} key={w.id}><button className={"w-full rounded-2xl border p-5 text-left "+(w.id===selected.id?"border-slate-900 bg-white":"border-black/[0.06] bg-white")}><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{w.kind}</p><h2 className="mt-2 font-semibold">{w.name}</h2><p className="mt-1 text-sm text-slate-500">{w.description||"No description"}</p></button></form>)}
  </div>

  <form action={createTeamWorkspace} className="mt-6 rounded-2xl border border-black/[0.06] bg-white p-6">
   <h2 className="font-semibold">Create team workspace</h2>
   <div className="mt-4 grid gap-4 md:grid-cols-3"><input required name="name" placeholder="Team name" className="h-11 rounded-xl border border-slate-200 px-3 text-sm"/><input name="slug" placeholder="team-slug" className="h-11 rounded-xl border border-slate-200 px-3 text-sm"/><input name="description" placeholder="What is this team for?" className="h-11 rounded-xl border border-slate-200 px-3 text-sm"/></div>
   <button className="mt-4 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Create team</button>
  </form>

  <WorkspaceInviteForm workspaceId={selected.id}/>
  <section className="mt-6 rounded-2xl border border-black/[0.06] bg-white p-6"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Workspace settings</h2><p className="mt-1 text-xs text-slate-400">Your role: {myMember?.role??"member"}</p></div></div>{canAdmin?<form action={updateWorkspaceSettings.bind(null,selected.id)} className="mt-4 grid gap-3 md:grid-cols-3"><input name="name" defaultValue={selected.name} className="h-10 rounded-xl border border-slate-200 px-3 text-sm"/><input name="slug" defaultValue={selected.slug||""} className="h-10 rounded-xl border border-slate-200 px-3 text-sm"/><input name="description" defaultValue={selected.description||""} className="h-10 rounded-xl border border-slate-200 px-3 text-sm md:col-span-3"/><button className="md:col-span-3 justify-self-end rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Save workspace</button></form>:null}</section>
  {canAdmin?<section className="mt-6 rounded-2xl border border-black/[0.06] bg-white p-6"><h2 className="font-semibold">Pending invitations</h2><div className="mt-4 space-y-2">{(invites??[]).map((invite:any)=><div key={invite.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"><div><p className="text-sm font-medium">{invite.email||"Open invitation"} · {invite.role}</p><p className="text-xs text-slate-400">Expires {new Date(invite.expires_at).toLocaleString()}</p></div><form action={cancelWorkspaceInvite.bind(null,invite.id)}><button className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600">Revoke</button></form></div>)}{!(invites??[]).length?<p className="text-sm text-slate-400">No pending invitations.</p>:null}</div></section>:null}

  <div className="mt-6 rounded-2xl border border-black/[0.06] bg-white p-6">
   <div className="flex items-center justify-between"><div><h2 className="font-semibold">{selected.name} members</h2><p className="mt-1 text-xs text-slate-400">Your role: {myMember?.role??"member"}</p></div></div>
   <form className="mt-4 flex gap-2"><input name="member" defaultValue={memberQuery||""} placeholder="Search by name, username or user id" className="h-9 flex-1 rounded-lg border border-slate-200 px-3 text-xs"/><input type="hidden" name="workspace" value={selected.id}/><button className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold">Search</button></form><div className="mt-5 space-y-3">{filteredMembers.map((m:any)=>{const profile=profileMap.get(m.user_id);return <div key={m.user_id} className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium">{profile?.display_name||profile?.username||"Member"}</p><p className="mt-1 text-xs text-slate-400">{profile?.username?"@"+profile.username+" · ":""}{m.user_id.slice(0,8)}… · {m.created_at?new Date(m.created_at).toLocaleDateString():""}</p></div><div className="flex items-center gap-2">{m.user_id===selected.owner_id?<span className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white">Owner</span>:<><form action={updateMemberRole.bind(null,selected.id,m.user_id,"editor")}><button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold">Editor</button></form><form action={updateMemberRole.bind(null,selected.id,m.user_id,"reviewer")}><button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold">Reviewer</button></form><form action={updateMemberRole.bind(null,selected.id,m.user_id,"viewer")}><button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold">Viewer</button></form><form action={removeMember.bind(null,selected.id,m.user_id)}><button className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600">Remove</button></form></>}</div></div>)}</div>
  </div>
   <section className="mt-6 rounded-2xl border border-black/[0.06] bg-white p-6"><h2 className="font-semibold">Workspace audit log</h2><div className="mt-4 space-y-2">{(audit??[]).map((entry:any)=><div key={entry.id} className="rounded-xl bg-slate-50 p-3 text-xs"><span className="font-semibold">{entry.event_type}</span><span className="ml-2 text-slate-400">{new Date(entry.created_at).toLocaleString()}</span></div>)}{!(audit??[]).length?<p className="text-sm text-slate-400">No audit events yet.</p>:null}</div></section>
 </div></AppShell>;
}