"use client";
import {useRouter} from "next/navigation";
import {ReactNode,useEffect,useRef,useState} from "react";
import {offlineStore,queueMutation} from "@/lib/offline/store";
import {parseDeckFormData} from "@/lib/offline/form-payload";
import {useFormDraftChannel} from "@/lib/collaboration/draft";

export function OfflineDeckForm({action,userId,existingId,existing,redirectTo,children}:{action:(formData:FormData)=>void|Promise<void>;userId:string;existingId?:string;existing?:{workspaceId:string;ownerId?:string;createdAt?:string;updatedAt?:string;sortOrder?:number};redirectTo?:string;children:ReactNode}){
 const router=useRouter();
 const [error,setError]=useState("");
 const formRef=useRef<HTMLFormElement>(null);
 const draftTimer=useRef<number|undefined>(undefined);
 const {remoteDraft,publish,dismiss}=useFormDraftChannel(existingId||"",userId,Boolean(existingId));

 useEffect(()=>{
  if(!remoteDraft||!formRef.current)return;
  for(const [name,value] of Object.entries(remoteDraft)){
   const field=formRef.current.elements.namedItem(name);
   if(!field)continue;
   if(field instanceof HTMLInputElement&&field.type==="checkbox")field.checked=Boolean(value);
   else if("value" in field)(field as HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement).value=String(value??"");
  }
  dismiss();
 },[dismiss,remoteDraft]);

 const publishDraft=()=>{
  if(!existingId||!formRef.current)return;
  const values:Record<string,string|boolean>={};
  for(const element of Array.from(formRef.current.elements)){
   if(!(element instanceof HTMLInputElement||element instanceof HTMLTextAreaElement||element instanceof HTMLSelectElement)||!element.name)continue;
   values[element.name]=element instanceof HTMLInputElement&&element.type==="checkbox"?element.checked:element.value;
  }
  publish(values);
 };

 return <form ref={formRef} action={action} onChange={()=>{
  if(draftTimer.current)window.clearTimeout(draftTimer.current);
  draftTimer.current=window.setTimeout(publishDraft,120);
 }} onSubmit={async event=>{
  if(typeof navigator==="undefined"||navigator.onLine)return;
  event.preventDefault();
  setError("");
  const formData=new FormData(event.currentTarget);
  const parsed=parseDeckFormData(formData);
  if(!parsed.name){setError("Deck name is required.");return;}
  if(!parsed.workspace_id&&!existing?.workspaceId){setError("Choose a workspace before saving offline.");return;}
  const deckId=existingId||crypto.randomUUID();
  const templateId=crypto.randomUUID();
  const now=new Date().toISOString();
  const deck={
   id:deckId,userId,workspaceId:parsed.workspace_id||existing?.workspaceId||"",ownerId:existing?.ownerId||userId,name:parsed.name,description:parsed.description,
   visibility:parsed.visibility,settings:parsed.settings,createdAt:existing?.createdAt||now,updatedAt:now
  };
  await offlineStore.decks.put(deck);
  await queueMutation({id:crypto.randomUUID(),userId,entityType:"decks",operation:"upsert",entityId:deckId,payload:{
   id:deckId,workspace_id:parsed.workspace_id,owner_id:userId,name:parsed.name,description:parsed.description,visibility:parsed.visibility,settings:parsed.settings
  }});
  if(!existingId) await queueMutation({id:crypto.randomUUID(),userId,entityType:"card_templates",operation:"upsert",entityId:templateId,payload:{
   id:templateId,deck_id:deckId,name:"Basic",front_template:"{{front}}",back_template:"{{back}}",css:"",field_schema:[{name:"front",type:"text"},{name:"back",type:"text"}]
  }});
  router.push((redirectTo||"/decks/"+deckId)+"?offline_saved=1");
  router.refresh();
 }}>{error?<div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{error}</div>:null}{existingId?<div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Live draft collaboration is enabled for this deck.</div>:null}{children}</form>;
}
