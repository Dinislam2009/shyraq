"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type OcclusionRect = { x:number; y:number; w:number; h:number };

function clamp(value:number,min:number,max:number){
 return Math.min(max,Math.max(min,value));
}

export function OcclusionEditor({src,value,onChange}:{src:string;value:OcclusionRect[];onChange:(next:OcclusionRect[])=>void}){
 const frameRef=useRef<HTMLDivElement>(null);
 const drawingRef=useRef<{x:number;y:number}|null>(null);
 const [draft,setDraft]=useState<OcclusionRect|null>(null);

 useEffect(()=>{ if(!src) onChange([]); },[src,onChange]);

 function point(event:React.PointerEvent){
  const frame=frameRef.current?.getBoundingClientRect();
  if(!frame)return null;
  return {
   x:clamp((event.clientX-frame.left)/frame.width,0,1),
   y:clamp((event.clientY-frame.top)/frame.height,0,1),
  };
 }

 function start(event:React.PointerEvent){
  if(!src)return;
  const p=point(event);
  if(!p)return;
  event.currentTarget.setPointerCapture(event.pointerId);
  drawingRef.current=p;
  setDraft({x:p.x,y:p.y,w:0,h:0});
 }

 function move(event:React.PointerEvent){
  const startPoint=drawingRef.current;
  const p=point(event);
  if(!startPoint||!p)return;
  const x=Math.min(startPoint.x,p.x);
  const y=Math.min(startPoint.y,p.y);
  const w=Math.abs(startPoint.x-p.x);
  const h=Math.abs(startPoint.y-p.y);
  setDraft({x,y,w,h});
 }

 function finish(){
  if(draft&&draft.w>0.02&&draft.h>0.02)onChange([...value,draft]);
  drawingRef.current=null;
  setDraft(null);
 }

 const preview=[...value,...(draft?[draft]:[])];

 return (
  <div>
   <div ref={frameRef} onPointerDown={start} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish} className="relative mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 select-none touch-none">
    {src ? <img src={src} alt="" draggable={false} className="block max-h-[32rem] w-full object-contain" /> : <div className="flex min-h-48 items-center justify-center p-6 text-sm text-slate-400">Choose an image to draw occlusion areas.</div>}
    {src&&preview.map((rect,index)=>(
      <div key={index} className="absolute border-2 border-white bg-slate-950/75 shadow-sm" style={{left:(rect.x*100)+"%",top:(rect.y*100)+"%",width:(rect.w*100)+"%",height:(rect.h*100)+"%"}} />
    ))}
   </div>
   <div className="mt-3 flex items-center justify-between gap-3">
    <p className="text-xs text-slate-400">Drag on the image to create hidden regions. Click clear to redraw.</p>
    <button type="button" onClick={()=>onChange([])} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold">Clear</button>
   </div>
  </div>
 );
}

export function OccludedImage({src,rects,revealed=false}:{src:string;rects:OcclusionRect[];revealed?:boolean}){
 return (
  <div className="relative mx-auto max-h-72 w-fit max-w-full overflow-hidden rounded-2xl">
   <img src={src} alt="" className="block max-h-72 max-w-full object-contain" />
   {!revealed&&rects.map((rect,index)=>(
    <div key={index} className="absolute bg-slate-950/85" style={{left:(rect.x*100)+"%",top:(rect.y*100)+"%",width:(rect.w*100)+"%",height:(rect.h*100)+"%"}} />
   ))}
  </div>
 );
}
