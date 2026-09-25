"use client";
import {useEffect} from "react";
import {bootstrapOfflineMirror,startBackgroundSync} from "@/lib/sync/client";

export function OfflineBootstrap(){
 useEffect(()=>{
  let cleanup=()=>{};
  let mounted=true;
  const start=async()=>{
   if(!("serviceWorker" in navigator))return;
   try{
    const registration=await navigator.serviceWorker.register("/sw.js",{scope:"/"});
    if("sync" in registration){
     try{await (registration as ServiceWorkerRegistration&{sync?:{register:(tag:string)=>Promise<void>}}).sync?.register("shyraq-sync");}catch{}
    }
   }catch{}
   if(!mounted)return;
   try{
    const session=await bootstrapOfflineMirror();
    if(session?.userId)cleanup=startBackgroundSync(session.userId);
   }catch{}
  };
  void start();
  return()=>{mounted=false;cleanup();navigator.serviceWorker.removeEventListener("message",onSyncMessage as EventListener);};
 },[]);
 return null;
}
