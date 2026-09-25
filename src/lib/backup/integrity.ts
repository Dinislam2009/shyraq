import {createHash} from "node:crypto";

export function verifyArchiveChecksums(archive:Record<string,Uint8Array>){
 const raw=archive["checksums.json"];
 if(!raw)return;
 let manifest:unknown;
 try{manifest=JSON.parse(new TextDecoder().decode(raw));}catch{throw new Error("Invalid backup integrity manifest.");}
 const typed=manifest as {algorithm?:unknown;files?:unknown};
 if(typed.algorithm!=="sha256"||!typed.files||typeof typed.files!=="object"||Array.isArray(typed.files))throw new Error("Unsupported backup integrity manifest.");
 for(const [name,expected] of Object.entries(typed.files as Record<string,unknown>)){
  if(name==="checksums.json")continue;
  const bytes=archive[name];
  if(!bytes)throw new Error("Backup is incomplete: missing "+name+".");
  const actual=createHash("sha256").update(bytes).digest("hex");
  if(actual!==String(expected))throw new Error("Backup integrity check failed for "+name+".");
 }
}
