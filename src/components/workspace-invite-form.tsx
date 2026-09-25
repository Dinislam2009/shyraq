"use client";
import {useState} from "react";
import {createWorkspaceInvite} from "@/app/settings/workspace/actions";

export function WorkspaceInviteForm({workspaceId}:{workspaceId:string}){
 const [email,setEmail]=useState(""); const [role,setRole]=useState("reviewer"); const [link,setLink]=useState(""); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
 async function submit(formData:FormData){formData.set("workspace_id",workspaceId);setBusy(true);setError("");setLink("");const result=await createWorkspaceInvite(formData);if(result?.error)setError(result.error);if(result?.link)setLink(window.location.origin+result.link);setBusy(false);}
 return <form action={submit} className="mt-8 rounded-2xl border border-black/[0.06] bg-white p-6">
  <h2 className="font-semibold">Create invite link</h2>
  <div className="mt-4 grid gap-4 md:grid-cols-3"><input name="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Optional email restriction" className="h-11 rounded-xl border border-slate-200 px-3 text-sm md:col-span-2"/><select name="role" value={role} onChange={e=>setRole(e.target.value)} className="h-11 rounded-xl border border-slate-200 px-3 text-sm"><option value="reviewer">Reviewer</option><option value="viewer">Viewer</option><option value="editor">Editor</option><option value="admin">Admin</option></select></div>
  <button disabled={busy} className="mt-4 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy?"Creating…":"Create invite"}</button>
  {error&&<p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
  {link&&<div className="mt-4 rounded-xl bg-slate-50 p-3"><p className="text-xs font-medium text-slate-500">Invite link</p><input readOnly value={link} className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs"/><button type="button" onClick={()=>navigator.clipboard?.writeText(link)} className="mt-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold">Copy link</button></div>}
 </form>;
}