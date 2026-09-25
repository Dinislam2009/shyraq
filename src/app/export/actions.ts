"use server";
import {createHash} from "node:crypto";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {buildJsonBackup} from "@/lib/backup/json";
import {restoreBackup} from "@/app/import/actions";

export async function createBackupVersion(){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/login");
 const payload=await buildJsonBackup(supabase,user);
 const bytes=new TextEncoder().encode(JSON.stringify(payload,null,2));
 const checksum=createHash("sha256").update(bytes).digest("hex");
 const path=user.id+"/backups/"+new Date().toISOString().replace(/[:.]/g,"-")+"-"+crypto.randomUUID()+".json";
 const {error:uploadError}=await supabase.storage.from("user-media").upload(path,bytes,{contentType:"application/json",upsert:false});
 if(uploadError)redirect("/export?error="+encodeURIComponent(uploadError.message));
 const {error}=await supabase.from("backup_versions").insert({user_id:user.id,format:"json",storage_path:path,size_bytes:bytes.byteLength,checksum});
 if(error){
  await supabase.storage.from("user-media").remove([path]);
  redirect("/export?error="+encodeURIComponent(error.message));
 }
 revalidatePath("/export");
 redirect("/export?backup=created");
}

export async function deleteBackupVersion(id:string){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/login");
 const {data:version}=await supabase.from("backup_versions").select("id,storage_path").eq("id",id).eq("user_id",user.id).maybeSingle();
 if(version){
  await supabase.storage.from("user-media").remove([version.storage_path]);
  await supabase.from("backup_versions").delete().eq("id",id).eq("user_id",user.id);
 }
 revalidatePath("/export");
 redirect("/export?backup=deleted");
}

export async function restoreBackupVersion(id:string){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/login");
 const {data:version}=await supabase.from("backup_versions").select("storage_path").eq("id",id).eq("user_id",user.id).maybeSingle();
 if(!version)redirect("/export?error=Backup+not+found.");
 const {data:file,error:downloadError}=await supabase.storage.from("user-media").download(version.storage_path);
 if(downloadError||!file)redirect("/export?error="+encodeURIComponent(downloadError?.message||"Backup download failed."));
 try{
  const bytes=new Uint8Array(await file.arrayBuffer());
  const checksum=createHash("sha256").update(bytes).digest("hex");
  const {data:record}=await supabase.from("backup_versions").select("checksum").eq("id",id).eq("user_id",user.id).maybeSingle();
  if(record?.checksum&&record.checksum!==checksum)throw new Error("Backup integrity check failed.");
  const payload=JSON.parse(new TextDecoder().decode(bytes));
  const {data:workspace}=await supabase.from("workspaces").select("id").eq("owner_id",user.id).eq("kind","personal").limit(1).maybeSingle();
  if(!workspace)throw new Error("Personal workspace not found.");
  const result=await restoreBackup(supabase,user.id,workspace.id,payload);
  revalidatePath("/decks");revalidatePath("/history");revalidatePath("/statistics");
  redirect("/export?restored="+result.restoredCards);
 }catch(error){
  redirect("/export?error="+encodeURIComponent(error instanceof Error?error.message:"Unable to restore backup."));
 }
}
