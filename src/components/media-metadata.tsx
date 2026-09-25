"use client";
import {useState} from "react";

function formatDuration(seconds:number){
 if(!Number.isFinite(seconds)||seconds<=0)return "";
 const total=Math.round(seconds);
 return Math.floor(total/60)+":"+String(total%60).padStart(2,"0");
}

export function MediaMetadata({url,mimeType}:{url:string;mimeType:string}){
 const [duration,setDuration]=useState("");
 const [dimensions,setDimensions]=useState("");
 const parts=[dimensions,duration].filter(Boolean);
 return <>{mimeType.startsWith("audio/")?<audio src={url} preload="metadata" onLoadedMetadata={event=>setDuration(formatDuration(event.currentTarget.duration))} className="sr-only" aria-hidden="true"/>:null}{mimeType.startsWith("video/")?<video src={url} preload="metadata" onLoadedMetadata={event=>{setDuration(formatDuration(event.currentTarget.duration));setDimensions(event.currentTarget.videoWidth+"×"+event.currentTarget.videoHeight)}} className="sr-only" aria-hidden="true"/>:null}{mimeType.startsWith("image/")?<img src={url} alt="" className="hidden" onLoad={event=>setDimensions(event.currentTarget.naturalWidth+"×"+event.currentTarget.naturalHeight)} aria-hidden="true"/>:null}{parts.length?<span className="ml-1">· {parts.join(" · ")}</span>:null}</>;
}
