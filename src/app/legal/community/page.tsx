import {AppShell} from "@/components/app-shell";
import Link from "next/link";
import {getServerI18n} from "@/lib/i18n-server";

export default async function communityPage(){
 const {t}=await getServerI18n();
 return <AppShell><article className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Shyraq</p>
  <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t("communityTitle")}</h1>
  <p className="mt-3 text-sm leading-6 text-slate-500">{t("communityIntro")}</p>
  <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{t("launchDraftNotice")}</p>
  <div className="prose prose-slate mt-8 max-w-none dark:prose-invert">
   <h2>{t("communityPublicTitle")}</h2><p>{t("communityPublicText")}</p>
   <h2>{t("communityReportsTitle")}</h2><p>{t("communityReportsText")}</p>
   <h2>{t("communityModerationTitle")}</h2><p>{t("communityModerationText")}</p>
  </div>
  <div className="mt-10"><Link href="/settings" className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t("backToSettings")}</Link></div>
 </article></AppShell>;
}
