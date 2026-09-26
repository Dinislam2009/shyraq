"use client";

import {useEffect} from "react";

export function ServiceWorkerRegistration(){
 useEffect(()=>{
  if(!("serviceWorker" in navigator))return;
  const register=async()=>{
   try{
    const registration=await navigator.serviceWorker.register("/sw.js",{scope:"/"});
    if("sync" in registration){
     try{await (registration as ServiceWorkerRegistration & {sync:{register:(tag:string)=>Promise<void>}}).sync.register("shyraq-sync");}catch{}
    }
   }catch{}
  };
  void register();
  const onOnline=()=>{void register();};
  window.addEventListener("online",onOnline);
  const onMessage=(event:MessageEvent)=>{if(event.data?.type==="shyraq-sync-request")window.dispatchEvent(new Event("shyraq:request-sync"));};
  navigator.serviceWorker.addEventListener("message",onMessage);
  return()=>{window.removeEventListener("online",onOnline);navigator.serviceWorker.removeEventListener("message",onMessage);};
 },[]);
 return null;
}
