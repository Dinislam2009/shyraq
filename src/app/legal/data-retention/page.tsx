import {AppShell} from "@/components/app-shell";
import Link from "next/link";

export default function data_retentionPage(){
 return <AppShell><article className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Shyraq · retention</p>
  <h1 className="mt-2 text-3xl font-semibold tracking-tight">Data retention</h1>
  <p className="mt-3 text-sm leading-6 text-slate-500">What Shyraq keeps, what is deleted, and how account deletion affects user-owned data.</p>
  <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Draft for product launch. This page describes product behavior and is not legal advice.</p>
  <div className="prose prose-slate mt-8 max-w-none dark:prose-invert">
   <h2>Active data</h2><p>Account, learning and workspace data are retained while needed to provide the product and while the account remains active, subject to configured workspace and collaboration behavior.</p><h2>Deletion</h2><p>Account deletion is designed to remove user-owned application data through the account lifecycle flow. Some audit, security or operational records may follow separate retention rules.</p><h2>Backups</h2><p>Backups may retain encrypted application data for operational recovery until their retention window expires.</p>
  </div>
  <div className="mt-10"><Link href="/settings" className="text-sm font-semibold text-slate-700 dark:text-slate-200">Back to settings</Link></div>
 </article></AppShell>;
}
