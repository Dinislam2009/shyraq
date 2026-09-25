"use client";

import { localeLabels, locales } from "@/lib/i18n";
import { useI18n } from "@/components/i18n-provider";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  return (
    <label className="flex items-center gap-2 text-xs text-slate-500" title={t("language")}>
      <span className="sr-only">{t("language")}</span>
      <select
        value={locale}
        onChange={(event) => setLocale(event.target.value as typeof locale)}
        className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-slate-200"
        aria-label={t("language")}
      >
        {locales.map((item) => <option key={item} value={item}>{localeLabels[item]}</option>)}
      </select>
    </label>
  );
}
