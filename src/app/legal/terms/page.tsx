import {AppShell} from "@/components/app-shell";
import Link from "next/link";

export default function termsPage(){
 return <AppShell><article className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Shyraq · terms</p>
  <h1 className="mt-2 text-3xl font-semibold tracking-tight">Terms</h1>
  <p className="mt-3 text-sm leading-6 text-slate-500">Rules for using Shyraq, public decks, workspaces, reports and collaborative features.</p>
  <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Draft for product launch. This page describes product behavior and is not legal advice.</p>
  <div className="prose prose-slate mt-8 max-w-none dark:prose-invert">
   <h2>Acceptable use</h2><p>Use Shyraq for legitimate learning, organization and collaboration. Do not upload material you do not have permission to use, attempt to access another user's private data, or abuse community/reporting systems.</p><h2>Public content</h2><p>Creators are responsible for content they publish publicly. Public decks may be copied into a user's own workspace where the product permits it.</p><h2>Account responsibility</h2><p>Keep account credentials secure and use only accounts and workspaces you are authorized to access.</p>
  </div>
  <div className="mt-10"><Link href="/settings" className="text-sm font-semibold text-slate-700 dark:text-slate-200">Back to settings</Link></div>
 </article></AppShell>;
}
