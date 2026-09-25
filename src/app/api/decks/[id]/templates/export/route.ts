import {NextRequest,NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";

export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return new Response("Unauthorized",{status:401});
 const {data}=await supabase.from("card_templates").select("id,name,front_template,back_template,css,field_schema,created_at,updated_at").eq("deck_id",id).limit(100);
 return new NextResponse(JSON.stringify({format:"shyraq-templates-v1",exportedAt:new Date().toISOString(),deckId:id,templates:data??[]},null,2),{headers:{"Content-Type":"application/json","Content-Disposition":'attachment; filename="shyraq-templates.json"'}});
}
