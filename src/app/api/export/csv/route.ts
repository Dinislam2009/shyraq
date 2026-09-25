import {createClient} from "@/lib/supabase/server";
function esc(v:string){return '"'+v.replaceAll('"','""')+'"';}
export async function GET(){
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser();
 if(!user)return new Response("Unauthorized",{status:401});
 const {data}=await supabase.from("cards").select("id,deck_id,kind,content,sort_order,created_at,updated_at").eq("owner_id",user.id).order("created_at");
 const header=["id","deck_id","kind","front","back","tags","options","answer","image_url","sort_order","created_at","updated_at"];
 const lines=[header.join(","),...(data??[]).map((c:any)=>{
  const content=c.content??{};
  const values=[c.id,c.deck_id,c.kind,content.front??"",content.back??"",Array.isArray(content.tags)?content.tags.join(", "):"",Array.isArray(content.options)?content.options.join("|"):"",content.answer??"",content.imageUrl??"",c.sort_order,c.created_at,c.updated_at];
  return values.map((v:any)=>esc(String(v??""))).join(",");
 })];
 return new Response(lines.join("\n"),{headers:{"Content-Type":"text/csv;charset=utf-8","Content-Disposition":'attachment; filename="shyraq-cards.csv"'}});
}
