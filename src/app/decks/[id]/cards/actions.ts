"use server";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

function fail(path:string,message:string):never{redirect(path+"?error="+encodeURIComponent(message));}
function payload(formData:FormData){
 const kind=String(formData.get("kind")||"basic");
 const content:any={front:String(formData.get("front")||""),back:String(formData.get("back")||"")};
 const templateId=String(formData.get("template_id")||"").trim();
 const tags=String(formData.get("tags")||"").split(",").map(x=>x.trim()).filter(Boolean).slice(0,30);
 if(tags.length)content.tags=tags;
 if(kind==="multiple_choice"){
  content.options=String(formData.get("options")||"").split(",").map(x=>x.trim()).filter(Boolean).slice(0,10);
  content.answer=Math.max(0,Number(formData.get("answer")||0));
 }
 if(kind==="image"){
  const imageUrl=String(formData.get("image_url")||"").trim();
  if(imageUrl)content.imageUrl=imageUrl;
 }
 return {kind,content,template_id:templateId||null};
}
function tagsFromForm(formData:FormData){return String(formData.get("tags")||"").split(",").map(x=>x.trim()).filter(Boolean).slice(0,30);}
async function uploadMedia(supabase:any,userId:string,workspaceId:string,file:File){
 if(!file||file.size===0)return null;
 if(file.size>25*1024*1024)throw new Error("Media file is larger than 25 MB.");
 const safe=file.name.toLowerCase().replace(/[^a-z0-9._-]+/g,"-").slice(-120);
 const path=userId+"/"+crypto.randomUUID()+"-"+safe;
 const {error:uploadError}=await supabase.storage.from("user-media").upload(path,file,{contentType:file.type||"application/octet-stream",upsert:false});
 if(uploadError)throw new Error(uploadError.message);
 const {data,error}=await supabase.from("media").insert({workspace_id:workspaceId,owner_id:userId,storage_path:path,mime_type:file.type||"application/octet-stream",byte_size:file.size}).select("storage_path,mime_type").single();
 if(error)throw new Error(error.message);
 return data;
}

async function applyTags(supabase:any,cardId:string,workspaceId:string,names:string[]){
 if(!names.length){await supabase.from("card_tags").delete().eq("card_id",cardId);return;}
 const {data:tags,error:tagError}=await supabase.from("tags").upsert(names.map(name=>({workspace_id:workspaceId,name})),{onConflict:"workspace_id,name"}).select("id");
 if(tagError)throw new Error(tagError.message);
 const {error:clearError}=await supabase.from("card_tags").delete().eq("card_id",cardId);
 if(clearError)throw new Error(clearError.message);
 if(tags?.length){const {error}=await supabase.from("card_tags").insert(tags.map((tag:any)=>({card_id:cardId,tag_id:tag.id})));if(error)throw new Error(error.message);}
}
export async function createCard(deckId:string,formData:FormData):Promise<void>{
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const {data:deck}=await supabase.from("decks").select("workspace_id").eq("id",deckId).maybeSingle();if(!deck)fail("/decks/"+deckId,"Deck not found.");
 const p=payload(formData);const mediaFile=formData.get("media_file");
 if(mediaFile instanceof File&&mediaFile.size>0){try{const media=await uploadMedia(supabase,user.id,deck.workspace_id,mediaFile);if(media){p.content.mediaPath=media.storage_path;p.content.mediaType=media.mime_type;}}catch(error){fail("/decks/"+deckId+"/cards/new",error instanceof Error?error.message:"Unable to upload media.");}}
 const {data:last}=await supabase.from("cards").select("sort_order").eq("deck_id",deckId).order("sort_order",{ascending:false}).limit(1).maybeSingle();
 const {data:card,error}=await supabase.from("cards").insert({deck_id:deckId,owner_id:user.id,kind:p.kind,content:p.content,template_id:p.template_id,sort_order:(last?.sort_order??-1)+1}).select("id").single();
 if(error||!card)fail("/decks/"+deckId+"/cards/new",error?.message||"Unable to create card.");
 try{await applyTags(supabase,card.id,deck.workspace_id,tagsFromForm(formData));}catch(error){fail("/decks/"+deckId+"/cards/new",error instanceof Error?error.message:"Unable to save tags.");}
 revalidatePath("/decks/"+deckId);redirect("/decks/"+deckId);
}
export async function updateCard(deckId:string,cardId:string,formData:FormData):Promise<void>{
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");const p=payload(formData);const mediaFile=formData.get("media_file");
 const {data:deck}=await supabase.from("decks").select("workspace_id").eq("id",deckId).maybeSingle();
 if(mediaFile instanceof File&&mediaFile.size>0&&deck){try{const media=await uploadMedia(supabase,user.id,deck.workspace_id,mediaFile);if(media){p.content.mediaPath=media.storage_path;p.content.mediaType=media.mime_type;}}catch(error){fail("/decks/"+deckId,error instanceof Error?error.message:"Unable to upload media.");}}
 const {error}=await supabase.from("cards").update(p).eq("id",cardId);if(error)fail("/decks/"+deckId,error.message);
 if(deck){try{await applyTags(supabase,cardId,deck.workspace_id,tagsFromForm(formData));}catch(error){fail("/decks/"+deckId,error instanceof Error?error.message:"Unable to save tags.");}}
 revalidatePath("/decks/"+deckId);redirect("/decks/"+deckId);
}
export async function deleteCard(deckId:string,cardId:string):Promise<void>{
 const supabase=await createClient();const {error}=await supabase.from("cards").delete().eq("id",cardId);if(error)fail("/decks/"+deckId,error.message);
 revalidatePath("/decks/"+deckId);redirect("/decks/"+deckId);
}
export async function setCardFlag(deckId:string,cardId:string,field:"is_marked"|"is_suspended",value:boolean):Promise<void>{
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/login");
 const {error}=await supabase.from("cards").update({[field]:value}).eq("id",cardId).eq("owner_id",user.id);
 if(error)fail("/decks/"+deckId,error.message);
 revalidatePath("/decks/"+deckId);
 revalidatePath("/review");
 redirect("/decks/"+deckId);
}
