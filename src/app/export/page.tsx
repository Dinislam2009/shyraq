import Link from "next/link";
import {AppShell} from "@/components/app-shell";

export default function ExportPage(){
 return <AppShell><div className="mx-auto max-w-3xl px-5 py-8 sm:px-8"><p className="text-sm text-slate-400">Data</p><h1 className="mt-1 text-3xl font-semibold">Import & export</h1><p className="mt-2 text-sm text-slate-500">Keep your learning data portable and independent from Shyraq.</p>
 <div className="mt-8 grid gap-4 sm:grid-cols-2">
  <a href="/api/export/backup" className="rounded-2xl border border-black/[0.06] bg-white p-6 hover:bg-slate-50"><h2 className="font-semibold">Complete backup ZIP</h2><p className="mt-2 text-sm text-slate-500">Full JSON backup plus private media binaries.</p></a>
  <a href="/api/export/json" className="rounded-2xl border border-black/[0.06] bg-white p-6 hover:bg-slate-50"><h2 className="font-semibold">Backup JSON</h2><p className="mt-2 text-sm text-slate-500">Database data only, including review state and portability metadata.</p></a>
  <a href="/api/export/csv" className="rounded-2xl border border-black/[0.06] bg-white p-6 hover:bg-slate-50"><h2 className="font-semibold">Cards CSV</h2><p className="mt-2 text-sm text-slate-500">Front/back format for spreadsheets and simple migrations.</p></a>
 </div>
 <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">Media files themselves remain in private Storage. The JSON backup includes their metadata and storage paths so a future binary-export job can reproduce the exact media set.</div>
 <div className="mt-6 flex flex-wrap gap-2"><Link href="/import" className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Import JSON / CSV</Link><Link href="/import/anki" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold">Import Anki .apkg</Link></div>
 </div></AppShell>;
}