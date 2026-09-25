import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {parseAnkiPackage} from "@/lib/import/anki";

export async function POST(request:Request){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const form=await request.formData();
 const file=form.get("file");
 if(!(file instanceof File))return NextResponse.json({error:"Choose an .apkg file."},{status:400});
 if(!file.name.toLowerCase().endsWith(".apkg"))return NextResponse.json({error:"Only .apkg files are supported."},{status:400});
 try{
  const parsed=await parseAnkiPackage(new Uint8Array(await file.arrayBuffer()));
  const {data:existingDecks}=await supabase.from("decks").select("name").eq("owner_id",user.id);
  const existingNames=new Set((existingDecks??[]).map((deck:any)=>String(deck.name).trim().toLowerCase()));
  const decks=parsed.decks.map(deck=>({
   id:deck.id,name:deck.name,cards:deck.cards.length,cloze:deck.cards.filter(card=>card.kind==="cloze").length,
   existingName:existingNames.has(deck.name.trim().toLowerCase())
  }));
  return NextResponse.json({
   fileName:file.name,size:file.size,
   decks,decksCount:decks.length,cardsCount:parsed.decks.reduce((sum,deck)=>sum+deck.cards.length,0),
   reviewsCount:parsed.reviews.length,mediaCount:Object.keys(parsed.mediaFiles).length,
   templates:parsed.templates.map(template=>({id:template.id,name:template.name,fields:template.fields,cloze:template.cloze,hasCss:Boolean(template.css)})),
   warnings:parsed.warnings
  });
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Unable to inspect APKG."},{status:400});}
}
