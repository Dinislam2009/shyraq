import {AppShell} from "@/components/app-shell";
import Link from "next/link";
import {ImportPreview} from "@/components/import-preview";
import {ImportJobProgress} from "@/components/import-job-progress";

export default async function ImportPage({searchParams}:{searchParams:Promise<{error?:string}>}){
 const {error}=await searchParams;
 return <AppShell><div className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
  <p className="text-sm text-slate-400">Data portability</p>
  <h1 className="mt-1 text-3xl font-semibold">Import</h1>
  <p className="mt-2 text-sm text-slate-500">Preview, validate and safely import cards or restore a complete Shyraq backup.</p>
  <div className="mt-8 space-y-4"><ImportJobProgress/><ImportPreview initialError={error}/></div>
  <Link href="/import/anki" className="mt-4 block rounded-2xl border border-black/[0.06] bg-white p-6 hover:bg-slate-50">
   <h2 className="font-semibold">Import Anki .apkg</h2>
   <p className="mt-2 text-sm text-slate-500">Dedicated migration path for Anki's SQLite collection package, media and review history.</p>
  </Link>
 </div></AppShell>;
}
