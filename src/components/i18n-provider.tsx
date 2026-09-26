"use client";

import {createContext,useContext,useEffect,useMemo,useState,type ReactNode} from "react";
import {type Locale,type TranslationKey,translateKey} from "@/lib/i18n";
import {formatDate,formatDateTime,formatNumber} from "@/lib/i18n-format";

type I18nContextValue={locale:Locale;setLocale:(locale:Locale)=>void;t:(key:TranslationKey)=>string;formatNumber:(value:number,options?:Intl.NumberFormatOptions)=>string;formatDate:(value:string|number|Date,options?:Intl.DateTimeFormatOptions)=>string;formatDateTime:(value:string|number|Date)=>string};
const I18nContext=createContext<I18nContextValue|null>(null);

function validLocale(value:unknown):Locale|null{
 const locale=String(value||"");
 return locale==="kk"||locale==="ru"||locale==="en"?locale:null;
}

function getInitialLocale(fallback:Locale="en"):Locale{
 if(typeof window==="undefined")return "en";
 const cookieMatch=document.cookie.match(/(?:^|;\s*)shyraq-locale=([^;]+)/);
 const cookieLocale=validLocale(cookieMatch?.[1] ? decodeURIComponent(cookieMatch[1]) : null);
 if(cookieLocale)return cookieLocale;
 const saved=validLocale(window.localStorage.getItem("shyraq-locale"));
 if(saved)return saved;
 const browser=navigator.language.toLowerCase();
 if(fallback==="en"){
  if(browser.startsWith("kk"))return "kk";
  if(browser.startsWith("ru"))return "ru";
 }
 return fallback;
}

export function I18nProvider({children,initialLocale="en"}:{children:ReactNode;initialLocale?:Locale}){
 const [locale,setLocaleState]=useState<Locale>(initialLocale);

 useEffect(()=>{
  const local=getInitialLocale(initialLocale);
  const hasLocalPreference=/(?:^|;\s*)shyraq-locale=/.test(document.cookie)||Boolean(window.localStorage.getItem("shyraq-locale"));
  if(local!==initialLocale)setLocaleState(local);
  if(hasLocalPreference)return;
  void fetch("/api/preferences/locale",{cache:"no-store"})
   .then(async response=>{
    if(!response.ok)return null;
    const data=await response.json() as {locale?:string};
    return validLocale(data.locale);
   })
   .then(remote=>{
    if(remote){
      setLocaleState(remote);
      window.localStorage.setItem("shyraq-locale",remote);
      document.cookie="shyraq-locale="+remote+"; Path=/; Max-Age=31536000; SameSite=Lax";
    }
   })
   .catch(()=>undefined);
 },[initialLocale]);

 useEffect(()=>{
  window.localStorage.setItem("shyraq-locale",locale);
  document.cookie="shyraq-locale="+locale+"; Path=/; Max-Age=31536000; SameSite=Lax";
  document.documentElement.lang=locale;
 },[locale]);

 const value=useMemo(()=>({
  locale,
  setLocale:(next:Locale)=>{
    setLocaleState(next);
    if(typeof window!=="undefined"){
      window.localStorage.setItem("shyraq-locale",next);
      document.cookie="shyraq-locale="+next+"; Path=/; Max-Age=31536000; SameSite=Lax";
      void fetch("/api/preferences/locale",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({locale:next}),
        keepalive:true,
      }).catch(()=>undefined);
    }
  },
  t:(key:TranslationKey)=>translateKey(locale,key),
  formatNumber:(value:number,options?:Intl.NumberFormatOptions)=>formatNumber(value,locale,options),
  formatDate:(value:string|number|Date,options?:Intl.DateTimeFormatOptions)=>formatDate(value,locale,options),
  formatDateTime:(value:string|number|Date)=>formatDateTime(value,locale),
 }),[locale]);

 return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(){
 const value=useContext(I18nContext);
 if(!value)throw new Error("useI18n must be used inside I18nProvider");
 return value;
}
