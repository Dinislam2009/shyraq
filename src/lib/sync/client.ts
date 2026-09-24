"use client";
import { offlineStore, type OfflineReview } from "@/lib/offline/store";

export async function queueReview(event:OfflineReview){
 await offlineStore.reviews.put({...event,status:"pending"});
}
export async function syncReviews(){
 const events=await offlineStore.reviews.where("status").equals("pending").limit(500).toArray();
 if(!events.length)return {accepted:0};
 const response=await fetch("/api/sync",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({events})});
 if(!response.ok)throw new Error("Sync failed");
 const result=await response.json();
 await offlineStore.reviews.bulkPut(events.map(e=>({...e,status:"synced" as const})));
 return result as {accepted:number};
}
export async function pullChanges(since=0){
 const response=await fetch("/api/sync?since="+encodeURIComponent(String(since)),{cache:"no-store"});
 if(!response.ok)throw new Error("Pull failed");
 return response.json() as Promise<{changes:any[];cursor:number}>;
}
