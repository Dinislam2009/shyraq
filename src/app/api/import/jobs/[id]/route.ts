import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {parseStandardText,validateImportRows,duplicateKey} from "@/lib/import/standard";

const CHUNK_SIZE=500;

export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const {data:job}=await supabase.from("import_jobs").select("id,deck_id,source_name,total_rows,processed_rows,created_rows,replaced_rows,skipped_rows,status,error,created_at,updated_at,completed_at").eq("id",id).eq("user_id",user.id).maybeSingle();
 if(!job)return NextResponse.json({error:"Import job not found."},{status:404});
 return NextResponse.json(job);
}

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const {data:job}=await supabase.from("import_jobs").select("*").eq("id",id).eq("user_id",user.id).maybeSingle();
 if(!job)return NextResponse.json({error:"Import job not found."},{status:404});
 if(["completed","failed","cancelled"].includes(String(job.status)))return NextResponse.json(job);
 await supabase.from("import_jobs").update({status:"processing",updated_at:new Date().toISOString()}).eq("id",id).eq("user_id",user.id);

 try{
  const {data:file,error:fileError}=await supabase.storage.from("user-media").download(job.storage_path);
  if(fileError||!file)throw new Error(fileError?.message||"Import source file could not be loaded.");
  const rows=parseStandardText(await file.text(),job.source_name);
  const issues=validateImportRows(rows);
  if(issues.length)throw new Error("Validation failed: "+issues.slice(0,8).map(issue=>"row "+issue.row+" "+issue.message).join("; "));
  const start=Number(job.processed_rows||0);
  const chunk=rows.slice(start,start+CHUNK_SIZE);
  if(!chunk.length){
   const completedAt=new Date().toISOString();
   await supabase.from("import_jobs").update({status:"completed",processed_rows:rows.length,total_rows:rows.length,updated_at:completedAt,completed_at:completedAt}).eq("id",id).eq("user_id",user.id);
   await supabase.storage.from("user-media").remove([job.storage_path]);
   return NextResponse.json({...job,status:"completed",processed_rows:rows.length,total_rows:rows.length});
  }

  const {data:existing,error:existingError}=await supabase.from("cards").select("id,content,kind,is_suspended,is_marked").eq("owner_id",user.id).limit(50000);
  if(existingError)throw new Error(existingError.message);
  const byKey=new Map<string,any>((existing??[]).map((card:any)=>[duplicateKey({front:String(card.content?.front||""),back:String(card.content?.back||"")}),card]));
  let created=0,replaced=0,skipped=0;
  for(const row of chunk){
   const duplicate=byKey.get(duplicateKey(row));
   const payload={front:row.front,back:row.back,tags:row.tags,options:row.options,answer:row.answer,imageUrl:row.imageUrl,fields:row.fields};
   if(duplicate&&job.duplicate_mode==="skip"){skipped++;continue;}
   if(duplicate&&job.duplicate_mode==="replace"){
    const {error}=await supabase.from("cards").update({kind:row.kind,content:payload}).eq("id",duplicate.id);
    if(error)throw new Error(error.message);
    replaced++;
    continue;
   }
   const {error}=await supabase.from("cards").insert({deck_id:job.deck_id,owner_id:user.id,kind:row.kind,content:payload,sort_order:start+created}).select("id").single();
   if(error)throw new Error(error.message);
   created++;
  }

  const processed=Math.min(rows.length,start+chunk.length);
  const completed=processed>=rows.length;
  const update={
   status:completed?"completed":"queued",
   processed_rows:processed,
   total_rows:rows.length,
   created_rows:Number(job.created_rows||0)+created,
   replaced_rows:Number(job.replaced_rows||0)+replaced,
   skipped_rows:Number(job.skipped_rows||0)+skipped,
   updated_at:new Date().toISOString(),
   completed_at:completed?new Date().toISOString():null
  };
  const {error:updateError}=await supabase.from("import_jobs").update(update).eq("id",id).eq("user_id",user.id);
  if(updateError)throw new Error(updateError.message);
  if(completed)await supabase.storage.from("user-media").remove([job.storage_path]);
  return NextResponse.json({...job,...update});
 }catch(error){
  const message=error instanceof Error?error.message:"Import failed.";
  await supabase.from("import_jobs").update({status:"failed",error:message,updated_at:new Date().toISOString()}).eq("id",id).eq("user_id",user.id);
  return NextResponse.json({error:message},{status:500});
 }
}
