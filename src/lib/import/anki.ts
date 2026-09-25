import {unzipSync} from "fflate";
import initSqlJs from "sql.js";
import {join} from "node:path";

type ParsedCard={
 front:string;back:string;tags:string[];ord:number;due:number;interval:number;reps:number;lapses:number;factor:number;sourceCardId:number;mediaNames:string[];
};
export type ParsedAnki={
 decks:Array<{id:string;name:string;description:string;cards:ParsedCard[]}>;
 media:Record<string,string>;
 mediaFiles:Record<string,Uint8Array>;
 reviews:Array<{cardId:number;timestamp:number;rating:1|2|3|4;interval:number;lastInterval:number;factor:number;timeMs:number;type:number}>;
};

function decode(value:Uint8Array){return new TextDecoder().decode(value);}
function parseField(value:string,media:Record<string,string>){
 const mediaNames:string[]=[];
 let html=value.replace(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi,(_,name:string)=>{mediaNames.push(media[name]||name);return "__SHYRAQ_MEDIA__"+encodeURIComponent(media[name]||name);});
 html=html.replace(/\[sound:([^\]]+)\]/gi,(_,name:string)=>{mediaNames.push(media[name]||name);return "__SHYRAQ_MEDIA__"+encodeURIComponent(media[name]||name);});
 html=html.replace(/<br\s*\/?>(?=)/gi,"\n").replace(/<[^>]+>/g,"").replace(/&nbsp;/g," ").trim();
 return {text:html,mediaNames:[...new Set(mediaNames)]};
}

export async function parseAnkiPackage(bytes:Uint8Array):Promise<ParsedAnki>{
 const files=unzipSync(bytes);
 const collection=files["collection.anki2"]||files["collection.anki21"]||files["collection.sqlite"];
 if(!collection)throw new Error("Invalid Anki package: collection database is missing.");
 const SQL=await initSqlJs({locateFile:file=>join(process.cwd(),"node_modules","sql.js","dist",file)});
 const db=new SQL.Database(collection);
 const colRows=db.exec("select decks, models from col limit 1")[0]?.values?.[0];
 const decksRaw=colRows?JSON.parse(String(colRows[0]||"{}")):{};
 const media=files.media?JSON.parse(decode(files.media)):{};
 const mediaFiles:Record<string,Uint8Array>={};
 for(const [numericName,originalName] of Object.entries(media)){if(files[numericName])mediaFiles[String(originalName)]=files[numericName];}
 const deckMap=new Map<number,{id:string;name:string;description:string;cards:ParsedCard[]}>();
 for(const [id,deck] of Object.entries(decksRaw))deckMap.set(Number(id),{id:String(id),name:String((deck as any).name||"Imported deck"),description:"Imported from Anki",cards:[]});
 const noteValues=db.exec("select id,mid,tags,flds from notes")[0]?.values||[];
 const notes=new Map<number,{fields:string[];tags:string[]}>();
 for(const row of noteValues)notes.set(Number(row[0]),{fields:String(row[3]||"").split("\x1f"),tags:String(row[2]||"").trim().split(/\s+/).filter(Boolean)});
 const cardValues=db.exec("select id,nid,did,ord,due,ivl,factor,reps,lapses from cards")[0]?.values||[];
 for(const row of cardValues){
  const note=notes.get(Number(row[1]));if(!note)continue;
  let deck=deckMap.get(Number(row[2]));
  if(!deck){deck={id:String(row[2]),name:"Imported deck",description:"Imported from Anki",cards:[]};deckMap.set(Number(row[2]),deck);}
  const front=parseField(note.fields[0]||"",media);const back=parseField(note.fields[1]||"",media);
  deck.cards.push({front:front.text,back:back.text,tags:note.tags,ord:Number(row[3]),due:Number(row[4]),interval:Number(row[5]),factor:Number(row[6]),reps:Number(row[7]),lapses:Number(row[8]),sourceCardId:Number(row[0]),mediaNames:[...new Set([...front.mediaNames,...back.mediaNames])]});
 }
 const reviewValues=db.exec("select cid,id,ease,ivl,lastIvl,factor,time,type from revlog")[0]?.values||[];
 const reviews=reviewValues.map(row=>({cardId:Number(row[0]),timestamp:Number(row[1]),rating:Math.max(1,Math.min(4,Number(row[2]))) as 1|2|3|4,interval:Number(row[3]),lastInterval:Number(row[4]),factor:Number(row[5]),timeMs:Number(row[6]),type:Number(row[7])}));
 db.close();
 return {decks:[...deckMap.values()],media,mediaFiles,reviews};
}