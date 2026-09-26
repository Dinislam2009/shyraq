import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {parseStandardText,validateImportRows} from "@/lib/import/standard";

export async function POST(request:Request){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const form=await request.formData();
 const file=form.get("file");
 if(!(file instanceof File)||file.size===0)return NextResponse.json({error:"Choose an import file."},{status:400});
 if(file.size>200*1024*1024)return NextResponse.json({error:"Import file is larger than 200 MB."},{status:400});
 const filename=file.name.toLowerCase();
 if(filename.endsWith(".zip")||filename.endsWith(".apkg"))return NextResponse.json({error:"Resumable jobs support CSV, TSV, TXT and standard JSON imports."},{status:400});
 const raw=String(form.get("duplicate_mode")||"skip");
 const duplicateMode: "create"|"skip"|"replace" = raw==="create"||raw==="replace"?raw:"skip";
 const {data:workspace}=await supabase.from("workspaces").select("id").eq("owner_id",user.id).eq("kind","personal").limit(1).maybeSingle();
 if(!workspace)return NextResponse.json({error:"Personal workspace not found."},{status:400});
 const text=await file.text();
 let rows;
 try{rows=parseStandardText(text,file.name);}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Unable to parse import."},{status:400});}
 const issues=validateImportRows(rows);
 if(issues.length)return NextResponse.json({error:"Validation failed: "+issues.slice(0,8).map(issue=>"row "+issue.row+" "+issue.message).join("; ")},{status:400});
 if(!rows.length)return NextResponse.json({error:"No cards were found in this file."},{status:400});
 const jobId=crypto.randomUUID();
 const safe=file.name.toLowerCase().replace(/[^a-z0-9._-]+/g,"-").slice(-100);
 const storagePath=user.id+"/imports/"+jobId+"-"+safe;
 const {error:uploadError}=await supabase.storage.from("user-media").upload(storagePath,file,{contentType:file.type||"text/plain",upsert:false});
 if(uploadError)return NextResponse.json({error:uploadError.message},{status:500});
 const {data:deck,error:deckError}=await supabase.from("decks").insert({workspace_id:workspace.id,owner_id:user.id,name:"Imported "+new Date().toLocaleDateString("en-GB"),description:"Imported into Shyraq",visibility:"private"}).select("id").single();
 if(deckError||!deck){await supabase.storage.from("user-media").remove([storagePath]);return NextResponse.json({error:deckError?.message||"Unable to create import deck."},{status:500});}
 const {error:templateError}=await supabase.from("card_templates").insert({deck_id:deck.id,name:"Basic",front_template:"{{front}}",back_template:"{{back}}",css:"",field_schema:[{name:"front",type:"text"},{name:"back",type:"text"}]});
 if(templateError){await supabase.from("decks").delete().eq("id",deck.id);await supabase.storage.from("user-media").remove([storagePath]);return NextResponse.json({error:templateError.message},{status:500});}
 const {error:jobError}=await supabase.from("import_jobs").insert({id:jobId,user_id:user.id,workspace_id:workspace.id,deck_id:deck.id,storage_path:storagePath,source_name:file.name,format:"standard",duplicate_mode:duplicateMode,total_rows:rows.length,status:"queued"});
 if(jobError){await supabase.from("card_templates").delete().eq("deck_id",deck.id);await supabase.from("decks").delete().eq("id",deck.id);await supabase.storage.from("user-media").remove([storagePath]);return NextResponse.json({error:jobError.message},{status:500});}
 return NextResponse.json({jobId,totalRows:rows.length,status:"queued"});
}
