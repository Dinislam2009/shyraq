"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function WorkspaceRealtime({workspaceId}:{workspaceId:string}){
 const router=useRouter();
 useEffect(()=>{
  const supabase=createClient();
  const channel=supabase
   .channel("shyraq-workspace-"+workspaceId)
   .on("postgres_changes",{event:"*",schema:"public",table:"workspace_members",filter:"workspace_id=eq."+workspaceId},()=>router.refresh())
   .on("postgres_changes",{event:"*",schema:"public",table:"decks",filter:"workspace_id=eq."+workspaceId},()=>router.refresh())
   .subscribe();
  return()=>{void supabase.removeChannel(channel);};
 },[workspaceId,router]);
 return null;
}
