"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useI18n } from "@/components/i18n-provider";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const signup = mode === "signup";
  const router = useRouter();
  const { t } = useI18n();
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [name,setName]=useState("");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try{
      const response=await fetch(signup?"/api/auth/signup":"/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(signup?{email,password,name}:{email,password})});
      const result=await response.json() as {ok?:boolean;session?:boolean;error?:string};
      if(!response.ok){setError(result.error||t("authenticationFailed"));return;}
      if(signup&&!result.session){setError(t("accountCreated"));return;}
      router.replace("/dashboard");
      router.refresh();
    }catch{setError(t("authenticationUnavailable"));}
    finally{setBusy(false);}
  }

  return <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5">
    <div className="mb-8 flex items-start justify-between gap-4">
      <div>
        <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white font-bold">S</div>
        <h1 className="text-2xl font-semibold">{signup ? t("createAccount") : t("welcomeBack")}</h1>
        <p className="mt-2 text-sm text-slate-500">{t("fullAccess")}</p>
      </div>
      <LanguageSwitcher />
    </div>
    <div className="mt-5 grid gap-2 sm:grid-cols-2"><button type="button" onClick={()=>router.push("/api/auth/oauth/google?next=%2Fdashboard")} className="h-10 rounded-xl border border-slate-200 bg-white text-sm font-semibold">{t("continueWithGoogle")}</button><button type="button" onClick={()=>router.push("/api/auth/oauth/apple?next=%2Fdashboard")} className="h-10 rounded-xl border border-slate-200 bg-white text-sm font-semibold">{t("continueWithApple")}</button></div><div className="my-5 flex items-center gap-3 text-[11px] text-slate-400"><span className="h-px flex-1 bg-slate-100"/><span>{t("orSeparator")}</span><span className="h-px flex-1 bg-slate-100"/></div><form onSubmit={submit} className="space-y-4">
      {signup && <input required placeholder={t("name")} value={name} onChange={e=>setName(e.target.value)} className="h-11 w-full rounded-xl border px-3 text-sm" />}
      <input required type="email" placeholder={t("email")} value={email} onChange={e=>setEmail(e.target.value)} className="h-11 w-full rounded-xl border px-3 text-sm" />
      <input required minLength={6} type="password" placeholder={t("password")} value={password} onChange={e=>setPassword(e.target.value)} className="h-11 w-full rounded-xl border px-3 text-sm" />
      {error && <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">{error}</p>}
      <button disabled={busy} className="h-11 w-full rounded-xl bg-slate-950 text-sm font-semibold text-white disabled:opacity-50">{busy ? t("pleaseWait") : signup ? t("create") : t("signIn")}</button>
    </form>
    <p className="mt-6 text-center text-sm text-slate-500">{signup ? t("alreadyHave")+" " : t("newTo")+" "}<Link href={signup?"/login":"/signup"} className="font-semibold text-slate-950">{signup?t("signInLink"):t("createOne")}</Link></p>
  </div>;
}