"use client";

function sanitizeHtml(value:string){
 return String(value||"")
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,"")
  .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi,"")
  .replace(/<object\b[^>]*>[\s\S]*?<\/object>/gi,"")
  .replace(/<embed\b[^>]*>/gi,"")
  .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,"")
  .replace(/javascript\s*:/gi,"")
  .replace(/vbscript\s*:/gi,"")
  .replace(/data\s*:\s*text\/html/gi,"");
}

function sanitizeCss(value:string){
 return String(value||"")
  .replace(/@import[^;]+;/gi,"")
  .replace(/url\s*\(\s*["']?\s*(?:javascript|vbscript):[^)]*\)/gi,"")
  .replace(/expression\s*\([^)]*\)/gi,"");
}

export function AnkiTemplateContent({html,css="",className=""}:{html:string;css?:string;className?:string}){
 return (
  <>
   {css?<style dangerouslySetInnerHTML={{__html:sanitizeCss(css)}}/>:null}
   <div className={"card shyraq-anki-template whitespace-normal break-words leading-7 "+className} dangerouslySetInnerHTML={{__html:sanitizeHtml(html)}}/>
  </>
 );
}

export function sanitizeAnkiTemplateHtml(html:string){return sanitizeHtml(html);}
