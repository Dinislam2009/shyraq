 "use client";

import { useMemo, useRef, useState } from "react";

export type EditorBlock = {
  id: string;
  type: "paragraph" | "heading" | "quote" | "bullet" | "code" | "table" | "divider";
  text: string;
  language?: string;
};

const FENCE = String.fromCharCode(96).repeat(3);
const id = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

function parse(value: string): EditorBlock[] {
  const lines = String(value || "").replace(/\r\n/g, "\n").split("\n");
  const result: EditorBlock[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i] || "";
    if (line.trim().startsWith(FENCE)) {
      const language = line.trim().slice(3).trim();
      i++;
      const code: string[] = [];
      while (i < lines.length && lines[i].trim() !== FENCE) code.push(lines[i++]);
      if (i < lines.length) i++;
      result.push({ id: id(), type: "code", text: code.join("\n"), language });
      continue;
    }
    if (line.trim() === "---") {
      result.push({ id: id(), type: "divider", text: "" });
      i++;
      continue;
    }
    if (/^\s*\|/.test(line)) {
      const rows: string[] = [line];
      i++;
      while (i < lines.length && /^\s*\|/.test(lines[i] || "")) rows.push(lines[i++]);
      result.push({ id: id(), type: "table", text: rows.join("\n") });
      continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      result.push({ id: id(), type: "heading", text: heading[2] });
      i++;
      continue;
    }
    if (/^>\s?/.test(line)) {
      result.push({ id: id(), type: "quote", text: line.replace(/^>\s?/, "") });
      i++;
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      const rows: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i] || "")) rows.push(lines[i++].replace(/^[-*]\s+/, ""));
      result.push({ id: id(), type: "bullet", text: rows.join("\n") });
      continue;
    }
    const rows: string[] = [];
    while (
      i < lines.length &&
      (lines[i] || "").trim() &&
      !/^\s*\|/.test(lines[i] || "") &&
      !/^\s*\x60\x60\x60/.test(lines[i] || "") &&
      !/^(#{1,3})\s+/.test(lines[i] || "") &&
      !/^>\s?/.test(lines[i] || "") &&
      !/^[-*]\s+/.test(lines[i] || "") &&
      (lines[i] || "").trim() !== "---"
    ) rows.push(lines[i++]);
    if (rows.length) result.push({ id: id(), type: "paragraph", text: rows.join("\n") });
    else i++;
  }
  return result.length ? result : [{ id: id(), type: "paragraph", text: "" }];
}

function serialize(blocks: EditorBlock[]) {
  return blocks.map(block => {
    if (block.type === "heading") return "# " + block.text;
    if (block.type === "quote") return block.text.split("\n").map(line => "> " + line).join("\n");
    if (block.type === "bullet") return block.text.split("\n").filter(Boolean).map(line => "- " + line).join("\n");
    if (block.type === "code") return FENCE + (block.language || "") + "\n" + block.text + "\n" + FENCE;
    if (block.type === "table") return block.text || "| Column 1 | Column 2 |\n| --- | --- |\n| | |";
    if (block.type === "divider") return "---";
    return block.text;
  }).filter(Boolean).join("\n\n");
}

function escapeHtml(value: string) {
 return String(value||"").replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[char] as string));
}

function markdownToVisualHtml(value:string){
 let html=escapeHtml(value);
 html=html.replace(/\[([^\]]+)\]\((https?:\\/\\/[^)]+)\)/g,'<a href="$2" target="_blank" rel="noreferrer">$1</a>');
 html=html.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>");
 html=html.replace(/__([^_]+)__/g,"<strong>$1</strong>");
 html=html.replace(/\*([^*\n]+)\*/g,"<em>$1</em>");
 html=html.replace(/_([^_\n]+)_/g,"<em>$1</em>");
 html=html.replace(/\x60([^\x60]+)\x60/g,"<code>$1</code>");
 return html.replace(/\n/g,"<br />");
}

function htmlToMarkdown(html:string){
 const root=document.createElement("div");
 root.innerHTML=html;
 const render=(node:Node):string=>{
  if(node.nodeType===Node.TEXT_NODE)return node.textContent||"";
  if(!(node instanceof HTMLElement))return Array.from(node.childNodes).map(render).join("");
  const inner=Array.from(node.childNodes).map(render).join("");
  const tag=node.tagName.toLowerCase();
  if(tag==="br")return "\n";
  if(tag==="strong"||tag==="b")return "**"+inner+"**";
  if(tag==="em"||tag==="i")return "*"+inner+"*";
  if(tag==="code")return "\x60"+inner+"\x60";
  if(tag==="a"){
   const href=node.getAttribute("href")||"";
   return href?"["+inner+"]("+href+")":inner;
  }
  if(tag==="li")return "- "+inner+"\n";
  if(["div","p","h1","h2","h3"].includes(tag))return inner+"\n";
  return inner;
 };
 return Array.from(root.childNodes).map(render).join("").replace(/\n{3,}/g,"\n\n").replace(/^\n|\n$/g,"");
}

