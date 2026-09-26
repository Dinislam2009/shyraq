"use client";

import {useCallback,useEffect,useRef,useState} from "react";
import {createClient} from "@/lib/supabase/client";

export type CardDraft={
 front:string;back:string;tags:string;markers:string;status:string;options:string;answer:string;
 imageUrl:string;fields:Record<string,string>;reviewPreferences:Record<string,unknown>;updatedAt:number;
};

type DraftMessage={source:string;draft:CardDraft};

export function useCardDraftChannel(deckId:string,cardId:string|undefined,userId:string|undefined){
 const [remoteDraft,setRemoteDraft]=useState<CardDraft|null>(null);
 const sourceRef=useRef<string>("");
 const channelRef=useRef<ReturnType<ReturnType<typeof createClient>["channel"]>|null>(null);

 useEffect(()=>{
  if(!deckId||!cardId||!userId)return;
  sourceRef.current=crypto.randomUUID();
  const supabase=createClient();
  const channel=supabase.channel("shyraq-card-draft-"+deckId+"-"+cardId);
  channel
   .on("broadcast",{event:"card-draft"},payload=>{
    const message=payload.payload as DraftMessage;
    if(!message||message.source===sourceRef.current||!message.draft)return;
    setRemoteDraft(message.draft);
   })
   .subscribe();
  channelRef.current=channel;
  return()=>{
   channelRef.current=null;
   void supabase.removeChannel(channel);
  };
 },[deckId,cardId,userId]);

 const publish=useCallback((draft:Omit<CardDraft,"updatedAt">)=>{
  const channel=channelRef.current;
  if(!channel)return;
  void channel.send({type:"broadcast",event:"card-draft",payload:{
   source:sourceRef.current,draft:{...draft,updatedAt:Date.now()}
  }});
 },[]);

 const dismissRemote=useCallback(()=>setRemoteDraft(null),[]);
 return {remoteDraft,publish,dismissRemote};
}


type FormDraftMessage={source:string;values:Record<string,string|boolean>};

export function useFormDraftChannel(channelKey:string,userId:string|undefined,enabled:boolean){
 const [remoteDraft,setRemoteDraft]=useState<Record<string,string|boolean>|null>(null);
 const sourceRef=useRef<string>("");
 const channelRef=useRef<any>(null);

 useEffect(()=>{
  if(!enabled||!userId||!channelKey)return;
  sourceRef.current=crypto.randomUUID();
  const supabase=createClient();
  const channel=supabase.channel("shyraq-form-draft-"+channelKey);
  channel.on("broadcast",{event:"form-draft"},payload=>{
   const message=payload.payload as FormDraftMessage;
   if(!message||message.source===sourceRef.current||!message.values)return;
   setRemoteDraft(message.values);
  }).subscribe();
  channelRef.current=channel;
  return()=>{
   channelRef.current=null;
   void supabase.removeChannel(channel);
  };
 },[channelKey,enabled,userId]);

 const publish=useCallback((values:Record<string,string|boolean>)=>{
  if(!channelRef.current)return;
  void channelRef.current.send({
   type:"broadcast",
   event:"form-draft",
   payload:{source:sourceRef.current,values}
  });
 },[]);

 const dismiss=useCallback(()=>setRemoteDraft(null),[]);
 return {remoteDraft,publish,dismiss};
}
