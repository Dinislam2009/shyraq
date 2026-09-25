"use client";

import { useMemo, useState } from "react";

export function TemplateEditor({
  template,
  updateAction,
  deleteAction
}: {
  template: { id:string; name:string; front_template:string; back_template:string; css:string };
  updateAction: (formData:FormData) => void | Promise<void>;
  deleteAction: (formData:FormData) => void | Promise<void>;
}) {
  const [name,setName]=useState(template.name);
  const [front,setFront]=useState(template.front_template);
  const [back,setBack]=useState(template.back_template);
  const [css,setCss]=useState(template.css||"");
  const fields=useMemo(()=>({front:"What is photosynthesis?",back:"A process used by plants to convert light into chemical energy.",subject:"Biology",example:"Leaves use chlorophyll."}),[]);
  const render=(value:string)=>String(value||"").replace(/\{\{\s*([^}]+?)\s*\}\}/g,(_,key)=>fields[String(key).trim() as keyof typeof fields]??"");
  return <div className="rounded-2xl border border-black/[0.06] bg-white p-6">
    <form action={updateAction}>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="block text-sm font-medium">Name<input name="name" value={name} onChange={event=>setName(event.target.value)} className="mt-2 h-11 w-full rounded-xl border px-3 text-sm"/></label>
        <label className="block text-sm font-medium">Front template<input name="front_template" value={front} onChange={event=>setFront(event.target.value)} className="mt-2 h-11 w-full rounded-xl border px-3 text-sm"/></label>
        <label className="block text-sm font-medium">Back template<input name="back_template" value={back} onChange={event=>setBack(event.target.value)} className="mt-2 h-11 w-full rounded-xl border px-3 text-sm"/></label>
      </div>
      <label className="mt-4 block text-sm font-medium">CSS<textarea name="css" value={css} onChange={event=>setCss(event.target.value)} rows={8} placeholder=".card { font-size: 28px; }" className="mt-2 w-full rounded-xl border bg-slate-950 p-3 font-mono text-xs text-slate-100"/></label>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
        <span className="rounded-lg bg-slate-100 px-2 py-1">{"{{front}}"}</span><span className="rounded-lg bg-slate-100 px-2 py-1">{"{{back}}"}</span><span className="rounded-lg bg-slate-100 px-2 py-1">{"{{subject}}"}</span><span className="rounded-lg bg-slate-100 px-2 py-1">{"{{example}}"}</span>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Live front</p>
          <div className="card mt-3 min-h-32 rounded-xl bg-white p-5" style={{whiteSpace:"pre-wrap"}}><div dangerouslySetInnerHTML={{__html:render(front)}}/></div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Live back</p>
          <div className="card mt-3 min-h-32 rounded-xl bg-white p-5" style={{whiteSpace:"pre-wrap"}}><div dangerouslySetInnerHTML={{__html:render(back)}}/></div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html:css}} />
      <div className="mt-5 flex justify-end gap-2">
        <button formAction={deleteAction} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-500">Delete</button>
        <button className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Save</button>
      </div>
    </form>
  </div>;
}
