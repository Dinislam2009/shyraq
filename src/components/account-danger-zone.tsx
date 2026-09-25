"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { offlineStore } from "@/lib/offline/store";
import { useI18n } from "@/components/i18n-provider";

export function AccountDangerZone(){
 const router=useRouter();
 const [confirm,setConfirm]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const { t } = useI18n();

 async function removeAccount(){
  if(confirm!=="DELETE"||busy)return;
  setBusy(true);
  setError("");
  try{
   const supabase=createClient();
   const {error:fnError}=await supabase.functions.invoke("delete-account",{body:{}});
   if(fnError)throw new Error(fnError.message);
   await offlineStore.reviews.clear();
   await offlineStore.reviewCache.clear();
   await supabase.auth.signOut({scope:"global"});
   router.replace("/login?deleted=1");
  }catch(error){
   setError(error instanceof Error?error.message:t("accountDeletionFailed"));
   setBusy(false);
  }
 }

 return (
  <section className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-6">
   <p className="text-sm font-semibold text-red-900">Delete account</p>
   <p className="mt-2 max-w-2xl text-sm leading-6 text-red-800">This permanently removes your Shyraq account, application data and uploaded media. This action cannot be undone.</p>
   <label className="mt-5 block max-w-sm">
    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-red-700">Type DELETE to confirm</span>
    <input value={confirm} onChange={event=>setConfirm(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-red-200 bg-white px-3 text-sm outline-none focus:border-red-400" autoComplete="off" />
   </label>
   {error&&<p className="mt-3 text-sm text-red-700">{error}</p>}
   <button type="button" disabled={confirm!=="DELETE"||busy} onClick={()=>void removeAccount()} className="mt-4 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{busy?"Deleting…":"Delete my account"}</button>
  </section>
 );
}
