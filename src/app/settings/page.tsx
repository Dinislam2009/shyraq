import { AppShell } from "@/components/app-shell";

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
        <p className="text-sm text-slate-400">Account</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Settings</h1><p className="mt-2 text-sm text-slate-500">Control your Shyraq workspace and study preferences.</p>
        <div className="mt-8 space-y-4">
          {[
            ["Account", "Email, profile and account security"],
            ["Review", "Scheduler, answer buttons and daily limits"],
            ["Appearance", "Theme, density and interface preferences"],
            ["Data", "Import, export, backups and local storage"],
            ["Sync", "Devices, sync status and conflict history"],
          ].map(([title, description]) => <button key={title} className="flex w-full items-center justify-between rounded-2xl border border-black/[0.06] bg-white p-5 text-left transition hover:bg-slate-50"><div><p className="font-semibold">{title}</p><p className="mt-1 text-sm text-slate-400">{description}</p></div><span className="text-slate-300">›</span></button>)}
        </div>
      </div>
    </AppShell>
  );
}