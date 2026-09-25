"use client";
import {useEffect} from "react";
import {createClient} from "@/lib/supabase/client";

export function CollaborationRealtime({deckId,workspaceId}:{deckId:string;workspaceId:string}){
 useEffect(()=>{
  const supabase=createClient();
  const channel=supabase.channel("shyraq-collaboration-"+deckId)
   .on("postgres_changes",{event:"*",schema:"public",table:"comments",filter:"deck_id=eq."+deckId},()=>window.location.reload())
   .on("postgres_changes",{event:"*",schema:"public",table:"activity_feed",filter:"workspace_id=eq."+workspaceId},()=>window.location.reload())
   .on("postgres_changes",{event:"*",schema:"public",table:"deck_versions",filter:"deck_id=eq."+deckId},()=>window.location.reload())
   .subscribe();
  return()=>{void supabase.removeChannel(channel);};
 },[deckId,workspaceId]);
 return null;
}
