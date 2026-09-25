"use client";
import {useEffect} from "react";
import {bootstrapOfflineMirror,startBackgroundSync,syncAll} from "@/lib/sync/client";

export function OfflineBootstrap(){
 useEffect(()=>{
  let cleanup=()=>{};
  let mounted=true;
  const onSyncMessage=(event:MessageEvent)=>{if(event.data?.type==="shyraq-sync-request"&&typeof window!=="undefined"){const id=localStorage.getItem("shyraq:last-user-id");if(id)void syncAll(id).catch(()=>undefined);}};
  const start=async()=>{
   if(!("serviceWorker" in navigator))return;
   try{
    const registration=await navigator.serviceWorker.register("/sw.js",{scope:"/"});
    navigator.serviceWorker.addEventListener("message",onSyncMessage);
    if("sync" in registration){
     try{await (registration as ServiceWorkerRegistration&{sync?:{register:(tag:string)=>Promise<void>}}).sync?.register("shyraq-sync");}catch{}
    }
   }catch{return;}
   if(!mounted)return;
   try{
    const session=await bootstrapOfflineMirror();
    if(session?.userId)cleanup=startBackgroundSync(session.userId);
   }catch{}
  };
  void start();
  return()=>{mounted=false;cleanup();navigator.serviceWorker.removeEventListener("message",onSyncMessage);};
 },[]);
 return null;
}
