"use client";
import {useEffect} from "react";
import {useRouter} from "next/navigation";
import {createClient} from "@/lib/supabase/client";

export function CollaborationRealtime({deckId,workspaceId}:{deckId:string;workspaceId:string}){
 const router=useRouter();
 useEffect(()=>{
  const supabase=createClient();
  const channel=supabase.channel("shyraq-collaboration-"+deckId)
   .on("postgres_changes",{event:"*",schema:"public",table:"comments",filter:"deck_id=eq."+deckId},()=>router.refresh())
   .on("postgres_changes",{event:"*",schema:"public",table:"activity_feed",filter:"workspace_id=eq."+workspaceId},()=>router.refresh())
   .on("postgres_changes",{event:"*",schema:"public",table:"deck_versions",filter:"deck_id=eq."+deckId},()=>router.refresh())
   .on("postgres_changes",{event:"*",schema:"public",table:"cards",filter:"deck_id=eq."+deckId},()=>router.refresh())
   .on("postgres_changes",{event:"*",schema:"public",table:"card_templates",filter:"deck_id=eq."+deckId},()=>router.refresh())
   .subscribe();
  return()=>{void supabase.removeChannel(channel);};
 },[deckId,workspaceId,router]);
 return null;
}
