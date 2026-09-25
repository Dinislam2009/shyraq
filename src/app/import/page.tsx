import {AppShell} from "@/components/app-shell";
import Link from "next/link";
import {importCards} from "@/app/import/actions";

export default async function ImportPage(){
 return <AppShell><div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
  <p className="text-sm text-slate-400">Data portability</p>
  <h1 className="mt-1 text-3xl font-semibold">Import</h1>
  <p className="mt-2 text-sm text-slate-500">Bring cards, full Shyraq backups or Anki collections into your workspace.</p>

  <form action={importCards} className="mt-8 rounded-2xl border border-black/[0.06] bg-white p-6">
   <input required type="file" name="file" accept=".json,.csv,.zip,text/csv,application/json,application/zip" className="block w-full rounded-xl border border-slate-200 p-3 text-sm"/>
   <div className="mt-4 grid gap-3 sm:grid-cols-3">
    <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">CSV</p><p className="mt-1 text-xs leading-5 text-slate-500">front, back, kind, tags, options, answer, image_url</p></div>
    <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">JSON</p><p className="mt-1 text-xs leading-5 text-slate-500">Simple card data or shyraq-backup-v2</p></div>
    <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">ZIP</p><p className="mt-1 text-xs leading-5 text-slate-500">Full backup with media, history and preferences</p></div>
   </div>
   <button className="mt-5 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white">Import file</button>
  </form>

  <Link href="/import/anki" className="mt-4 block rounded-2xl border border-black/[0.06] bg-white p-6 hover:bg-slate-50">
   <h2 className="font-semibold">Import Anki .apkg</h2>
   <p className="mt-2 text-sm text-slate-500">Dedicated migration path for Anki's SQLite collection package, media and review history.</p>
  </Link>
 </div></AppShell>;
}