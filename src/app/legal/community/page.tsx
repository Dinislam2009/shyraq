import {AppShell} from "@/components/app-shell";
import Link from "next/link";

export default function communityPage(){
 return <AppShell><article className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Shyraq · community</p>
  <h1 className="mt-2 text-3xl font-semibold tracking-tight">Community guidelines</h1>
  <p className="mt-3 text-sm leading-6 text-slate-500">Rules for public decks, creator profiles, reports and moderation.</p>
  <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Draft for product launch. This page describes product behavior and is not legal advice.</p>
  <div className="prose prose-slate mt-8 max-w-none dark:prose-invert">
   <h2>Public content</h2><p>Keep public decks educational, lawful, relevant and respectful. Do not use public publishing to target, harass or expose private information about another person.</p><h2>Reports</h2><p>Reports should describe a concrete issue. Duplicate or abusive reporting may be rate-limited.</p><h2>Moderation</h2><p>Reports may be reviewed by authorized moderators. Moderation actions are recorded in an audit trail for accountability.</p>
  </div>
  <div className="mt-10"><Link href="/settings" className="text-sm font-semibold text-slate-700 dark:text-slate-200">Back to settings</Link></div>
 </article></AppShell>;
}
