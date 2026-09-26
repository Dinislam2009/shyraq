import {unzipSync} from "fflate";
import initSqlJs from "sql.js";
import {join} from "node:path";

export type AnkiTemplate={
 id:string;name:string;frontTemplate:string;backTemplate:string;css:string;fields:string[];cloze:boolean;
 sourceModelId:number;ord:number;
};

type ParsedCard={
 front:string;back:string;fields:Record<string,string>;rawFields:Record<string,string>;tags:string[];ord:number;due:number;interval:number;reps:number;lapses:number;factor:number;queue:number;type:number;flags:number;
 sourceCardId:number;modelId:number;modelName:string;deckName:string;mediaNames:string[];kind:"basic"|"cloze";
};

export type ParsedAnki={
 decks:Array<{id:string;name:string;description:string;cards:ParsedCard[]}>;
 media:Record<string,string>;
 mediaFiles:Record<string,Uint8Array>;
 reviews:Array<{cardId:number;timestamp:number;rating:1|2|3|4;interval:number;lastInterval:number;factor:number;timeMs:number;type:number}>;
 templates:AnkiTemplate[];
 warnings:string[];
};

function decode(value:Uint8Array){return new TextDecoder().decode(value);}

function convertAnkiTemplate(source:string){
 let output=String(source||"")
  .replace(/\{\{\s*FrontSide\s*\}\}/gi,"{{front}}")
  .replace(/\{\{\s*BackSide\s*\}\}/gi,"{{back}}")
  .replace(/\{\{\s*Front\s*\}\}/gi,"{{front}}")
  .replace(/\{\{\s*Back\s*\}\}/gi,"{{back}}");
 for(let pass=0;pass<6;pass++){
  const next=output.replace(/\{\{\s*(?:cloze|text|hint|type|field)\s*:\s*([^}]+)\}\}/gi,"{{$1}}");
  if(next===output)break;
  output=next;
 }
 return output;
}

function normalizeHtml(value:string){
 let html=String(value||"").replace(/\r\n/g,"\n");
 html=html.replace(/<br\s*\/?>/gi,"\n");
 html=html.replace(/<\/(?:div|p|li|tr|h[1-6])>/gi,"\n");
 html=html.replace(/<(strong|b)>/gi,"**").replace(/<\/(strong|b)>/gi,"**");
 html=html.replace(/<(em|i)>/gi,"*").replace(/<\/(em|i)>/gi,"*");
 const tick=String.fromCharCode(96);
 html=html.replace(/<code>/gi,tick).replace(/<\/code>/gi,tick);
 html=html.replace(/<pre[^>]*>/gi,"\n\n"+tick+tick+tick+"\n").replace(/<\/pre>/gi,"\n"+tick+tick+tick+"\n");
 return html.replace(/<[^>]+>/g,"").replace(/&nbsp;/gi," ").replace(/&amp;/gi,"&").replace(/&lt;/gi,"<").replace(/&gt;/gi,">").trim();
}

function parseField(value:string,media:Record<string,string>){
 const mediaNames:string[]=[];
 let html=String(value||"").replace(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi,(_,name:string)=>{
  const resolved=media[name]||name;mediaNames.push(resolved);return "__SHYRAQ_MEDIA__"+encodeURIComponent(resolved);
 });
 html=html.replace(/\[sound:([^\]]+)\]/gi,(_,name:string)=>{
  const resolved=media[name]||name;mediaNames.push(resolved);return "__SHYRAQ_MEDIA__"+encodeURIComponent(resolved);
 });
 return {text:normalizeHtml(html),html,mediaNames:[...new Set(mediaNames)]};
}

