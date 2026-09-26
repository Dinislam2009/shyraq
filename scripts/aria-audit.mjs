import {readdir,readFile} from "node:fs/promises";
import {join,relative} from "node:path";

const ROOT="src/app";
const failures:string[]=[];

async function walk(dir:string){
 const entries=await readdir(dir,{withFileTypes:true});
 const files:string[]=[];
 for(const entry of entries){
  const path=join(dir,entry.name);
  if(entry.isDirectory())files.push(...await walk(path));
  else if(entry.isFile()&&path.endsWith(".tsx"))files.push(path);
 }
 return files;
}

function stripComments(source:string){
 return source.replace(/\/\*[\s\S]*?\*\//g,"").replace(/\/\/.*$/gm,"");
}

const files=await walk(ROOT);
for(const file of files){
 const source=stripComments(await readFile(file,"utf8"));
 const rel=relative(process.cwd(),file);

 for(const match of source.matchAll(/<img\b([\s\S]*?)>/g)){
  const attrs=match[1];
  if(!/\balt\s*=/.test(attrs))failures.push(rel+": img without alt");
 }
 for(const match of source.matchAll(/<button\b([\s\S]*?)>([\s\S]*?)<\/button>/g)){
  const attrs=match[1],body=match[2];
  if(!/\baria-label\s*=|\btitle\s*=/.test(attrs)&&!body.replace(/\{[\s\S]*?\}/g,"").trim()){
   failures.push(rel+": button without accessible name");
  }
 }
 for(const match of source.matchAll(/<input\b([^>]*)>/g)){
  const attrs=match[1];
  if(/type\s*=\s*["'](?:hidden|checkbox|radio)["']/.test(attrs))continue;
  if(!/\baria-label\s*=|\bplaceholder\s*=|\bid\s*=/.test(attrs))failures.push(rel+": input without label/placeholder/id");
 }
}

console.log("ARIA/static accessibility audit:",JSON.stringify({files:files.length,failures}));
if(failures.length)throw new Error(failures.slice(0,50).join("\n"));
