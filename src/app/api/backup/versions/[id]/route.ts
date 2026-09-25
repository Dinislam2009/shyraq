import {NextRequest,NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";

export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return new Response("Unauthorized",{status:401});
 const {data:version}=await supabase.from("backup_versions").select("storage_path,created_at").eq("id",id).eq("user_id",user.id).maybeSingle();
 if(!version)return new Response("Not found",{status:404});
 const {data,error}=await supabase.storage.from("user-media").download(version.storage_path);
 if(error||!data)return new Response(error?.message||"Download failed",{status:500});
 return new NextResponse(data,{headers:{"Content-Type":"application/json","Content-Disposition":'attachment; filename="shyraq-backup-version.json"'}});
}
