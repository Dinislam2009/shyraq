import Link from "next/link";
import {AppShell} from "@/components/app-shell";
import {createCard} from "@/app/decks/[id]/cards/actions";
import {CardEditor} from "@/components/card-editor";
import {createClient} from "@/lib/supabase/server";

export default async function NewCardPage({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const supabase=await createClient();
 const {data:templates}=await supabase.from("card_templates").select("id,name,front_template,back_template,css").eq("deck_id",id).order("created_at");
 const {data:{user}}=await supabase.auth.getUser();
 let mediaLibrary:any[]=[];
 if(user){
  const {data:workspace}=await supabase.from("workspaces").select("id").eq("owner_id",user.id).eq("kind","personal").limit(1).maybeSingle();
  if(workspace){
   const {data:media}=await supabase.from("media").select("storage_path,mime_type").eq("workspace_id",workspace.id).order("created_at",{ascending:false}).limit(40);
   mediaLibrary=await Promise.all((media??[]).map(async (item:any)=>{const {data}=await supabase.storage.from("user-media").createSignedUrl(item.storage_path,3600);return {path:item.storage_path,url:data?.signedUrl||"",mimeType:item.mime_type||"",name:String(item.storage_path).split("/").pop()||"media"};}));
  }
 }
 return <AppShell><div className="mx-auto max-w-5xl px-5 py-8 sm:px-8"><Link href={"/decks/"+id} className="text-sm text-slate-400 hover:text-slate-700">← Back to deck</Link><h1 className="mt-6 text-3xl font-semibold tracking-tight">Add card</h1><p className="mt-2 text-sm text-slate-500">Write on the left and see the study card on the right.</p><CardEditor action={createCard.bind(null,id)} templates={templates??[]} mediaLibrary={mediaLibrary}/></div></AppShell>;
}