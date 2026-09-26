import Link from "next/link";
import {AppShell} from "@/components/app-shell";
import {createClient} from "@/lib/supabase/server";
import {createBackupVersion,deleteBackupVersion,restoreBackupVersion,updateBackupSchedule} from "@/app/export/actions";
import {summarizeBackupPayload} from "@/lib/backup/summary";
import {createHash} from "node:crypto";

export default async function ExportPage({searchParams}:{searchParams?:Promise<{error?:string;backup?:string;restored?:string;preview?:string}>}){
 const params=searchParams?await searchParams:{};
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 const {data:versions}=user?await supabase.from("backup_versions").select("id,storage_path,size_bytes,checksum,created_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(30):{data:[]};
 const {data:schedule}=user?await supabase.from("backup_schedules").select("frequency,enabled,next_run_at,last_run_at,last_error").eq("user_id",user.id).maybeSingle():{data:null};

 let preview:null|{id:string;checksumVerified:boolean;summary:ReturnType<typeof summarizeBackupPayload>;conflictNames:string[]}=null;
 let previewError="";
 if(user&&params.preview){
  const {data:version}=await supabase.from("backup_versions").select("id,storage_path,checksum").eq("id",params.preview).eq("user_id",user.id).maybeSingle();
  if(!version)previewError="Backup version not found.";else{
   const {data:file,error:downloadError}=await supabase.storage.from("user-media").download(version.storage_path);
   if(downloadError||!file)previewError=downloadError?.message||"Backup download failed.";else{
    try{
     const bytes=new Uint8Array(await file.arrayBuffer());
     const checksum=createHash("sha256").update(bytes).digest("hex");
     if(version.checksum&&version.checksum!==checksum)throw new Error("Backup integrity check failed.");
     const payload=JSON.parse(new TextDecoder().decode(bytes));
     if(payload?.format!=="shyraq-backup-v2")throw new Error("Unsupported Shyraq backup format.");
     const summary=summarizeBackupPayload(payload);
     const names:string[]=[];
     for(const deck of Array.isArray(payload.decks)?payload.decks:[]){
      const name=typeof deck==="object"&&deck?String((deck as {name?:unknown}).name||""):"";
      if(name&&!names.includes(name))names.push(name);
     }
     const {data:workspace}=await supabase.from("workspaces").select("id").eq("owner_id",user.id).eq("kind","personal").limit(1).maybeSingle();
     if(!workspace)throw new Error("Personal workspace not found.");
     const {data:existingDecks}=names.length?await supabase.from("decks").select("name").eq("owner_id",user.id).eq("workspace_id",workspace.id).in("name",names):{data:[]};
     const existingNames=new Set((existingDecks??[]).map((deck:any)=>String(deck.name||"")));
     preview={id:version.id,checksumVerified:Boolean(version.checksum),summary,conflictNames:names.filter(name=>existingNames.has(name))};
    }catch(error){previewError=error instanceof Error?error.message:"Unable to prepare backup preview.";}
   }
  }
 }
 return <AppShell><div className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
  <p className="text-sm text-slate-400">Data</p><h1 className="mt-1 text-3xl font-semibold">Import & export</h1><p className="mt-2 text-sm text-slate-500">Keep your learning data portable and independent from Shyraq.</p>
  {params.error?<div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{params.error}</div>:null}
  {params.restored?<div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">Backup restored. {params.restored} cards were restored.</div>:null}
  {params.backup==="created"?<div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">Backup version created successfully.</div>:null}

  {params.preview?<section className="mt-8 rounded-2xl border border-slate-200 bg-white">
   <div className="flex items-center justify-between gap-4 border-b border-black/[0.06] p-5"><div><h2 className="font-semibold">Restore preview</h2><p className="mt-1 text-sm text-slate-400">Review the snapshot before writing anything to your workspace.</p></div><Link href="/export" className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold">Back to history</Link></div>
   {previewError?<div className="p-5 text-sm text-red-700">{previewError}</div>:preview?<div className="space-y-6 p-5">
    <div className="flex flex-wrap items-center gap-2 text-xs"><span className="rounded-full bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-700">{preview.checksumVerified?"Checksum verified":"No checksum recorded"}</span><span className="rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-slate-600">{preview.summary.exportedAt?new Date(preview.summary.exportedAt).toLocaleString():"Backup snapshot"}</span></div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Decks",preview.summary.decks],["Cards",preview.summary.cards],["Templates",preview.summary.templates],["Tags",preview.summary.tags],["Collections",preview.summary.collections],["Review states",preview.summary.reviewStates],["Review events",preview.summary.reviewEvents],["Media",preview.summary.media]].map(([label,value])=><div key={String(label)} className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-400">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p></div>)}</div>
    <div className="grid gap-4 sm:grid-cols-2">
     <div className="rounded-xl border border-slate-200 p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Additional data</p><p className="mt-3 text-sm text-slate-600">Card-tag links: {preview.summary.cardTags} · Collection-card links: {preview.summary.collectionCards}</p><p className="mt-1 text-sm text-slate-600">Deck copies: {preview.summary.deckCopies} · Public follows: {preview.summary.publicDeckFollows}</p><p className="mt-1 text-sm text-slate-600">Review preferences: {preview.summary.hasReviewPreferences?"included":"not included"}</p></div>
     <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">Name conflicts</p><p className="mt-2 text-sm text-amber-900">{preview.conflictNames.length?`${preview.conflictNames.length} deck name${preview.conflictNames.length===1?"":"s"} already exist. Restore currently uses duplicate mode, so those decks will be created as additional copies.`:"No existing deck names conflict with this snapshot."}</p>{preview.conflictNames.length?<p className="mt-2 text-xs text-amber-800">{preview.conflictNames.slice(0,8).join(", ")}{preview.conflictNames.length>8?" …":""}</p>:null}</div>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"><p className="text-sm text-slate-600">The preview is read-only. The restore action will create the snapshot records after you confirm.</p><form action={restoreBackupVersion.bind(null,preview.id)}><button className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Restore this snapshot</button></form></div>
   </div>:null}
  </section>:null}
  <div className="mt-8 grid gap-4 sm:grid-cols-2">
   <a href="/api/export/backup" className="rounded-2xl border border-black/[0.06] bg-white p-6 hover:bg-slate-50"><h2 className="font-semibold">Complete backup ZIP</h2><p className="mt-2 text-sm text-slate-500">Full JSON backup plus private media binaries.</p></a>
   <a href="/api/export/json" className="rounded-2xl border border-black/[0.06] bg-white p-6 hover:bg-slate-50"><h2 className="font-semibold">Backup JSON</h2><p className="mt-2 text-sm text-slate-500">Database data including review state and portability metadata.</p></a>
   <a href="/api/export/csv" className="rounded-2xl border border-black/[0.06] bg-white p-6 hover:bg-slate-50"><h2 className="font-semibold">Cards CSV</h2><p className="mt-2 text-sm text-slate-500">Front/back format for spreadsheets and simple migrations.</p></a>
   <form action={createBackupVersion} className="rounded-2xl border border-black/[0.06] bg-white p-6"><h2 className="font-semibold">Create backup version</h2><p className="mt-2 text-sm text-slate-500">Store an integrity-checked JSON snapshot in your private Storage.</p><button className="mt-5 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Create snapshot</button></form><form action={updateBackupSchedule} className="rounded-2xl border border-black/[0.06] bg-white p-6"><h2 className="font-semibold">Automatic backups</h2><p className="mt-2 text-sm text-slate-500">Run a private JSON snapshot automatically. The deployed cron uses the server-only Supabase service key.</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><select name="frequency" defaultValue={schedule?.frequency||"weekly"} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select><label className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm"><input name="enabled" type="checkbox" defaultChecked={schedule?.enabled===true} className="h-4 w-4"/>Enable schedule</label></div><p className="mt-3 text-xs text-slate-400">{schedule?.enabled&&schedule?.next_run_at?"Next run: "+new Date(schedule.next_run_at).toLocaleString():"Automatic backup is disabled."}{schedule?.last_error?" · Last error: "+schedule.last_error:""}</p><button className="mt-4 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Save schedule</button></form>
  </div>
  <section className="mt-8 rounded-2xl border border-black/[0.06] bg-white">
   <div className="border-b border-black/[0.06] p-5"><h2 className="font-semibold">Backup history</h2><p className="mt-1 text-sm text-slate-400">Private snapshots are versioned and checksum-protected.</p></div>
   {(versions??[]).length?<div className="divide-y divide-slate-100">{(versions??[]).map((version:any)=><div key={version.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold">{new Date(version.created_at).toLocaleString()}</p><p className="mt-1 text-xs text-slate-400">{Math.round(Number(version.size_bytes||0)/1024)} KB · SHA-256 {String(version.checksum||"").slice(0,16)}…</p></div><div className="flex flex-wrap gap-2"><a href={"/api/backup/versions/"+version.id} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold">Download</a><Link href={"/export?preview="+version.id} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white">Preview & restore</Link><form action={deleteBackupVersion.bind(null,version.id)}><button className="rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">Delete</button></form></div></div>)}</div>:<div className="p-8 text-center text-sm text-slate-400">No stored backup versions yet.</div>}
  </section>
  <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">Media files remain private in Storage. ZIP backups include media up to the endpoint safety limit; JSON snapshots preserve database data and integrity metadata.</div>
  <div className="mt-6 flex flex-wrap gap-2"><Link href="/import" className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Import JSON / CSV</Link><Link href="/import/anki" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold">Import Anki .apkg</Link></div>
 </div></AppShell>;
}
