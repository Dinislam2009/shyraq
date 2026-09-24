import {AppShell} from "@/components/app-shell";
import Link from "next/link";
import {importAnki} from "@/app/import/anki/actions";

export default function AnkiImportPage(){
 return <AppShell><div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
  <Link href="/import" className="text-sm text-slate-400">← Import</Link>
  <h1 className="mt-6 text-3xl font-semibold">Import Anki deck</h1>
  <p className="mt-2 text-sm text-slate-500">Read the APKG SQLite collection and migrate its decks and card content into Shyraq.</p>
  <form action={importAnki} className="mt-8 rounded-2xl border border-black/[0.06] bg-white p-6">
   <input required type="file" name="file" accept=".apkg,application/octet-stream" className="block w-full rounded-xl border border-slate-200 p-3 text-sm"/>
   <button className="mt-5 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white">Import .apkg</button>
  </form>
 </div></AppShell>;
}