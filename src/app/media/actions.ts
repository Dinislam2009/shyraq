"use server";
import {redirect} from "next/navigation";
import {revalidatePath} from "next/cache";
import {createClient} from "@/lib/supabase/server";

function back(error?:string){redirect("/media"+(error?"?error="+encodeURIComponent(error):""));}

export async function deleteMedia(path:string){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/login");
 const {data:media}=await supabase.from("media").select("storage_path").eq("owner_id",user.id).eq("storage_path",path).maybeSingle();
 if(!media)return back("Media not found.");
 const {data:cards}=await supabase.from("cards").select("content").eq("owner_id",user.id).limit(50000);
 const referenced=(cards??[]).some((card:any)=>JSON.stringify(card.content??{}).includes(path));
 if(referenced)return back("This media is still referenced by a card.");
 await supabase.from("media").delete().eq("owner_id",user.id).eq("storage_path",path);
 await supabase.storage.from("user-media").remove([path]);
 revalidatePath("/media");
 back();
}

export async function cleanupOrphanMedia(){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/login");
 const [{data:media},{data:cards}]=await Promise.all([
  supabase.from("media").select("storage_path").eq("owner_id",user.id),
  supabase.from("cards").select("content").eq("owner_id",user.id).limit(50000)
 ]);
 const content=(cards??[]).map((card:any)=>JSON.stringify(card.content??{}));
 const orphans=(media??[]).map((item:any)=>String(item.storage_path)).filter(path=>!content.some(value=>value.includes(path)));
 if(orphans.length){
  await supabase.from("media").delete().eq("owner_id",user.id).in("storage_path",orphans);
  await supabase.storage.from("user-media").remove(orphans);
 }
 revalidatePath("/media");
 back("Removed "+orphans.length+" orphan file(s).");
}
