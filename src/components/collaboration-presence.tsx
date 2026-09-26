"use client";

import {useEffect,useRef,useState} from "react";
import {createClient} from "@/lib/supabase/client";
import {useI18n} from "@/components/i18n-provider";

type PresenceEntry={
 userId:string;
 displayName:string;
 role:"editor"|"viewer"|"reviewer"|"admin"|"owner";
 joinedAt:number;
 activeCardId?:string;
 activeField?:string;
 selectionStart?:number;
 selectionEnd?:number;
};

const normalizeRole=(value:unknown):PresenceEntry["role"]=>{
 const role=String(value||"");
 return ["editor","viewer","reviewer","admin","owner"].includes(role)?(role as PresenceEntry["role"]):"viewer";
};

export function CollaborationPresence({deckId,userId,displayName,role}:{deckId:string;userId:string;displayName:string;role:string}){
 const [members,setMembers]=useState<PresenceEntry[]>([]);
 const localPresence=useRef<PresenceEntry>({userId,displayName:displayName||"Member",role:normalizeRole(role),joinedAt:Date.now()});
 const {t}=useI18n();

 useEffect(()=>{
  localPresence.current={userId,displayName:displayName||"Member",role:normalizeRole(role),joinedAt:Date.now()};
 },[displayName,role,userId]);

 useEffect(()=>{
  const supabase=createClient();
  const channel=supabase.channel("shyraq-presence-"+deckId,{config:{presence:{key:userId}}});

  const sync=()=>{
   const state=channel.presenceState() as Record<string,PresenceEntry[]>;
   const next=Object.values(state).flatMap(entries=>entries.map(entry=>({
    userId:String(entry.userId||""),
    displayName:String(entry.displayName||"Member"),
    role:normalizeRole(entry.role),
    joinedAt:Number(entry.joinedAt||0),
    activeCardId:entry.activeCardId?String(entry.activeCardId):undefined,
    activeField:entry.activeField?String(entry.activeField):undefined,
    selectionStart:Number.isFinite(Number(entry.selectionStart))?Number(entry.selectionStart):undefined,
    selectionEnd:Number.isFinite(Number(entry.selectionEnd))?Number(entry.selectionEnd):undefined
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
    if(status==="SUBSCRIBED")await channel.track(localPresence.current);
   });

  const onEditorPresence=(event:Event)=>{
   const custom=event as CustomEvent<{cardId:string;field:string;selectionStart:number;selectionEnd:number}>;
   const detail=custom.detail;
   if(!detail?.cardId)return;
   localPresence.current={...localPresence.current,activeCardId:String(detail.cardId),activeField:String(detail.field||""),selectionStart:Number(detail.selectionStart||0),selectionEnd:Number(detail.selectionEnd||detail.selectionStart||0)};
   void channel.track(localPresence.current);
  };
  window.addEventListener("shyraq:editor-presence",onEditorPresence);
  return()=>{
   window.removeEventListener("shyraq:editor-presence",onEditorPresence);
   void supabase.removeChannel(channel);
  };
 },[deckId,userId]);

 const editors=members.filter(member=>["editor","admin","owner"].includes(member.role));
 const activeSelections=editors.filter(member=>Boolean(member.activeCardId));
 const visible=members.slice(0,4);
 return <div className="inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500">
  <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500"/>
  <span>{members.length||1} {(members.length||1)===1?t("member"):t("members")} {t("here")}</span>
  {visible.map(member=><span key={member.userId} title={member.displayName} className={"rounded-full px-2 py-0.5 "+(["editor","admin","owner"].includes(member.role)?"bg-emerald-50 text-emerald-700":"bg-slate-100 text-slate-600")}>{member.displayName}</span>)}
  {members.length>4?<span className="text-slate-400">+{members.length-4}</span>:null}
  {editors.length?<span className="border-l border-slate-200 pl-2 text-slate-500">{editors.length} active {editors.length===1?"editor":"editors"}</span>:null}
  {activeSelections.length?<span className="border-l border-slate-200 pl-2 text-slate-500">{activeSelections.length} editing</span>:null}
 </div>;
}
