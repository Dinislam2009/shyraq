"use client";

import {useRef,useState} from "react";

export function CompressedImageInput({name,accept,className}:{name:string;accept:string;className?:string}){
 const inputRef=useRef<HTMLInputElement|null>(null);
 const [status,setStatus]=useState("");
 async function onChange(){
  const input=inputRef.current;
  const file=input?.files?.[0];
  if(!input||!file)return;
  if(!file.type.startsWith("image/")||file.size<=1024*1024||file.type==="image/gif"||file.type==="image/svg+xml"){
   setStatus(file.type.startsWith("image/")?Math.round(file.size/1024)+" KB":"");
   return;
  }
  try{
   const bitmap=await createImageBitmap(file);
   const maxDimension=2048;
   const scale=Math.min(1,maxDimension/Math.max(bitmap.width,bitmap.height));
   const canvas=document.createElement("canvas");
   canvas.width=Math.max(1,Math.round(bitmap.width*scale));
   canvas.height=Math.max(1,Math.round(bitmap.height*scale));
   const context=canvas.getContext("2d");
   if(!context)throw new Error("Canvas unavailable.");
   context.drawImage(bitmap,0,0,canvas.width,canvas.height);
   bitmap.close();
   const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,"image/webp",0.82));
   if(!blob||blob.size>=file.size){
    setStatus(Math.round(file.size/1024)+" KB");
    return;
   }
   const compressed=new File([blob],file.name.replace(/\.[^.]+$/,"")+".webp",{type:"image/webp",lastModified:Date.now()});
   const transfer=new DataTransfer();
   transfer.items.add(compressed);
   input.files=transfer.files;
   setStatus(Math.round(file.size/1024)+" → "+Math.round(compressed.size/1024)+" KB");
  }catch{
   setStatus(Math.round(file.size/1024)+" KB");
  }
 }
 return <div>
  <input ref={inputRef} name={name} type="file" accept={accept} onChange={()=>void onChange()} className={className}/>
  {status?<p className="mt-1 text-[11px] text-slate-400">Image: {status}</p>:null}
 </div>;
}
