import {AppShell} from "@/components/app-shell";
import Link from "next/link";

export default function privacyPage(){
 return <AppShell><article className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Shyraq · privacy</p>
  <h1 className="mt-2 text-3xl font-semibold tracking-tight">Privacy</h1>
  <p className="mt-3 text-sm leading-6 text-slate-500">How Shyraq handles account, learning, sync, community and exported data.</p>
  <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Draft for product launch. This page describes product behavior and is not legal advice.</p>
  <div className="prose prose-slate mt-8 max-w-none dark:prose-invert">
   <h2>Data we process</h2><p>Shyraq may process account identifiers, profile information, learning content, review events, device and sync metadata, and community activity needed to operate the service.</p><h2>Private learning data</h2><p>Private decks, cards, review history and private media are scoped to the user or workspace permissions configured for them. Public content is intentionally visible according to its publication settings.</p><h2>Exports</h2><p>Users can export supported learning data, review history and media through the product portability tools.</p><h2>Third parties</h2><p>Shyraq uses Supabase for authentication, database, storage and related infrastructure. Community and public content may be visible to other users when the creator publishes it.</p>
  </div>
  <div className="mt-10"><Link href="/settings" className="text-sm font-semibold text-slate-700 dark:text-slate-200">Back to settings</Link></div>
 </article></AppShell>;
}
