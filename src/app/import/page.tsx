import {AppShell} from "@/components/app-shell";
import Link from "next/link";
import {importCards} from "@/app/import/actions";

export default function ImportPage(){
 return <AppShell><div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
  <p className="text-sm text-slate-400">Data portability</p><h1 className="mt-1 text-3xl font-semibold">Import</h1>
  <p className="mt-2 text-sm text-slate-500">Bring your learning data into Shyraq.</p>
  <form action={importCards} className="mt-8 rounded-2xl border border-black/[0.06] bg-white p-6"><input required type="file" name="file" accept=".json,.csv,text/csv,application/json" className="block w-full rounded-xl border border-slate-200 p-3 text-sm"/><button className="mt-5 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white">Import JSON / CSV</button></form>
  <Link href="/import/anki" className="mt-4 block rounded-2xl border border-black/[0.06] bg-white p-6 hover:bg-slate-50"><h2 className="font-semibold">Import Anki .apkg</h2><p className="mt-2 text-sm text-slate-500">Dedicated migration path for Anki's SQLite collection package.</p></Link>
 </div></AppShell>;
}