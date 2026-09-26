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
  const {error:cleanupError}=await supabase.storage.from("user-media").remove([path]);
  const message=cleanupError?error.message+" Cleanup failed: "+cleanupError.message:error.message;
  redirect("/export?error="+encodeURIComponent(message));
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
  const {error:storageError}=await supabase.storage.from("user-media").remove([version.storage_path]);
  if(storageError)redirect("/export?error="+encodeURIComponent(storageError.message));
  const {error:deleteError}=await supabase.from("backup_versions").delete().eq("id",id).eq("user_id",user.id);
  if(deleteError)redirect("/export?error="+encodeURIComponent(deleteError.message));
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
  const {data:record,error:recordError}=await supabase.from("backup_versions").select("checksum").eq("id",id).eq("user_id",user.id).maybeSingle();
  if(recordError)throw new Error(recordError.message);
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


function nextBackupRun(frequency:"daily"|"weekly"|"monthly",from=new Date()){
 const next=new Date(from);
 if(frequency==="daily")next.setUTCDate(next.getUTCDate()+1);
 else if(frequency==="weekly")next.setUTCDate(next.getUTCDate()+7);
 else next.setUTCMonth(next.getUTCMonth()+1);
 next.setUTCHours(2,0,0,0);
 return next.toISOString();
}

export async function updateBackupSchedule(formData:FormData):Promise<void>{
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/login");
 const frequency=(String(formData.get("frequency")||"weekly") as "daily"|"weekly"|"monthly");
 const safeFrequency: "daily"|"weekly"|"monthly" = frequency==="daily"?"daily":frequency==="monthly"?"monthly":"weekly";
 const enabled=formData.get("enabled")==="on";
 const nextRun=enabled?nextBackupRun(safeFrequency):null;
 const {error}=await supabase.from("backup_schedules").upsert({
  user_id:user.id,frequency:safeFrequency,enabled,next_run_at:nextRun,updated_at:new Date().toISOString()
 },{onConflict:"user_id"});
 if(error)redirect("/export?error="+encodeURIComponent(error.message));
 revalidatePath("/export");
 redirect("/export?backup=schedule");
}
