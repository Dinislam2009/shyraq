import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PlusIcon } from "@/components/icons";
import { DeckLibrary } from "@/components/deck-library";
import { getDecks } from "@/lib/supabase/queries";
import { getServerI18n } from "@/lib/i18n-server";

export default async function DecksPage() {
  const decks = await getDecks();
  const { t } = await getServerI18n();
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm text-slate-400">{t("Library")}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">{t("My decks")}</h1>
            <p className="mt-2 text-sm text-slate-500">{decks.length} {decks.length===1?t("deck"):t("decks")} {t("in your workspace.")}</p>
          </div>
          <Link href="/decks/trash" className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold">{t("Trash")}</Link><Link href="/decks/new" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800">
            <PlusIcon size={16}/>{t("New deck")}
          </Link>
        </div>
        <div className="mt-7"><DeckLibrary decks={decks}/></div>
      </div>
    </AppShell>
  );
}
