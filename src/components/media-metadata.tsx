"use client";
import {useState} from "react";

function formatDuration(seconds:number){
 if(!Number.isFinite(seconds)||seconds<=0)return "";
 const total=Math.round(seconds);return Math.floor(total/60)+":"+String(total%60).padStart(2,"0");
}

export function MediaMetadata({url,mimeType}:{url:string;mimeType:string}){
 const [duration,setDuration]=useState("");
 const [dimensions,setDimensions]=useState("");
 if(!url)return null;
 if(mimeType.startsWith("audio/")){
  return <audio src={url} preload="metadata" onLoadedMetadata={event=>setDuration(formatDuration(event.currentTarget.duration))} className="sr-only" aria-hidden="true"><span>{duration}</span></audio>;
 }
 if(mimeType.startsWith("video/")){
  return <video src={url} preload="metadata" onLoadedMetadata={event=>{setDuration(formatDuration(event.currentTarget.duration));setDimensions(event.currentTarget.videoWidth+"×"+event.currentTarget.videoHeight)}} className="sr-only" aria-hidden="true"><span>{dimensions}</span></video>;
 }
 if(mimeType.startsWith("image/")){
  return <img src={url} alt="" className="hidden" onLoad={event=>setDimensions(event.currentTarget.naturalWidth+"×"+event.currentTarget.naturalHeight)} aria-hidden="true"/>;
 }
 return null;
}

export function MediaMetadataText({mimeType,duration,dimensions}:{mimeType:string;duration:string;dimensions:string}){
 const parts=[dimensions,duration].filter(Boolean);
 return parts.length?<span>{parts.join(" · ")}</span>:null;
}
