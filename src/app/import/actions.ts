"use server";
import {createClient} from "@/lib/supabase/server";
import {revalidatePath} from "next/cache";
function csvLine(line:string){const out:string[]=[];let current="";let quoted=false;for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'){if(quoted&&line[i+1]==='"'){current+='"';i++;}else quoted=!quoted;}else if(ch===","&&!quoted){out.push(current);current="";}else current+=ch;}out.push(current);return out;}
export async function importCards(formData:FormData){
 const file=formData.get("file");const text=typeof file==="object"&&file&&"text" in file?await (file as File).text():"";if(!text)return {error:"Choose a file."};
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return {error:"Authentication required."};const {data:workspace}=await supabase.from("workspaces").select("id").eq("owner_id",user.id).eq("kind","personal").limit(1).maybeSingle();if(!workspace)return {error:"Personal workspace not found."};
 let rows:{front:string;back:string}[]=[];
 if(file instanceof File&&file.name.toLowerCase().endsWith(".json")){const data=JSON.parse(text);const source=(data.decks??[]).flatMap((d:any)=>d.cards??[]);rows=source.map((c:any)=>({front:String(c.content?.front??""),back:String(c.content?.back??"")})).filter((x:any)=>x.front||x.back);}
 else {const lines=text.split(/\r?\n/).filter(Boolean);const header=csvLine(lines.shift()??"").map(x=>x.toLowerCase());const fi=Math.max(0,header.indexOf("front"));const bi=Math.max(1,header.indexOf("back"));rows=lines.map(line=>{const p=csvLine(line);return {front:p[fi]??"",back:p[bi]??""};}).filter(x=>x.front||x.back);}
 if(!rows.length)return {error:"No cards found."};
 const name="Imported "+new Date().toLocaleDateString("en-GB");const {data:deck,error}=await supabase.from("decks").insert({workspace_id:workspace.id,owner_id:user.id,name,description:"Imported into Shyraq"}).select("id").single();if(error)return {error:error.message};
 const {error:cardError}=await supabase.from("cards").insert(rows.map((r,i)=>({deck_id:deck.id,owner_id:user.id,kind:"basic",content:r,sort_order:i})));if(cardError)return {error:cardError.message};
 revalidatePath("/decks");return {ok:true,count:rows.length};
}