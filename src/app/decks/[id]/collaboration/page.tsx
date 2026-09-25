import Link from "next/link";
import {notFound} from "next/navigation";
import {AppShell} from "@/components/app-shell";
import {createClient} from "@/lib/supabase/server";
import {CollaborationRealtime} from "@/components/collaboration-realtime";
import {createComment,createDeckVersion,deleteComment,restoreDeckVersion,setCommentResolved} from "@/app/decks/[id]/collaboration/actions";

export default async function CollaborationPage({params,searchParams}:{params:Promise<{id:string}>;searchParams?:Promise<{error?:string;saved?:string}>}){
 const {id}=await params;const query=searchParams?await searchParams:{};
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return <AppShell><div className="mx-auto max-w-4xl px-5 py-10">Sign in to collaborate.</div></AppShell>;
 const {data:deck}=await supabase.from("decks").select("id,name,description,workspace_id,owner_id").eq("id",id).maybeSingle();
 if(!deck)notFound();
 const {data:membership}=await supabase.from("workspace_members").select("role").eq("workspace_id",deck.workspace_id).eq("user_id",user.id).maybeSingle();
 if(!membership)return <AppShell><div className="mx-auto max-w-4xl px-5 py-10">You do not have workspace access.</div></AppShell>;
 const canEdit=["owner","admin","editor"].includes(String(membership.role||""));
 const [{data:comments},{data:activities},{data:versions}]=await Promise.all([
  supabase.from("comments").select("id,card_id,parent_id,author_id,body,resolved,created_at,updated_at").eq("deck_id",id).order("created_at",{ascending:false}).limit(200),
  supabase.from("activity_feed").select("id,actor_id,event_type,entity_type,entity_id,metadata,created_at").eq("workspace_id",deck.workspace_id).order("created_at",{ascending:false}).limit(100),
  supabase.from("deck_versions").select("id,version_number,label,reason,created_by,created_at").eq("deck_id",id).order("version_number",{ascending:false}).limit(50)
 ]);
 const authorIds=[...new Set([...(comments??[]).map((c:any)=>c.author_id),...(activities??[]).map((a:any)=>a.actor_id),...(versions??[]).map((v:any)=>v.created_by)])];
 const {data:profiles}=authorIds.length?await supabase.from("profiles").select("id,username,display_name").in("id",authorIds):{data:[]};
 const profileMap=new Map((profiles??[]).map((p:any)=>[p.id,p]));
 const cardMap=new Map((deck.cards??[]).map((c:any)=>[c.id,c]));

 return <AppShell><CollaborationRealtime deckId={id} workspaceId={deck.workspace_id}/><div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
  <Link href={"/decks/"+id} className="text-sm text-slate-400">← Deck</Link>
  <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm text-slate-400">Collaboration</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">{deck.name}</h1><p className="mt-2 text-sm text-slate-500">Comments, mentions, activity and recoverable deck snapshots.</p></div><Link href={"/decks/"+id+"/settings"} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold">Deck settings</Link></div>
  {query.error?<div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{query.error}</div>:null}
  {query.saved?<div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{query.saved==="version"?"Version snapshot created.":query.saved==="restore"?"Snapshot restored to the deck.":"Saved."}</div>:null}

  <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
   <section className="rounded-2xl border border-black/[0.06] bg-white p-6"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Comments</h2><p className="mt-1 text-xs text-slate-400">{comments?.length??0} comments · use @username for mentions</p></div></div>
    {canEdit?<form action={createComment.bind(null,id)} className="mt-5 rounded-xl bg-slate-50 p-4"><textarea name="body" required maxLength={4000} placeholder="Write a comment or @mention a teammate…" className="min-h-28 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none"/><div className="mt-3 flex justify-end"><button className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Comment</button></div></form>:null}
    <div className="mt-5 space-y-3">{(comments??[]).map((comment:any)=>{const author=profileMap.get(comment.author_id);const card=cardMap.get(comment.card_id);return <article key={comment.id} className={"rounded-xl border p-4 "+(comment.resolved?"border-emerald-200 bg-emerald-50/50":"border-slate-200 bg-white")}><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold">{author?.display_name||author?.username||"Member"} {author?.username?<span className="font-normal text-slate-400">@{author.username}</span>:null}</p><p className="mt-1 text-[11px] text-slate-400">{new Date(comment.created_at).toLocaleString()} {card?.content?.front?"· "+String(card.content.front).slice(0,80):""}</p></div>{comment.resolved?<span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-700">Resolved</span>:null}</div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{comment.body}</p>{canEdit?<div className="mt-3 flex flex-wrap gap-2">{<form action={setCommentResolved.bind(null,id,comment.id,!comment.resolved)}><button className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold">{comment.resolved?"Reopen":"Resolve"}</button></form>}{comment.author_id===user.id?<form action={deleteComment.bind(null,id,comment.id)}><button className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600">Delete</button></form>:null}</div>:null}</article>})}{!(comments??[]).length?<div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">No comments yet.</div>:null}</div>
   </section>

   <div className="space-y-6">
    <section className="rounded-2xl border border-black/[0.06] bg-white p-6"><div><h2 className="font-semibold">Version snapshots</h2><p className="mt-1 text-xs text-slate-400">Save recoverable deck states before major edits.</p></div>{canEdit?<form action={createDeckVersion.bind(null,id)} className="mt-4 grid gap-2"><input name="label" placeholder="Snapshot label" className="h-10 rounded-xl border border-slate-200 px-3 text-sm"/><input name="reason" placeholder="Reason (optional)" className="h-10 rounded-xl border border-slate-200 px-3 text-sm"/><button className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Create snapshot</button></form>:null}<div className="mt-5 space-y-2">{(versions??[]).map((version:any)=><div key={version.id} className="rounded-xl bg-slate-50 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">v{version.version_number} · {version.label}</p><p className="mt-1 text-xs text-slate-400">{new Date(version.created_at).toLocaleString()} · {profileMap.get(version.created_by)?.display_name||"Member"}</p>{version.reason?<p className="mt-2 text-xs text-slate-500">{version.reason}</p>:null}</div>{canEdit?<form action={restoreDeckVersion.bind(null,id,version.id)}><button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold">Restore</button></form>:null}</div></div>)}{!(versions??[]).length?<p className="mt-4 text-sm text-slate-400">No snapshots yet.</p>:null}</div></section>

    <section className="rounded-2xl border border-black/[0.06] bg-white p-6"><h2 className="font-semibold">Activity feed</h2><div className="mt-4 space-y-2">{(activities??[]).map((entry:any)=><div key={entry.id} className="rounded-xl bg-slate-50 p-3 text-xs"><p><span className="font-semibold">{profileMap.get(entry.actor_id)?.display_name||"Member"}</span> · {entry.event_type.replaceAll("."," ")}</p><p className="mt-1 text-slate-400">{new Date(entry.created_at).toLocaleString()}</p></div>)}{!(activities??[]).length?<p className="text-sm text-slate-400">No activity yet.</p>:null}</div></section>
   </div>
  </div>
 </div></AppShell>;
}
