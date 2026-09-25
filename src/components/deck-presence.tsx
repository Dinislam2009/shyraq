"use client";
import {useEffect,useMemo,useState} from "react";
import {createClient} from "@/lib/supabase/client";

type Peer={id:string;name:string;editing?:string|null};

export function DeckPresence({deckId,userId,userName}:{deckId:string;userId:string;userName:string}){
 const [peers,setPeers]=useState<Peer[]>([]);
 const supabase=useMemo(()=>createClient(),[]);
 useEffect(()=>{
  const channel=supabase.channel("deck-presence:"+deckId,{config:{presence:{key:userId}}});
  const sync=()=>{const state=channel.presenceState<Peer>();const next:Object[]=[];const seen=new Set<string>();Object.values(state).forEach((entries:any[])=>entries?.forEach((entry:any)=>{const id=String(entry.id||"");if(id&&!seen.has(id)){seen.add(id);next.push({id,name:String(entry.name||"Student"),editing:entry.editing||null});}}));setPeers(next as Peer[]);};
  channel.on("presence",{event:"sync"},sync).on("presence",{event:"join"},sync).on("presence",{event:"leave"},sync).subscribe(async status=>{if(status==="SUBSCRIBED")await channel.track({id:userId,name:userName,editing:null});});
  return()=>{void channel.untrack();void supabase.removeChannel(channel);};
 },[deckId,userId,userName,supabase]);
 const others=peers.filter(peer=>peer.id!==userId);
 return <div aria-label={others.length?others.length+" collaborators online":"No other collaborators online"} className="flex items-center gap-2 text-xs text-slate-400">
  <span className="flex -space-x-1.5">{others.slice(0,5).map(peer=><span key={peer.id} title={peer.name} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-emerald-100 text-[10px] font-semibold text-emerald-800">{peer.name.slice(0,1).toUpperCase()}</span>)}</span>
  {others.length?<span>{others.length} online</span>:<span>Solo</span>}
 </div>;
}
