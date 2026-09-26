"use client";

import {createContext,useContext,useEffect,useMemo,useState,type ReactNode} from "react";
import {dictionaries,type Locale,type TranslationKey} from "@/lib/i18n";

type I18nContextValue={locale:Locale;setLocale:(locale:Locale)=>void;t:(key:TranslationKey)=>string};
const I18nContext=createContext<I18nContextValue|null>(null);

function validLocale(value:unknown):Locale|null{
 const locale=String(value||"");
 return locale==="kk"||locale==="ru"||locale==="en"?locale:null;
}

function getInitialLocale():Locale{
 if(typeof window==="undefined")return "en";
 const saved=validLocale(window.localStorage.getItem("shyraq-locale"));
 if(saved)return saved;
 const browser=navigator.language.toLowerCase();
 if(browser.startsWith("kk"))return "kk";
 if(browser.startsWith("ru"))return "ru";
 return "en";
}

export function I18nProvider({children,initialLocale="en"}:{children:ReactNode;initialLocale?:Locale}){
 const [locale,setLocaleState]=useState<Locale>(initialLocale);

 useEffect(()=>{
  const local=getInitialLocale();
  if(local!==initialLocale)setLocaleState(local);
  void fetch("/api/preferences/locale",{cache:"no-store"})
   .then(async response=>{
    if(!response.ok)return null;
    const data=await response.json() as {locale?:string};
    return validLocale(data.locale);
   })
   .then(remote=>{if(remote){setLocaleState(remote);window.localStorage.setItem("shyraq-locale",remote);}})
   .catch(()=>undefined);
 },[]);

 useEffect(()=>{
  window.localStorage.setItem("shyraq-locale",locale);
  document.cookie="shyraq-locale="+locale+"; Path=/; Max-Age=31536000; SameSite=Lax";
  document.documentElement.lang=locale;
 },[locale]);

 const value=useMemo(()=>({
  locale,
  setLocale:(next:Locale)=>setLocaleState(next),
  t:(key:TranslationKey)=>dictionaries[locale][key]??dictionaries.en[key],
 }),[locale]);

 return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(){
 const value=useContext(I18nContext);
 if(!value)throw new Error("useI18n must be used inside I18nProvider");
 return value;
}
