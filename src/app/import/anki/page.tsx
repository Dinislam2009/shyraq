import {AppShell} from "@/components/app-shell";
import Link from "next/link";
import {AnkiImportForm} from "@/components/anki-import-form";

export default async function AnkiImportPage({searchParams}:{searchParams:Promise<{error?:string}>}){
 const params=await searchParams;
 return <AppShell><div className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
  <Link href="/import" className="text-sm text-slate-400">← Import</Link>
  <h1 className="mt-6 text-3xl font-semibold">Import Anki deck</h1>
  <p className="mt-2 text-sm text-slate-500">Preflight the APKG first, inspect templates/media/history compatibility, then import the complete deck into Shyraq.</p>
  {params.error?<div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{params.error}</div>:null}
  <div className="mt-8"><AnkiImportForm/></div>
 </div></AppShell>;
}
