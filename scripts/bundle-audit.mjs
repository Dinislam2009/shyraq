import {readdir,readFile,stat} from "node:fs/promises";
import {join} from "node:path";
import {gzipSync} from "node:zlib";

async function walk(dir){
 const entries=await readdir(dir,{withFileTypes:true});
 const files=[];
 for(const entry of entries){
  const path=join(dir,entry.name);
  if(entry.isDirectory())files.push(...await walk(path));
  else if(entry.isFile())files.push(path);
 }
 return files;
}

const root=".next/static";
const files=await walk(root);
const js=files.filter(file=>file.endsWith(".js"));
const css=files.filter(file=>file.endsWith(".css"));
let rawJs=0,gzipJs=0,rawCss=0,gzipCss=0;
for(const file of js){
 const content=await readFile(file);
 rawJs+=content.byteLength;
 gzipJs+=gzipSync(content,{level:9}).byteLength;
}
for(const file of css){
 const content=await readFile(file);
 rawCss+=content.byteLength;
 gzipCss+=gzipSync(content,{level:9}).byteLength;
}
const summary={js:{files:js.length,rawBytes:rawJs,gzipBytes:gzipJs},css:{files:css.length,rawBytes:rawCss,gzipBytes:gzipCss}};
console.log("Bundle audit:",JSON.stringify(summary));
const maxJsGzip=3_000_000;
const maxCssGzip=500_000;
if(gzipJs>maxJsGzip)throw new Error("JS gzip bundle budget exceeded: "+gzipJs+" > "+maxJsGzip);
if(gzipCss>maxCssGzip)throw new Error("CSS gzip bundle budget exceeded: "+gzipCss+" > "+maxCssGzip);
