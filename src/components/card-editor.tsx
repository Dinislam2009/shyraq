"use client";

import { useState } from "react";

type CardAction = (formData: FormData) => void | Promise<void>;
type Template = {id:string;name:string;front_template:string;back_template:string};

export function CardEditor({ action, templates = [] }: { action: CardAction; templates?: Template[] }) {
  const [kind, setKind] = useState("basic");
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [tags, setTags] = useState("");
  const [options, setOptions] = useState("");
  const [answer, setAnswer] = useState("0");
  const [imageUrl, setImageUrl] = useState("");

  const previewFront =
    kind === "cloze"
      ? front.replace(/\{\{c\d+::([^}]+)\}\}/g, "••••")
      : front;
  const previewBack =
    kind === "cloze"
      ? front.replace(/\{\{c\d+::([^}]+)\}\}/g, "$1")
      : back;

  return (
    <form action={action} className="mt-8 rounded-2xl border border-black/[0.06] bg-white p-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-sm font-medium">
          Template
          <select name="template_id" className="mt-2 h-11 w-full rounded-xl border px-3 text-sm">
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
        <label className="block text-sm font-medium">
          Tags
          <input name="tags" value={tags} onChange={e => setTags(e.target.value)} placeholder="math, algebra, exam" className="mt-2 h-11 w-full rounded-xl border px-3 text-sm" />
        </label>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium">Front</span>
            <textarea name="front" required value={front} onChange={e => setFront(e.target.value)} rows={12} className="mt-2 w-full rounded-xl border px-3 py-3 text-sm" placeholder={kind === "cloze" ? "Example: Water freezes at {{c1::0°C}}." : "Question, term, prompt..."} />
          </label>

          <label className="block">
            <span className="text-sm font-medium">{kind === "cloze" ? "Explanation" : "Back"}</span>
            <textarea name="back" value={back} onChange={e => setBack(e.target.value)} rows={8} className="mt-2 w-full rounded-xl border px-3 py-3 text-sm" placeholder="Answer, explanation, example..." />
          </label>

          {kind === "multiple_choice" && (
            <>
              <label className="block">
                <span className="text-sm font-medium">Options</span>
                <input name="options" value={options} onChange={e => setOptions(e.target.value)} placeholder="Option A, Option B, Option C" className="mt-2 h-11 w-full rounded-xl border px-3 text-sm" />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Correct option index</span>
                <input name="answer" type="number" min="0" value={answer} onChange={e => setAnswer(e.target.value)} className="mt-2 h-11 w-full rounded-xl border px-3 text-sm" />
              </label>
            </>
          )}

          {(kind === "image" || kind === "audio" || kind === "custom") && (
            <label className="block">
              <span className="text-sm font-medium">Media file</span>
              <input name="media_file" type="file" accept={kind === "audio" ? "audio/*" : "image/*,audio/*,video/*"} className="mt-2 block w-full rounded-xl border border-slate-200 p-3 text-sm" />
            </label>
          )}
          {kind === "image" && (
            <label className="block">
              <span className="text-sm font-medium">Image URL</span>
              <input name="image_url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." className="mt-2 h-11 w-full rounded-xl border px-3 text-sm" />
            </label>
          )}
        </div>

        <div>
          <p className="text-sm font-medium">Live preview</p>
          <div className="mt-2 min-h-[28rem] rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Front</p>
            <div className="mt-5 whitespace-pre-wrap text-xl font-semibold">{previewFront || "Start typing..."}</div>

            {kind === "multiple_choice" && (
              <div className="mt-6 space-y-2">
                {options.split(",").map(x => x.trim()).filter(Boolean).map((x, i) => (
                  <div key={x + i} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">{x}</div>
                ))}
              </div>
            )}

            {kind === "image" && imageUrl && <img src={imageUrl} alt="" className="mt-6 max-h-64 w-full rounded-xl object-contain" />}

            <div className="my-8 h-px bg-slate-200" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Back</p>
            <div className="mt-5 whitespace-pre-wrap text-base leading-7 text-slate-600">{previewBack || "Your answer will appear here."}</div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white">Save card</button>
      </div>
    </form>
  );
}