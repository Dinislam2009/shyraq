import Link from "next/link";
import {notFound} from "next/navigation";
import {AppShell} from "@/components/app-shell";
import {CardEditor} from "@/components/card-editor";
import {updateCard} from "@/app/decks/[id]/cards/actions";
import {createClient} from "@/lib/supabase/server";

export default async function EditCardPage({params}:{params:Promise<{id:string;cardId:string}>}){
 const {id,cardId}=await params;
 const supabase=await createClient();
 const {data:card}=await supabase
  .from("cards")
  .select("id,kind,content,template_id,deck_id")
  .eq("id",cardId)
  .eq("deck_id",id)
  .maybeSingle();
 if(!card)notFound();

 const {data:templates}=await supabase
  .from("card_templates")
  .select("id,name,front_template,back_template")
  .eq("deck_id",id)
  .order("created_at");

 let mediaUrl="";
 if(card.content?.mediaPath){
  const {data}=await supabase.storage.from("user-media").createSignedUrl(card.content.mediaPath,3600);
  mediaUrl=data?.signedUrl||"";
 }
 if(!mediaUrl&&Array.isArray(card.content?.mediaItems)){
  const first=card.content.mediaItems.find((item:any)=>item?.path);
  if(first){
   const {data}=await supabase.storage.from("user-media").createSignedUrl(first.path,3600);
   mediaUrl=data?.signedUrl||"";
  }
 }

 const initial={
  kind:card.kind,
  front:card.content?.front||"",
  back:card.content?.back||"",
  tags:Array.isArray(card.content?.tags)?card.content.tags:[],
  options:Array.isArray(card.content?.options)?card.content.options:[],
  answer:Number(card.content?.answer??0),
  imageUrl:card.content?.imageUrl||"",
  mediaUrl,
  occlusions:Array.isArray(card.content?.occlusions)?card.content.occlusions:[],
  templateId:card.template_id||""
 };

 return <AppShell><div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
  <Link href={"/decks/"+id} className="text-sm text-slate-400 hover:text-slate-700">← Back to deck</Link>
  <h1 className="mt-6 text-3xl font-semibold tracking-tight">Edit card</h1>
  <p className="mt-2 text-sm text-slate-500">Full editor with formatting, media, templates and live preview.</p>
  <CardEditor action={updateCard.bind(null,id,cardId)} templates={templates??[]} initial={initial} submitLabel="Save changes"/>
 </div></AppShell>;
}
