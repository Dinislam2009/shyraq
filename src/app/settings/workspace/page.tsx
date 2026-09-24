import {AppShell} from "@/components/app-shell";
import {createClient} from "@/lib/supabase/server";
import {createWorkspaceInvite} from "@/app/settings/workspace/actions";

export default async function WorkspacePage(){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return null;
 const {data:workspace}=await supabase.from("workspaces").select("id,name,description").eq("owner_id",user.id).eq("kind","personal").limit(1).maybeSingle();
 if(!workspace)return <AppShell><div className="mx-auto max-w-3xl px-5 py-10">Workspace not found.</div></AppShell>;
 const {data:members}=await supabase.from("workspace_members").select("user_id,role,created_at").eq("workspace_id",workspace.id);
 return <AppShell><div className="mx-auto max-w-4xl px-5 py-8 sm:px-8"><p className="text-sm text-slate-400">Workspace</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">{workspace.name}</h1><p className="mt-2 text-sm text-slate-500">Granular collaboration without requiring an email service.</p>
  <form action={createWorkspaceInvite} className="mt-8 rounded-2xl border border-black/[0.06] bg-white p-6"><h2 className="font-semibold">Create invite link</h2><div className="mt-4 grid gap-4 md:grid-cols-3"><input name="email" type="email" placeholder="Optional email restriction" className="h-11 rounded-xl border border-slate-200 px-3 text-sm md:col-span-2"/><select name="role" className="h-11 rounded-xl border border-slate-200 px-3 text-sm"><option value="reviewer">Reviewer</option><option value="viewer">Viewer</option><option value="editor">Editor</option><option value="admin">Admin</option></select></div><button className="mt-4 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Create invite</button></form>
  <div className="mt-6 rounded-2xl border border-black/[0.06] bg-white p-6"><h2 className="font-semibold">Members</h2><div className="mt-4 space-y-3">{(members??[]).map((m:any)=><div key={m.user_id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><span className="text-sm font-medium">{m.user_id.slice(0,8)}…</span><span className="text-xs font-semibold uppercase text-slate-400">{m.role}</span></div>)}</div></div>
 </div></AppShell>;
}