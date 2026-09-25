"use client";

import { useRef, useState } from "react";
import { RichContent } from "@/components/rich-content";
import { OcclusionEditor, type OcclusionRect } from "@/components/image-occlusion";

type CardAction = (formData: FormData) => void | Promise<void>;
type Template = {id:string;name:string;front_template:string;back_template:string};
type FieldName = "front" | "back";

const tick = String.fromCharCode(96);

export function CardEditor({ action, templates = [], initial, submitLabel = "Save card" }: { action: CardAction; templates?: Template[]; initial?: { kind?: string; front?: string; back?: string; tags?: string[]; options?: string[]; answer?: number; imageUrl?: string; mediaUrl?: string; occlusions?: OcclusionRect[]; templateId?: string }; submitLabel?: string }) {
  const [kind, setKind] = useState(initial?.kind || "basic");
  const [front, setFront] = useState(initial?.front || "");
  const [back, setBack] = useState(initial?.back || "");
  const [tags, setTags] = useState((initial?.tags || []).join(", "));
  const [options, setOptions] = useState((initial?.options || []).join(", "));
  const [answer, setAnswer] = useState(String(initial?.answer ?? 0));
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl || "");
  const [imagePreview, setImagePreview] = useState(initial?.mediaUrl || "");
  const [occlusions, setOcclusions] = useState<OcclusionRect[]>(initial?.occlusions || []);
  const [activeField, setActiveField] = useState<FieldName>("front");
  const frontRef = useRef<HTMLTextAreaElement>(null);
  const backRef = useRef<HTMLTextAreaElement>(null);

  const valueFor = (field: FieldName) => field === "front" ? front : back;
  const setterFor = (field: FieldName) => field === "front" ? setFront : setBack;

  function insertAround(before: string, after = before) {
    const ref = activeField === "front" ? frontRef.current : backRef.current;
    if (!ref) return;
    const current = valueFor(activeField);
    const start = ref.selectionStart ?? current.length;
    const end = ref.selectionEnd ?? start;
    const selected = current.slice(start, end);
    const replacement = selected || "text";
    setterFor(activeField)(current.slice(0, start) + before + replacement + after + current.slice(end));
    requestAnimationFrame(() => {
      ref.focus();
      const cursor = start + before.length + replacement.length + after.length;
      ref.setSelectionRange(cursor, cursor);
    });
  }

  function insertBlock(text: string) {
    const ref = activeField === "front" ? frontRef.current : backRef.current;
    if (!ref) return;
    const current = valueFor(activeField);
    const start = ref.selectionStart ?? current.length;
    const end = ref.selectionEnd ?? start;
    setterFor(activeField)(current.slice(0, start) + text + current.slice(end));
    requestAnimationFrame(() => {
      ref.focus();
      ref.setSelectionRange(start + text.length, start + text.length);
    });
  }

  const imageSrc = imageUrl || imagePreview;

  const previewFront = kind === "cloze"
    ? front.replace(/\{\{c\d+::([^}]+)\}\}/g, "••••")
    : front;

  const previewBack = kind === "cloze"
    ? front.replace(/\{\{c\d+::([^}]+)\}\}/g, "$1") || back
    : back;

  return (
    <form action={action} className="mt-8 rounded-2xl border border-black/[0.06] bg-white p-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <label className="block text-sm font-medium">
          Template
          <select name="template_id" defaultValue={initial?.templateId || ""} className="mt-2 h-11 w-full rounded-xl border px-3 text-sm">
            <option value="">Default</option>
            {templates.map(template => <option key={template.id} value={template.id}>{template.name}</option>)}
          </select>
        </label>

        <label className="block text-sm font-medium">
          Card type
          <select name="kind" value={kind} onChange={e => setKind(e.target.value)} className="mt-2 h-11 w-full rounded-xl border px-3 text-sm">
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
          <input name="tags" value={tags} onChange={e => setTags(e.target.value)} placeholder="math, algebra, exam" className="mt-2 h-11 w-full rounded-xl border px-3 text-sm" />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
        <span className="px-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Format</span>
        <button type="button" onClick={() => insertAround("**")} className="rounded-lg bg-white px-3 py-2 text-xs font-semibold shadow-sm">Bold</button>
        <button type="button" onClick={() => insertAround("*")} className="rounded-lg bg-white px-3 py-2 text-xs italic shadow-sm">Italic</button>
        <button type="button" onClick={() => insertAround(tick)} className="rounded-lg bg-white px-3 py-2 text-xs font-mono shadow-sm">Inline code</button>
        <button type="button" onClick={() => insertBlock("\n" + tick.repeat(3) + "text\n" + tick.repeat(3) + "\n")} className="rounded-lg bg-white px-3 py-2 text-xs font-mono shadow-sm">Code block</button>
        <button type="button" onClick={() => insertAround("$")} className="rounded-lg bg-white px-3 py-2 text-xs font-mono shadow-sm">LaTeX</button>
        <button type="button" onClick={() => insertBlock("\n- item\n")} className="rounded-lg bg-white px-3 py-2 text-xs shadow-sm">List</button>
        <div className="ml-auto flex rounded-lg bg-white p-1 shadow-sm">
          <button type="button" onClick={() => setActiveField("front")} className={"rounded-md px-3 py-1.5 text-xs font-semibold " + (activeField === "front" ? "bg-slate-950 text-white" : "text-slate-500")}>Front</button>
          <button type="button" onClick={() => setActiveField("back")} className={"rounded-md px-3 py-1.5 text-xs font-semibold " + (activeField === "back" ? "bg-slate-950 text-white" : "text-slate-500")}>Back</button>
        </div>
      </div>

      <p className="mt-2 text-xs text-slate-400">
        Use <code>{tick}{tick}bold{tick}{tick}</code>, <code>{tick}italic{tick}</code>, <code>{tick}code{tick}</code>, <code>{tick}{tick}{tick}language</code> blocks and <code>$x^2$</code> for formulas.
      </p>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium">Front</span>
            <textarea
              ref={frontRef}
              name="front"
              required
              value={front}
              onFocus={() => setActiveField("front")}
              onChange={e => setFront(e.target.value)}
              rows={14}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-mono text-sm outline-none focus:border-slate-400"
              placeholder={kind === "cloze" ? "Water freezes at {{c1::0°C}}." : "Question, term, prompt..."}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">{kind === "cloze" ? "Explanation" : "Back"}</span>
            <textarea
              ref={backRef}
              name="back"
              value={back}
              onFocus={() => setActiveField("back")}
              onChange={e => setBack(e.target.value)}
              rows={9}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-mono text-sm outline-none focus:border-slate-400"
              placeholder="Answer, explanation, example..."
            />
          </label>

          {kind === "multiple_choice" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium">Options</span>
                <input name="options" value={options} onChange={e => setOptions(e.target.value)} placeholder="Option A, Option B, Option C" className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Correct option index</span>
                <input name="answer" type="number" min="0" value={answer} onChange={e => setAnswer(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" />
              </label>
            </div>
          )}

          {(kind === "image" || kind === "custom") && (
            <label className="block">
              <span className="text-sm font-medium">Media file</span>
              <input name="media_file" type="file" accept={kind === "image" ? "image/*" : "image/*,audio/*,video/*"} onChange={event => { const file = event.target.files?.[0]; setImagePreview(file && file.type.startsWith("image/") ? URL.createObjectURL(file) : ""); }} className="mt-2 block w-full rounded-xl border border-slate-200 p-3 text-sm" />
              <span className="mt-1 block text-xs text-slate-400">Maximum 25 MB.</span>
            </label>
          )}

          {kind === "image" && (
            <>
              <label className="block">
                <span className="text-sm font-medium">Image URL</span>
                <input name="image_url" value={imageUrl} onChange={e => { setImageUrl(e.target.value); setImagePreview(""); }} placeholder="https://..." className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" />
              </label>
              <input type="hidden" name="occlusions" value={JSON.stringify(occlusions)} />
              <div className="mt-4">
                <p className="text-sm font-medium">Image occlusion</p>
                <OcclusionEditor src={imageSrc} value={occlusions} onChange={setOcclusions} />
              </div>
            </>
          )}
        </div>

        <div>
          <p className="text-sm font-medium">Live preview</p>
          <div className="mt-2 min-h-[32rem] rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Front</p>
            <RichContent content={previewFront || "Start typing..."} className="mt-5 text-xl font-semibold" />

            {kind === "multiple_choice" && (
              <div className="mt-6 space-y-2">
                {options.split(",").map(x => x.trim()).filter(Boolean).map((x, i) => (
                  <div key={x + i} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">{x}</div>
                ))}
              </div>
            )}

            {kind === "image" && imageSrc && <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white"><img src={imageSrc} alt="" className="max-h-64 w-full object-contain" /></div>}

            <div className="my-8 h-px bg-slate-200" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Back</p>
            <RichContent content={previewBack || "Your answer will appear here."} className="mt-5 text-base text-slate-600" />
          </div>
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
