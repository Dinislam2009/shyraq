"use client";
import {useRouter} from "next/navigation";
import {ReactNode,useState} from "react";
import {offlineStore,queueMutation} from "@/lib/offline/store";
import {parseDeckFormData} from "@/lib/offline/form-payload";

export function OfflineDeckForm({action,userId,children}:{action:(formData:FormData)=>void|Promise<void>;userId:string;children:ReactNode}){
 const router=useRouter();
 const [error,setError]=useState("");
 return <form action={action} onSubmit={async event=>{
  if(typeof navigator==="undefined"||navigator.onLine)return;
  event.preventDefault();
  setError("");
  const formData=new FormData(event.currentTarget);
  const parsed=parseDeckFormData(formData);
  if(!parsed.name){setError("Deck name is required.");return;}
  if(!parsed.workspace_id){setError("Choose a workspace before saving offline.");return;}
  const deckId=crypto.randomUUID();
  const templateId=crypto.randomUUID();
  const now=new Date().toISOString();
  const deck={
   id:deckId,userId,workspaceId:parsed.workspace_id,ownerId:userId,name:parsed.name,description:parsed.description,
   visibility:parsed.visibility,settings:parsed.settings,createdAt:now,updatedAt:now
  };
  await offlineStore.decks.put(deck);
  await queueMutation({id:crypto.randomUUID(),userId,entityType:"decks",operation:"upsert",entityId:deckId,payload:{
   id:deckId,workspace_id:parsed.workspace_id,owner_id:userId,name:parsed.name,description:parsed.description,visibility:parsed.visibility,settings:parsed.settings
  }});
  await queueMutation({id:crypto.randomUUID(),userId,entityType:"card_templates",operation:"upsert",entityId:templateId,payload:{
   id:templateId,deck_id:deckId,name:"Basic",front_template:"{{front}}",back_template:"{{back}}",css:"",field_schema:[{name:"front",type:"text"},{name:"back",type:"text"}]
  }});
  router.push("/decks/"+deckId+"?offline_saved=1");
  router.refresh();
 }}>{error?<div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{error}</div>:null}{children}</form>;
}
