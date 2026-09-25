"use client";

import {useEffect,useRef,useState} from "react";

export type OcclusionRect={x:number;y:number;w:number;h:number};
type Interaction={index:number;mode:"move"|"resize";startX:number;startY:number;original:OcclusionRect;handle?:string};

function clamp(value:number,min:number,max:number){return Math.min(max,Math.max(min,value));}
function normalizeRect(rect:OcclusionRect):OcclusionRect{
 const x=clamp(rect.x,0,1),y=clamp(rect.y,0,1);
 const w=clamp(rect.w,0,1-x),h=clamp(rect.h,0,1-y);
 return {x,y,w,h};
}

export function OcclusionEditor({src,value,onChange}:{src:string;value:OcclusionRect[];onChange:(next:OcclusionRect[])=>void}){
 const frameRef=useRef<HTMLDivElement>(null);
 const drawingRef=useRef<{x:number;y:number}|null>(null);
 const interactionRef=useRef<Interaction|null>(null);
 const [draft,setDraft]=useState<OcclusionRect|null>(null);
 const [selected,setSelected]=useState<number|null>(value.length?value.length-1:null);

 useEffect(()=>{if(!src)onChange([]);},[src,onChange]);

 function point(event:React.PointerEvent){
  const frame=frameRef.current?.getBoundingClientRect();if(!frame)return null;
  return {x:clamp((event.clientX-frame.left)/frame.width,0,1),y:clamp((event.clientY-frame.top)/frame.height,0,1)};
 }

 function startDraw(event:React.PointerEvent){
  if(!src||interactionRef.current)return;
  const p=point(event);if(!p)return;
  if((event.target as HTMLElement).dataset.occlusionRect==="true")return;
  event.currentTarget.setPointerCapture(event.pointerId);
  drawingRef.current=p;setSelected(null);setDraft({x:p.x,y:p.y,w:0,h:0});
 }
 function moveDraw(event:React.PointerEvent){
  const start=drawingRef.current,p=point(event);if(!start||!p)return;
  const x=Math.min(start.x,p.x),y=Math.min(start.y,p.y),w=Math.abs(start.x-p.x),h=Math.abs(start.y-p.y);
  setDraft({x,y,w,h});
 }
 function finishDraw(){
  if(draft&&draft.w>0.02&&draft.h>0.02){onChange([...value,normalizeRect(draft)]);setSelected(value.length);}
  drawingRef.current=null;setDraft(null);
 }

 function beginInteraction(index:number,mode:"move"|"resize",event:React.PointerEvent,handle?:string){
  event.stopPropagation();event.currentTarget.setPointerCapture(event.pointerId);
  const p=point(event);if(!p)return;
  interactionRef.current={index,mode,startX:p.x,startY:p.y,original:{...value[index]},handle};
  setSelected(index);
 }
 function updateInteraction(event:React.PointerEvent){
  const interaction=interactionRef.current,p=point(event);if(!interaction||!p)return;
  const dx=p.x-interaction.startX,dy=p.y-interaction.startY;
  const original=interaction.original;
  let next={...original};
  if(interaction.mode==="move"){
   next.x=clamp(original.x+dx,0,1-original.w);next.y=clamp(original.y+dy,0,1-original.h);
  }else{
   const handle=interaction.handle||"se";
   const left=original.x,right=original.x+original.w,top=original.y,bottom=original.y+original.h;
   let nl=left,nr=right,nt=top,nb=bottom;
   if(handle.includes("w"))nl=clamp(left+dx,0,right-0.02);
   if(handle.includes("e"))nr=clamp(right+dx,nl+0.02,1);
   if(handle.includes("n"))nt=clamp(top+dy,0,bottom-0.02);
   if(handle.includes("s"))nb=clamp(bottom+dy,nt+0.02,1);
   next={x:nl,y:nt,w:nr-nl,h:nb-nt};
  }
  const copy=[...value];copy[interaction.index]=normalizeRect(next);onChange(copy);
 }
 function endInteraction(){interactionRef.current=null;}

 function removeSelected(){
  if(selected===null)return;
  onChange(value.filter((_,index)=>index!==selected));setSelected(null);
 }

 const preview=[...value,...(draft?[draft]:[])];
 const handles=["nw","ne","sw","se"];
 return <div>
  <div ref={frameRef} onPointerDown={startDraw} onPointerMove={event=>{moveDraw(event);updateInteraction(event);}} onPointerUp={event=>{finishDraw();endInteraction();}} onPointerCancel={event=>{finishDraw();endInteraction();}} className="relative mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 select-none touch-none">
   {src?<img src={src} alt="" draggable={false} className="block max-h-[32rem] w-full object-contain"/>:<div className="flex min-h-48 items-center justify-center p-6 text-sm text-slate-400">Choose an image to draw occlusion areas.</div>}
   {src&&preview.map((rect,index)=>(
    <div key={index} data-occlusion-rect="true" onPointerDown={event=>{if(index<value.length)beginInteraction(index,"move",event)}} className={"absolute border-2 shadow-sm "+(index===selected?"border-sky-300 bg-sky-950/55":"border-white bg-slate-950/75")} style={{left:(rect.x*100)+"%",top:(rect.y*100)+"%",width:(rect.w*100)+"%",height:(rect.h*100)+"%"}}>
     {index<value.length&&index===selected&&handles.map(handle=><button key={handle} type="button" data-occlusion-rect="true" onPointerDown={event=>beginInteraction(index,"resize",event,handle)} className={"absolute h-3 w-3 rounded-sm border border-white bg-slate-200 shadow "+({nw:"-left-1 -top-1",ne:"-right-1 -top-1",sw:"-bottom-1 -left-1",se:"-bottom-1 -right-1"} as Record<string,string>)[handle]} aria-label={"Resize "+handle}/>)}
     {index<value.length&&index===selected?<span className="absolute left-1 top-1 rounded bg-slate-950/80 px-1.5 py-0.5 text-[9px] font-semibold text-white">{index+1}</span>:null}
    </div>
   ))}
  </div>
  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
   <p className="text-xs text-slate-400">Drag to create. Select a region to move/resize. {value.length} region(s).</p>
   <div className="flex gap-2"><button type="button" disabled={selected===null} onClick={removeSelected} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 disabled:opacity-40">Delete selected</button><button type="button" onClick={()=>{onChange([]);setSelected(null)}} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold">Clear all</button></div>
  </div>
 </div>;
}

export function OccludedImage({src,rects,revealed=false}:{src:string;rects:OcclusionRect[];revealed?:boolean}){
 return <div className="relative mx-auto max-h-72 w-fit max-w-full overflow-hidden rounded-2xl"><img src={src} alt="" className="block max-h-72 max-w-full object-contain"/>{!revealed&&rects.map((rect,index)=><div key={index} className="absolute bg-slate-950/85" style={{left:(rect.x*100)+"%",top:(rect.y*100)+"%",width:(rect.w*100)+"%",height:(rect.h*100)+"%"}}/>)}</div>;
}