export async function parseAnkiPackage(bytes:Uint8Array):Promise<ParsedAnki>{
 const files=unzipSync(bytes);
 const collection=files["collection.anki2"]||files["collection.anki21"]||files["collection.sqlite"];
 if(!collection)throw new Error("Invalid Anki package: collection database is missing.");
 const SQL=await initSqlJs({locateFile:file=>join(process.cwd(),"node_modules","sql.js","dist",file)});
 const db=new SQL.Database(collection);
 const colRows=db.exec("select decks, models from col limit 1")[0]?.values?.[0];
 const decksRaw=colRows?JSON.parse(String(colRows[0]||"{}")):{};
 const modelsRaw=colRows?JSON.parse(String(colRows[1]||"{}")):{};
 const media=files.media?JSON.parse(decode(files.media)):{};
 const mediaFiles:Record<string,Uint8Array>={};
 for(const [numericName,originalName] of Object.entries(media)){if(files[numericName])mediaFiles[String(originalName)]=files[numericName];}

 const templates:AnkiTemplate[]=[];
 const warnings:string[]=[];
 const modelFields=new Map<number,string[]>();
 const templateMeta=new Map<string,AnkiTemplate>();

 for(const [id,modelValue] of Object.entries(modelsRaw)){
  const model:any=modelValue;
  const modelId=Number(id);
  const fieldNames=Array.isArray(model?.flds)?model.flds.map((field:any)=>String(field?.name||"Field")).filter(Boolean):[];
  modelFields.set(modelId,fieldNames);
  const sourceTemplates=Array.isArray(model?.tmpls)&&model.tmpls.length?model.tmpls:[{}];
  const css=String(model?.css||"");
  if(css)warnings.push("Template "+String(model?.name||"Anki template")+" includes Anki CSS; Shyraq preserves it, but CSS parity may differ.");

  sourceTemplates.forEach((sourceTemplate:any,index:number)=>{
   const ord=Number.isFinite(Number(sourceTemplate?.ord))?Number(sourceTemplate.ord):index;
   const suffix=sourceTemplates.length>1?" • "+String(sourceTemplate?.name||("Template "+String(ord+1))):"";
   const name=String(sourceTemplate?.name||String(model?.name||"Anki template")+suffix);
   const frontRaw=String(sourceTemplate?.qfmt||"{{front}}");
   const backRaw=String(sourceTemplate?.afmt||"{{back}}");
   const frontTemplate=convertAnkiTemplate(frontRaw);
   const backTemplate=convertAnkiTemplate(backRaw);
   const cloze=model?.type===1||/\{\{\s*cloze\s*:/i.test(frontRaw+" "+backRaw);
   const template={id:String(id)+":"+String(ord),name,frontTemplate,backTemplate,css,fields:fieldNames,cloze,sourceModelId:modelId,ord};
   templates.push(template);
   templateMeta.set(String(id)+":"+String(ord),template);
   if(/\{\{\s*[#^]/.test(frontRaw+" "+backRaw))warnings.push("Template "+template.name+" uses conditional sections that require compatibility review.");
   if(/\{\{\s*[^}:]+\s*:\s*(?:text|cloze|hint)/i.test(frontRaw+" "+backRaw))warnings.push("Template "+template.name+" uses Anki filters; common text/cloze/hint filters are normalized.");
  });
 }

 const deckMap=new Map<number,{id:string;name:string;description:string;cards:ParsedCard[]}>();
 for(const [id,deck] of Object.entries(decksRaw)){
  deckMap.set(Number(id),{id:String(id),name:String((deck as any).name||"Imported deck"),description:"Imported from Anki",cards:[]});
 }

 const noteValues=db.exec("select id,mid,tags,flds from notes")[0]?.values||[];
 const notes=new Map<number,{fields:string[];tags:string[];mid:number}>();
 for(const row of noteValues){
  notes.set(Number(row[0]),{fields:String(row[3]||"").split("\x1f"),tags:String(row[2]||"").trim().split(/\s+/).filter(Boolean),mid:Number(row[1])});
 }

 const cardValues=db.exec("select id,nid,did,ord,due,ivl,factor,reps,lapses,queue,type,flags from cards")[0]?.values||[];
 for(const row of cardValues){
  const note=notes.get(Number(row[1]));if(!note)continue;
  let deck=deckMap.get(Number(row[2]));
  if(!deck){deck={id:String(row[2]),name:"Imported deck",description:"Imported from Anki",cards:[]};deckMap.set(Number(row[2]),deck);}
  const template=templateMeta.get(String(note.mid)+":"+String(Number(row[3])))||templateMeta.get(String(note.mid)+":0");
  const fieldNames=modelFields.get(note.mid)??template?.fields??[];
  const fields:Record<string,string>={};
  const rawFields:Record<string,string>={};
  fieldNames.forEach((name,index)=>{
   const parsedField=parseField(note.fields[index]||"",media);
   fields[name]=parsedField.text;
   rawFields[name]=parsedField.html;
  });
  const front=parseField(note.fields[0]||"",media);
  const back=parseField(note.fields[1]||"",media);
  const mediaNames=[...new Set([...Object.values(fields).flatMap(value=>parseField(value,media).mediaNames),...front.mediaNames,...back.mediaNames])];
  const kind=template?.cloze||/\{\{c\d+::/i.test(Object.values(fields).join(" "))?"cloze":"basic";
  deck.cards.push({
   front:front.text,back:back.text,fields,rawFields,tags:note.tags,ord:Number(row[3]),due:Number(row[4]),interval:Number(row[5]),
   factor:Number(row[6]),reps:Number(row[7]),lapses:Number(row[8]),queue:Number(row[9]),type:Number(row[10]),flags:Number(row[11]),sourceCardId:Number(row[0]),modelId:note.mid,modelName:String((modelsRaw[String(note.mid)] as any)?.name||"Anki card"),deckName:deck.name,mediaNames,kind
  });
 }

 const reviewValues=db.exec("select cid,id,ease,ivl,lastIvl,factor,time,type from revlog")[0]?.values||[];
 const reviews=reviewValues.map(row=>({
  cardId:Number(row[0]),timestamp:Number(row[1]),rating:Math.max(1,Math.min(4,Number(row[2]))) as 1|2|3|4,
  interval:Number(row[3]),lastInterval:Number(row[4]),factor:Number(row[5]),timeMs:Number(row[6]),type:Number(row[7])
 }));
 db.close();
 return {decks:[...deckMap.values()],media,mediaFiles,reviews,templates,warnings:[...new Set(warnings)]};
}
