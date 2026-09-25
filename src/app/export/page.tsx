import Link from "next/link";
import {AppShell} from "@/components/app-shell";
import {createClient} from "@/lib/supabase/server";
import {createBackupVersion,deleteBackupVersion,restoreBackupVersion} from "@/app/export/actions";

export default async function ExportPage({searchParams}:{searchParams?:Promise<{error?:string;backup?:string;restored?:string}>}){
 const params=searchParams?await searchParams:{};
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 const {data:versions}=user?await supabase.from("backup_versions").select("id,storage_path,size_bytes,checksum,created_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(30):{data:[]};
 return <AppShell><div className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
  <p className="text-sm text-slate-400">Data</p><h1 className="mt-1 text-3xl font-semibold">Import & export</h1><p className="mt-2 text-sm text-slate-500">Keep your learning data portable and independent from Shyraq.</p>
  {params.error?<div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{params.error}</div>:null}
  {params.restored?<div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">Backup restored. {params.restored} cards were restored.</div>:null}
  {params.backup==="created"?<div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">Backup version created successfully.</div>:null}
  <div className="mt-8 grid gap-4 sm:grid-cols-2">
   <a href="/api/export/backup" className="rounded-2xl border border-black/[0.06] bg-white p-6 hover:bg-slate-50"><h2 className="font-semibold">Complete backup ZIP</h2><p className="mt-2 text-sm text-slate-500">Full JSON backup plus private media binaries.</p></a>
   <a href="/api/export/json" className="rounded-2xl border border-black/[0.06] bg-white p-6 hover:bg-slate-50"><h2 className="font-semibold">Backup JSON</h2><p className="mt-2 text-sm text-slate-500">Database data including review state and portability metadata.</p></a>
   <a href="/api/export/csv" className="rounded-2xl border border-black/[0.06] bg-white p-6 hover:bg-slate-50"><h2 className="font-semibold">Cards CSV</h2><p className="mt-2 text-sm text-slate-500">Front/back format for spreadsheets and simple migrations.</p></a>
   <form action={createBackupVersion} className="rounded-2xl border border-black/[0.06] bg-white p-6"><h2 className="font-semibold">Create backup version</h2><p className="mt-2 text-sm text-slate-500">Store an integrity-checked JSON snapshot in your private Storage.</p><button className="mt-5 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Create snapshot</button></form>
  </div>
  <section className="mt-8 rounded-2xl border border-black/[0.06] bg-white">
   <div className="border-b border-black/[0.06] p-5"><h2 className="font-semibold">Backup history</h2><p className="mt-1 text-sm text-slate-400">Private snapshots are versioned and checksum-protected.</p></div>
   {(versions??[]).length?<div className="divide-y divide-slate-100">{(versions??[]).map((version:any)=><div key={version.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold">{new Date(version.created_at).toLocaleString()}</p><p className="mt-1 text-xs text-slate-400">{Math.round(Number(version.size_bytes||0)/1024)} KB · SHA-256 {String(version.checksum||"").slice(0,16)}…</p></div><div className="flex flex-wrap gap-2"><a href={"/api/backup/versions/"+version.id} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold">Download</a><form action={restoreBackupVersion.bind(null,version.id)}><button className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white">Restore</button></form><form action={deleteBackupVersion.bind(null,version.id)}><button className="rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">Delete</button></form></div></div>)}</div>:<div className="p-8 text-center text-sm text-slate-400">No stored backup versions yet.</div>}
  </section>
  <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">Media files remain private in Storage. ZIP backups include media up to the endpoint safety limit; JSON snapshots preserve database data and integrity metadata.</div>
  <div className="mt-6 flex flex-wrap gap-2"><Link href="/import" className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Import JSON / CSV</Link><Link href="/import/anki" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold">Import Anki .apkg</Link></div>
 </div></AppShell>;
}
