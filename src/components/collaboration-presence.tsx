"use client";

import {useEffect,useState} from "react";
import {createClient} from "@/lib/supabase/client";
import {useI18n} from "@/components/i18n-provider";

type PresenceEntry={userId:string;displayName:string;role:"editor"|"viewer"|"reviewer"|"admin"|"owner";joinedAt:number};

export function CollaborationPresence({deckId,userId,displayName,role}:{deckId:string;userId:string;displayName:string;role:string}){
 const [members,setMembers]=useState<PresenceEntry[]>([]);
 const {t}=useI18n();

 useEffect(()=>{
  const supabase=createClient();
  const channel=supabase.channel("shyraq-presence-"+deckId,{config:{presence:{key:userId}}});

  const sync=()=>{
   const state=channel.presenceState<PresenceEntry>();
   const next=Object.values(state).flatMap(entries=>entries.map(entry=>({
    userId:String(entry.userId||""),
    displayName:String(entry.displayName||"Member"),
    role:["editor","viewer","reviewer","admin","owner"].includes(String(entry.role))?String(entry.role) as PresenceEntry["role"]:"viewer",
    joinedAt:Number(entry.joinedAt||0)
   })));
   const unique=new Map<string,PresenceEntry>();
   for(const entry of next)unique.set(entry.userId,entry);
   setMembers([...unique.values()]);
  };

  channel
   .on("presence",{event:"sync"},sync)
   .on("presence",{event:"join"},sync)
   .on("presence",{event:"leave"},sync)
   .subscribe(async status=>{
    if(status==="SUBSCRIBED"){
     await channel.track({userId,displayName:displayName||"Member",role:role||"viewer",joinedAt:Date.now()});
    }
   });

  return()=>{void supabase.removeChannel(channel);};
 },[deckId,userId,displayName,role]);

 const editors=members.filter(member=>["editor","admin","owner"].includes(member.role));
 const visible=members.slice(0,4);
 return (
  <div className="inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500">
   <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500"/>
   <span>{members.length||1} {(members.length||1)===1?t("member"):t("members")} {t("here")}</span>
   {visible.map(member=>(
    <span key={member.userId} title={member.displayName} className={"rounded-full px-2 py-0.5 "+(member.role==="editor"||member.role==="admin"||member.role==="owner"?"bg-emerald-50 text-emerald-700":"bg-slate-100 text-slate-600")}>
     {member.displayName}
    </span>
   ))}
   {members.length>4?<span className="text-slate-400">+{members.length-4}</span>:null}
   {editors.length?<span className="border-l border-slate-200 pl-2 text-slate-500">{editors.length} active {editors.length===1?"editor":"editors"}</span>:null}
  </div>
 );
}