function shortcut(value: string) {
  if (value === "# ") return "heading";
  if (value === "> ") return "quote";
  if (value === "- " || value === "* ") return "bullet";
  if (value === FENCE) return "code";
  return null;
}

export function BlockEditor({ value, onChange, placeholder = "Start writing…" }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  const [blocks, setBlocks] = useState<EditorBlock[]>(() => parse(value));
  const [focused, setFocused] = useState(blocks[0]?.id || "");
  const [dragged, setDragged] = useState<string | null>(null);
  const [slash, setSlash] = useState<string | null>(null);
  const [visualMode, setVisualMode] = useState(true);
  const visualRefs = useRef<Record<string, HTMLDivElement | null>>({});

  function commit(next: EditorBlock[]) {
    setBlocks(next);
    onChange(serialize(next));
  }

  function patch(blockId: string, patchValue: Partial<EditorBlock>) {
    commit(blocks.map(block => block.id === blockId ? { ...block, ...patchValue } : block));
  }

  function addAfter(blockId: string, type: EditorBlock["type"] = "paragraph") {
    const next = blocks.flatMap(block => block.id === blockId ? [block, { id: id(), type, text: "" }] : [block]);
    commit(next);
    setFocused(next[Math.min(next.findIndex(block => block.id === blockId) + 1, next.length - 1)].id);
  }

  function remove(blockId: string) {
    if (blocks.length === 1) return commit([{ ...blocks[0], type: "paragraph", text: "" }]);
    commit(blocks.filter(block => block.id !== blockId));
  }

  function move(sourceId: string, targetId: string) {
    if (!sourceId || sourceId === targetId) return;
    const source = blocks.findIndex(block => block.id === sourceId);
    const target = blocks.findIndex(block => block.id === targetId);
    if (source < 0 || target < 0) return;
    const next = [...blocks];
    const [item] = next.splice(source, 1);
    next.splice(target, 0, item);
    commit(next);
    setDragged(null);
  }

  function inline(blockId: string, before: string, after = before) {
    const area = document.querySelector<HTMLTextAreaElement>('textarea[data-block="' + blockId + '"]');
    const block = blocks.find(item => item.id === blockId);
    if (!area || !block) return;
    const start = area.selectionStart;
    const end = area.selectionEnd;
    const selected = block.text.slice(start, end);
    const replacement = before + (selected || "text") + after;
    patch(blockId, { text: block.text.slice(0, start) + replacement + block.text.slice(end) });
    requestAnimationFrame(() => {
      area.focus();
      area.setSelectionRange(start + replacement.length, start + replacement.length);
    });
  }

  const types = useMemo(() => [
    ["paragraph", "Text"], ["heading", "Heading"], ["bullet", "List"],
    ["quote", "Quote"], ["code", "Code"], ["table", "Table"], ["divider", "Divider"]
  ] as const, []);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-100 bg-slate-50 p-2">
        <button type="button" onClick={() => setVisualMode(value => !value)} className={"rounded-lg px-2.5 py-2 text-xs font-semibold " + (visualMode ? "bg-slate-950 text-white" : "hover:bg-white")}>{visualMode ? "Visual" : "Markdown"}</button>
        {types.map(([type, label]) => (
          <button key={type} type="button" onClick={() => {
            if (type === "table") patch(focused, { type, text: "| Column 1 | Column 2 |\n| --- | --- |\n| | |" });
            else patch(focused, { type });
          }} className="rounded-lg px-2.5 py-2 text-xs font-medium hover:bg-white">{label}</button>
        ))}
        <span className="mx-1 h-5 w-px bg-slate-200" />
        <button type="button" onClick={() => inline(focused, "**")} className="rounded-lg px-2.5 py-2 text-xs font-bold hover:bg-white">B</button>
        <button type="button" onClick={() => inline(focused, "*")} className="rounded-lg px-2.5 py-2 text-xs italic hover:bg-white">I</button>
        <button type="button" onClick={() => inline(focused, String.fromCharCode(96))} className="rounded-lg px-2.5 py-2 text-xs font-mono hover:bg-white">Code</button>
        <button type="button" onClick={() => {
          const url = window.prompt("Link URL");
          if (url) {
            const area = document.querySelector<HTMLTextAreaElement>('textarea[data-block="' + focused + '"]');
            const block = blocks.find(item => item.id === focused);
            if (area && block) {
              const start = area.selectionStart;
              const end = area.selectionEnd;
              const selected = block.text.slice(start, end) || "link";
              patch(focused, { text: block.text.slice(0, start) + "[" + selected + "](" + url + ")" + block.text.slice(end) });
            }
          }
        }} className="rounded-lg px-2.5 py-2 text-xs hover:bg-white">Link</button>
      </div>

      <div className="space-y-2 p-3">
        {blocks.map((block, index) => (
          <div key={block.id} draggable className="flex gap-2" onDragStart={() => setDragged(block.id)} onDragOver={event => event.preventDefault()} onDrop={() => move(dragged || "", block.id)}>
            <button type="button" title="Drag block" aria-label="Reorder block" className="mt-2 w-7 cursor-grab rounded-lg text-slate-300 hover:bg-slate-50">⋮⋮</button>
            <div className="min-w-0 flex-1">
              {block.type === "divider" ? (
                <div className="flex items-center gap-2 py-3"><div className="h-px flex-1 bg-slate-200" /><button type="button" onClick={() => remove(block.id)} className="text-xs text-slate-400">Delete</button></div>
              ) : (
                <>
                  {block.type === "code" && (
                    <div className="mb-1 flex justify-end">
                      <select value={block.language || ""} onChange={event => patch(block.id, { language: event.target.value })} className="h-8 rounded-lg border border-slate-200 px-2 text-xs">
                        {["", "typescript", "javascript", "tsx", "python", "java", "sql", "json", "bash", "css", "html"].map(language => <option key={language} value={language}>{language || "plain text"}</option>)}
                      </select>
                    </div>
                  )}
                  {visualMode && block.type === "paragraph" ? (
                    <div
                      ref={node => { visualRefs.current[block.id] = node; }}
                      contentEditable
                      suppressContentEditableWarning
                      role="textbox"
                      aria-multiline="true"
                      aria-label={index === 0 ? "Visual content editor" : "Visual block editor"}
                      onFocus={() => { setFocused(block.id); setSlash(null); }}
                      onInput={event => {
                        const markdown=htmlToMarkdown(event.currentTarget.innerHTML);
                        patch(block.id,{text:markdown});
                      }}
                      dangerouslySetInnerHTML={{__html:markdownToVisualHtml(block.text)}}
                      className="min-h-24 w-full rounded-xl border border-transparent bg-slate-50 px-3 py-3 text-sm outline-none focus:border-slate-300 focus:bg-white"
                    />
                  ) : <textarea
                    data-block={block.id}
                    value={block.text}
                    onFocus={() => { setFocused(block.id); setSlash(null); }}
                    onChange={event => {
                      const nextValue = event.target.value;
                      const auto = block.type === "paragraph" ? shortcut(nextValue.slice(0, 3)) : null;
                      if (auto) {
                        patch(block.id, { type: auto as EditorBlock["type"], text: nextValue.slice(auto === "code" ? FENCE.length : 2) });
                      } else {
                        patch(block.id, { text: nextValue });
                        setSlash(nextValue.trim() === "/" ? block.id : null);
                      }
                    }}
                    onKeyDown={event => {
                      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "b") { event.preventDefault(); inline(block.id, "**"); }
                      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "i") { event.preventDefault(); inline(block.id, "*"); }
                      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); inline(block.id, "[", "]()"); }
                      if (event.key === "Enter" && !event.shiftKey && block.type !== "code" && block.type !== "table") {
                        event.preventDefault();
                        const area = event.currentTarget;
                        const at = area.selectionStart;
                        const next = blocks.flatMap(item => item.id === block.id ? [
                          { ...item, text: item.text.slice(0, at) },
                          { id: id(), type: "paragraph" as const, text: item.text.slice(at) }
                        ] : [item]);
                        commit(next);
                        setFocused(next[index + 1]?.id || block.id);
                      }
                      if (event.key === "Backspace" && !block.text && blocks.length > 1) { event.preventDefault(); remove(block.id); }
                    }}
                    rows={block.type === "code" || block.type === "table" ? 7 : block.type === "heading" ? 2 : 4}
                    placeholder={index === 0 ? placeholder : "Type…  / for blocks"}
                    className={
                      "w-full resize-y rounded-xl border border-transparent bg-slate-50 px-3 py-3 text-sm outline-none focus:border-slate-300 focus:bg-white " +
                      (block.type === "heading" ? "text-xl font-semibold" : "") +
                      (block.type === "quote" ? "border-l-4 border-l-slate-300 italic text-slate-600" : "") +
                      (block.type === "code" ? "bg-slate-950 font-mono text-slate-100" : "")
                    }
                  />}
                  {slash === block.id && (
                    <div className="mt-1 flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                      {["paragraph", "heading", "bullet", "quote", "code", "table", "divider"].map(type => (
                        <button key={type} type="button" onClick={() => { patch(block.id, { type: type as EditorBlock["type"], text: type === "table" ? "| Column 1 | Column 2 |\n| --- | --- |\n| | |" : "" }); setSlash(null); }} className="rounded-lg px-3 py-1.5 text-xs hover:bg-slate-100">/{type}</button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            <button type="button" onClick={() => remove(block.id)} aria-label="Delete block" title="Delete block" className="mt-2 w-8 rounded-lg text-slate-300 hover:text-red-600">×</button>
          </div>
        ))}
        <button type="button" onClick={() => addAfter(blocks[blocks.length - 1]?.id || "")} className="rounded-lg px-2 py-2 text-xs text-slate-400 hover:bg-slate-50">+ Add block</button>
      </div>
    </div>
  );
}
