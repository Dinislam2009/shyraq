export type AnkiTemplateSide="front"|"back";

export type AnkiTemplateOptions={
 side?:AnkiTemplateSide;
 frontSide?:string;
 clozeIndex?:number;
 revealCloze?:boolean;
 specialFields?:Record<string,string>;
};

function resolveField(fields:Record<string,string>,key:string){
 const normalized=String(key).trim();
 if(/^frontside$/i.test(normalized))return fields.frontSide??fields.front??"";
 if(Object.prototype.hasOwnProperty.call(fields,normalized))return String(fields[normalized]??"");
 const found=Object.keys(fields).find(name=>name.toLowerCase()===normalized.toLowerCase());
 return found?String(fields[found]??""):"";
}

function stripHtml(value:string){
 return value
  .replace(/<br\s*\/?>/gi,"\n")
  .replace(/<[^>]+>/g,"")
  .replace(/&nbsp;/gi," ")
  .replace(/&amp;/gi,"&")
  .replace(/&lt;/gi,"<")
  .replace(/&gt;/gi,">")
  .trim();
}

function renderCloze(value:string,clozeIndex:number|undefined,revealAll:boolean){
 return value.replace(/\{\{c(\d+)::([\s\S]*?)(?:::([\s\S]*?))?\}\}/gi,(_,ordinal:string,text:string,hint?:string)=>{
  const n=Number(ordinal);
  if(revealAll||clozeIndex===undefined||n!==clozeIndex)return text;
  return '<span class="anki-cloze">['+(hint?String(hint):"...")+']</span>';
 });
}

function renderConditionals(source:string,fields:Record<string,string>){
 let output=source;
 const pattern=/\{\{([#^])\s*([^}]+?)\s*\}\}([\s\S]*?)\{\{\/\s*\2\s*\}\}/g;
 let changed=true;
 while(changed){
  const before=output;
  output=output.replace(pattern,(_,mode:string,key:string,body:string)=>{
   const value=resolveField(fields,key);
   const present=Boolean(value&&stripHtml(value).trim());
   return mode==="#"?present?body:"":present?"":body;
  });
  changed=output!==before;
 }
 return output;
}

export function renderAnkiTemplate(source:string,fields:Record<string,string>,options:AnkiTemplateOptions={}){
 const clozeIndex=options.clozeIndex;
 const revealCloze=options.revealCloze===true;
 const frontSide=options.frontSide??resolveField(fields,"front");
 const merged={...fields,...(options.specialFields||{}),frontSide};
 let output=renderConditionals(String(source||""),merged);
 output=output.replace(/\{\{\s*([^}:]+?)\s*:\s*([^}]+?)\s*\}\}/g,(_,filter:string,key:string)=>{
  const value=resolveField(merged,key);
  switch(String(filter).trim().toLowerCase()){
   case "text": return stripHtml(value);
   case "cloze": return renderCloze(value,clozeIndex,revealCloze);
   case "hint": return value?'<span class="anki-hint">'+value+"</span>":"";
   case "type": return '<span class="anki-type-answer">'+value+"</span>";
   default: return value;
  }
 });
 output=output.replace(/\{\{\s*FrontSide\s*\}\}/gi,frontSide);
 output=output.replace(/\{\{\s*([^}]+?)\s*\}\}/g,(_,key:string)=>resolveField(merged,key));
 return output;
}
