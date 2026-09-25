"use client";

import { useRef, useState } from "react";
import { RichContent } from "@/components/rich-content";
import { BlockEditor } from "@/components/block-editor";
import { OcclusionEditor, type OcclusionRect } from "@/components/image-occlusion";

type CardAction = (formData: FormData) => void | Promise<void>;
type Template = { id: string; name: string; front_template: string; back_template: string; css?: string };
type MediaItem = { path: string; url: string; mimeType: string; name: string };
type FieldName = "front" | "back";

function applyTemplatePreview(source: string, fields: Record<string, string>) {
  return String(source || "").replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, key) => {
    const normalized = String(key).trim();
    if (/^frontside$/i.test(normalized)) return fields.front || "";
    return fields[normalized] ?? fields[normalized.toLowerCase()] ?? "";
  });
}

export function CardEditor({
  action,
  templates = [],
  mediaLibrary = [],
  initial,
  submitLabel = "Save card"
}: {
  action: CardAction;
  templates?: Template[];
  mediaLibrary?: MediaItem[];
  initial?: {
    kind?: string;
    front?: string;
    back?: string;
    tags?: string[];
    options?: string[];
    answer?: number;
    imageUrl?: string;
    mediaUrl?: string;
    mediaItems?: { path: string; url?: string; mimeType?: string; name?: string }[];
    occlusions?: OcclusionRect[];
    templateId?: string;
    fields?: Record<string, string>;
    reviewPreferences?: {autoRevealSeconds?:number;showTimer?:boolean;swipeEnabled?:boolean;ratingOrder?:string[]};
    updatedAt?: string;
  };
  submitLabel?: string;
}) {
  const [templateId, setTemplateId] = useState(initial?.templateId || "");
  const [kind, setKind] = useState(initial?.kind || "basic");
  const [front, setFront] = useState(initial?.front || "");
  const [back, setBack] = useState(initial?.back || "");
  const [tags, setTags] = useState((initial?.tags || []).join(", "));
  const [options, setOptions] = useState((initial?.options || []).join(", "));
  const [answer, setAnswer] = useState(String(initial?.answer ?? 0));
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl || "");
  const [imagePreview, setImagePreview] = useState(initial?.mediaUrl || "");
  const [mediaItems, setMediaItems] = useState(initial?.mediaItems || []);
  const [occlusions, setOcclusions] = useState<OcclusionRect[]>(initial?.occlusions || []);
  const [fields, setFields] = useState<Record<string, string>>(initial?.fields || {});
  const [reviewPreferences, setReviewPreferences] = useState(initial?.reviewPreferences || {});
  const [activeField, setActiveField] = useState<FieldName>("front");
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);

  const selectedTemplate = templates.find(template => template.id === templateId);
  const imageSrc = imageUrl || imagePreview;

  const customValues: Record<string, string> = {
    front,
    back,
    ...fields
  };
  const previewFront = kind === "cloze"
    ? front.replace(/\{\{c\d+::([^}]+)\}\}/g, "••••")
    : front;
  const previewBack = kind === "cloze"
    ? [front.replace(/\{\{c\d+::([^}]+)\}\}/g, "$1"), back].filter(Boolean).join("\n\n")
    : back;
  const templatePreviewFront = selectedTemplate ? applyTemplatePreview(selectedTemplate.front_template, { ...customValues, front: previewFront, back: previewBack }) : previewFront;
  const templatePreviewBack = selectedTemplate ? applyTemplatePreview(selectedTemplate.back_template, { ...customValues, front: previewFront, back: previewBack }) : previewBack;

  function addField() {
    const name = window.prompt("Field name");
    if (!name) return;
    const clean = name.trim().replace(/[^a-zA-Z0-9_ -]/g, "").slice(0, 60);
    if (!clean || ["front", "back", "frontside"].includes(clean.toLowerCase())) return;
    setFields(current => current[clean] !== undefined ? current : { ...current, [clean]: "" });
  }

  function chooseMedia(item: MediaItem) {
    setMediaItems(current => current.some(existing => existing.path === item.path) ? current.filter(existing => existing.path !== item.path) : [...current, item].slice(0, 10));
    if (item.mimeType.startsWith("image/")) {
      setImageUrl("");
      setImagePreview(item.url);
    }
  }

  return (
    <form action={action} encType="multipart/form-data" className="mt-8 rounded-2xl border border-black/[0.06] bg-white p-6">
      {initial?.updatedAt && <input type="hidden" name="expected_updated_at" value={initial.updatedAt} />}
      <input type="hidden" name="fields" value={JSON.stringify(fields)} />
      <input type="hidden" name="review_preferences" value={JSON.stringify(reviewPreferences)} />
      <input type="hidden" name="media_items" value={JSON.stringify(mediaItems.map(item => ({ path: item.path, mimeType: item.mimeType, name: item.name })))} />
      <div className="grid gap-4 sm:grid-cols-4">
        <label className="block text-sm font-medium">
          Template
          <select name="template_id" value={templateId} onChange={event => setTemplateId(event.target.value)} className="mt-2 h-11 w-full rounded-xl border px-3 text-sm">
            <option value="">Default</option>
            {templates.map(template => <option key={template.id} value={template.id}>{template.name}</option>)}
          </select>
        </label>

        <label className="block text-sm font-medium">
          Card type
          <select name="kind" value={kind} onChange={event => setKind(event.target.value)} className="mt-2 h-11 w-full rounded-xl border px-3 text-sm">
            <option value="basic">Basic</option>
            <option value="reverse">Reverse</option>
            <option value="cloze">Cloze</option>
            <option value="multiple_choice">Multiple choice</option>
            <option value="image">Image</option>
            <option value="custom">Custom</option>
          </select>
        </label>

        <label className="block text-sm font-medium sm:col-span-2">
          Tags
          <input name="tags" value={tags} onChange={event => setTags(event.target.value)} placeholder="math, algebra, exam" className="mt-2 h-11 w-full rounded-xl border px-3 text-sm" />
        </label>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <label className="text-sm font-semibold">Front</label>
          <div ref={frontRef}><BlockEditor value={front} onChange={setFront} placeholder={kind === "cloze" ? "Water freezes at {{c1::0°C}}." : "Question, term, prompt…"} /></div>
        </div>
        <div className="space-y-3">
          <label className="text-sm font-semibold">{kind === "cloze" ? "Explanation" : "Back"}</label>
          <div ref={backRef}><BlockEditor value={back} onChange={setBack} placeholder="Answer, explanation, example…" /></div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div><p className="text-sm font-semibold">Per-card review controls</p><p className="mt-1 text-xs text-slate-500">These overrides apply only to this card during review.</p></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block"><span className="text-xs font-medium">Auto reveal (sec)</span><input type="number" min="0" max="60" value={Number(reviewPreferences.autoRevealSeconds||0)} onChange={event=>setReviewPreferences((current:any)=>({...current,autoRevealSeconds:Math.min(60,Math.max(0,Number(event.target.value)||0))}))} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"/></label>
          <label className="flex items-center gap-2 pt-7 text-sm"><input type="checkbox" checked={reviewPreferences.showTimer!==false} onChange={event=>setReviewPreferences((current:any)=>({...current,showTimer:event.target.checked}))} className="h-4 w-4 rounded border-slate-300"/> Show timer</label>
          <label className="flex items-center gap-2 pt-7 text-sm"><input type="checkbox" checked={reviewPreferences.swipeEnabled!==false} onChange={event=>setReviewPreferences((current:any)=>({...current,swipeEnabled:event.target.checked}))} className="h-4 w-4 rounded border-slate-300"/> Swipe enabled</label>
          <label className="block"><span className="text-xs font-medium">Rating order</span><input value={(reviewPreferences.ratingOrder||[]).join(",")} onChange={event=>setReviewPreferences((current:any)=>({...current,ratingOrder:event.target.value.split(",").map(item=>item.trim().toLowerCase()).filter(Boolean)}))} placeholder="again, hard, good, easy" className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"/></label>
        </div>
      </div>
<div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Custom fields</p>
            <p className="mt-1 text-xs text-slate-500">Use variables such as {"{{subject}}"} or {"{{example}}"} in templates.</p>
          </div>
          <button type="button" onClick={addField} className="rounded-lg bg-white px-3 py-2 text-xs font-semibold shadow-sm">+ Add field</button>
        </div>
        <div className="mt-3 space-y-2">
          {Object.entries(fields).map(([name, value]) => (
            <div key={name} className="grid gap-2 sm:grid-cols-[10rem_1fr_auto]">
              <input value={name} readOnly className="h-10 rounded-lg border border-slate-200 bg-slate-100 px-3 text-sm" />
              <input value={value} onChange={event => setFields(current => ({ ...current, [name]: event.target.value }))} placeholder={name} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm" />
              <button type="button" onClick={() => setFields(current => { const next = { ...current }; delete next[name]; return next; })} className="rounded-lg px-3 text-xs text-red-600 hover:bg-white">Remove</button>
            </div>
          ))}
        </div>
      </div>

      {kind === "multiple_choice" && (
        <div className="mt-5 grid gap-4 rounded-2xl border border-slate-200 p-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium">Options</span>
            <input name="options" value={options} onChange={event => setOptions(event.target.value)} placeholder="Option A, Option B, Option C" className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Correct option index</span>
            <input name="answer" type="number" min="0" value={answer} onChange={event => setAnswer(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" />
          </label>
        </div>
      )}

      {(kind === "image" || kind === "custom") && (
        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_20rem]">
          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-sm font-semibold">Media</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {mediaLibrary.slice(0, 20).map(item => (
                <button key={item.path} type="button" onClick={() => chooseMedia(item)} className={"rounded-lg border px-3 py-2 text-xs " + (mediaItems.some(existing => existing.path === item.path) ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white")}>{item.name}</button>
              ))}
              {!mediaLibrary.length && <span className="text-xs text-slate-400">No reusable media yet.</span>}
            </div>
            <label className="mt-4 block">
              <span className="text-sm font-medium">Upload new media</span>
              <input name="media_file" type="file" accept={kind === "image" ? "image/*" : "image/*,audio/*,video/*"} onChange={event => { const file = event.target.files?.[0]; setImagePreview(file && file.type.startsWith("image/") ? URL.createObjectURL(file) : ""); }} className="mt-2 block w-full rounded-xl border border-slate-200 p-3 text-sm" />
              <span className="mt-1 block text-xs text-slate-400">Maximum 25 MB.</span>
            </label>
            {mediaItems.length > 0 && <p className="mt-3 text-xs text-slate-500">{mediaItems.length} media item(s) linked to this card.</p>}
          </div>

          {kind === "image" && (
            <div className="rounded-2xl border border-slate-200 p-4">
              <label className="block">
                <span className="text-sm font-medium">Image URL</span>
                <input name="image_url" value={imageUrl} onChange={event => { setImageUrl(event.target.value); setImagePreview(""); }} placeholder="https://…" className="mt-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" />
              </label>
              <input type="hidden" name="occlusions" value={JSON.stringify(occlusions)} />
              <div className="mt-4"><p className="text-sm font-medium">Image occlusion</p><OcclusionEditor src={imageSrc} value={occlusions} onChange={setOcclusions} /></div>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div>
          <p className="text-sm font-medium">Live preview</p>
          <div className="mt-2 min-h-[32rem] rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Front</p>
            <RichContent content={templatePreviewFront || "Start typing…"} className="mt-5 text-xl font-semibold" />
            {kind === "multiple_choice" && <div className="mt-6 space-y-2">{options.split(",").map(value => value.trim()).filter(Boolean).map((value, index) => <div key={value + index} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">{value}</div>)}</div>}
            {kind === "image" && imageSrc && <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white"><img src={imageSrc} alt="" className="max-h-64 w-full object-contain" /></div>}
            <div className="my-8 h-px bg-slate-200" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Back</p>
            <RichContent content={templatePreviewBack || "Your answer will appear here."} className="mt-5 text-base text-slate-600" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-semibold">Editor controls</p>
          <p className="mt-1 text-xs text-slate-500">Keyboard-first blocks, markdown shortcuts, links, tables, code languages and draggable block ordering are available in both fields.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => setActiveField("front")} className={"rounded-xl border px-3 py-3 text-left text-sm " + (activeField === "front" ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200")}>Front editor</button>
            <button type="button" onClick={() => setActiveField("back")} className={"rounded-xl border px-3 py-3 text-left text-sm " + (activeField === "back" ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200")}>Back editor</button>
          </div>
          {selectedTemplate?.css && <div className="mt-4 rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Template CSS</p><pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap text-xs text-slate-600">{selectedTemplate.css}</pre></div>}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input name="continue" value="1" type="checkbox" className="h-4 w-4 rounded border-slate-300" />
          Save and add next card
        </label>
        <button className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white">{submitLabel}</button>
      </div>
    </form>
  );
}
