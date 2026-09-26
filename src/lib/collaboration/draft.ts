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
 return {remoteDraft,publish,dismissRemote,connected:Boolean(channelRef.current)};
}
