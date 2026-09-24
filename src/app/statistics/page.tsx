import { AppShell } from "@/components/app-shell";

export default function StatisticsPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <p className="text-sm text-slate-400">Insights</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Statistics</h1><p className="mt-2 text-sm text-slate-500">A complete view of your study activity will live here.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[["Reviews","1,842"],["Accuracy","91.4%"],["Study time","18h 24m"],["Retention","87%"]].map(([label,value]) => <div key={label} className="rounded-2xl border border-black/[0.06] bg-white p-5"><p className="text-sm text-slate-400">{label}</p><p className="mt-3 text-2xl font-semibold">{value}</p></div>)}
        </div>
      </div>
    </AppShell>
  );
}