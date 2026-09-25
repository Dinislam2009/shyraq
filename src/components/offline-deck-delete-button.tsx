"use client";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {offlineStore,queueMutation} from "@/lib/offline/store";

export function OfflineDeckDeleteButton({userId,deckId,confirmText="DELETE"}:{userId:string;deckId:string;confirmText?:string}){
 const router=useRouter();const [busy,setBusy]=useState(false);
 return <button type="button" disabled={busy} onClick={async()=>{
  const confirmed=window.prompt("Type "+confirmText+" to confirm.")===confirmText;if(!confirmed)return;
  if(typeof navigator!=="undefined"&&!navigator.onLine){
   setBusy(true);
   await offlineStore.decks.delete(deckId);
   await queueMutation({id:crypto.randomUUID(),userId,entityType:"decks",operation:"delete",entityId:deckId,payload:{}});
   router.push("/decks?offline_saved=1");router.refresh();
  }
 }} className="rounded-xl bg-red-700 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Delete offline</button>;
}
