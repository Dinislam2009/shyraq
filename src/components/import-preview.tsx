"use client";

import { useMemo, useState } from "react";
import { unzipSync } from "fflate";
import { importCards } from "@/app/import/actions";
import { ImportJobProgress } from "@/components/import-job-progress";
import { duplicateKey, parseStandardText, validateImportRows, type ImportRow } from "@/lib/import/standard";

export function ImportPreview({ initialError }: { initialError?: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [issues, setIssues] = useState<{row:number;message:string}[]>([]);
  const [parseError, setParseError] = useState("");
  const [mode, setMode] = useState<"create"|"skip"|"replace">("skip");
  const [ready, setReady] = useState(false);
  const [backupDecks, setBackupDecks] = useState<Array<{id:string;name:string;cards:number}>>([]);
  const [selectedDecks, setSelectedDecks] = useState<string[]>([]);
  const [conflictMode, setConflictMode] = useState<"duplicate"|"skip">("duplicate");
  const [largeStandard, setLargeStandard] = useState(false);
  const [jobStarting,setJobStarting]=useState(false);
  const [jobError,setJobError]=useState("");

  const duplicates = useMemo(() => {
    const seen = new Set<string>();
    const ids = new Set<string>();
    let count = 0;
    for (const row of rows) {
      const key = duplicateKey(row);
      if (seen.has(key) || ids.has(key)) count++;
      seen.add(key);
    }
    return count;
  }, [rows]);

  async function selectFile(next: File | null) {
    setFile(next);
    setReady(false);
    setParseError("");
    setIssues([]);
    setRows([]);
    setBackupDecks([]);
    setSelectedDecks([]);
    if (!next) return;
    const lower = next.name.toLowerCase();
    try {
      setLargeStandard(false);
      const isZip=lower.endsWith(".zip");
      if(!isZip&&next.size>5*1024*1024){
        const head=await next.slice(0,64*1024).text();
        if(!head.includes("shyraq-backup-v2")){
          setLargeStandard(true);
          setReady(true);
          return;
        }
      }
      let sourceText = "";
      if (lower.endsWith(".zip")) {
        const archive = unzipSync(new Uint8Array(await next.arrayBuffer()));
        const raw = archive["shyraq-backup.json"];
        if (!raw) throw new Error("This ZIP does not contain shyraq-backup.json.");
        const backup = JSON.parse(new TextDecoder().decode(raw));
        if (backup?.format !== "shyraq-backup-v2") throw new Error("Unsupported Shyraq backup format.");
        const decks = Array.isArray(backup.decks) ? backup.decks : [];
        const selected = decks.map((deck: any) => ({ id: String(deck.id), name: String(deck.name || "Untitled deck"), cards: (Array.isArray(backup.cards) ? backup.cards : []).filter((card: any) => String(card.deck_id) === String(deck.id)).length }));
        setBackupDecks(selected);
        setSelectedDecks(selected.map((deck: {id:string;name:string;cards:number}) => deck.id));
        setReady(selected.length > 0);
        return;
      }
      sourceText = await next.text();
      const data = lower.endsWith(".json") || sourceText.trim().startsWith("{") || sourceText.trim().startsWith("[") ? JSON.parse(sourceText) : null;
      if (data?.format === "shyraq-backup-v2") {
        const decks = Array.isArray(data.decks) ? data.decks : [];
        const selected = decks.map((deck: any) => ({ id: String(deck.id), name: String(deck.name || "Untitled deck"), cards: (Array.isArray(data.cards) ? data.cards : []).filter((card: any) => String(card.deck_id) === String(deck.id)).length }));
        setBackupDecks(selected);
        setSelectedDecks(selected.map((deck: {id:string;name:string;cards:number}) => deck.id));
        setReady(selected.length > 0);
        return;
      }
      const parsed = parseStandardText(sourceText, next.name);
      const problems = validateImportRows(parsed);
      setRows(parsed);
      setIssues(problems);
      setReady(problems.length === 0 && parsed.length > 0);
      if (!parsed.length) setParseError("No cards were found in this file.");
    } catch (error) {
      setParseError(error instanceof Error ? error.message : "Unable to read this file.");
    }
  }

  const disabled = !file || !ready || (backupDecks.length > 0 && selectedDecks.length === 0);

  return (
    <div className="space-y-6">
      {initialError && <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">{initialError}</div>}
      <ImportJobProgress />
      <form action={importCards} onSubmit={async event=>{
        if(largeStandard || rows.length>500){\n          event.preventDefault();\n          setJobStarting(true);setJobError("");\n          try{\n            const formData=new FormData(event.currentTarget);\n            const response=await fetch("/api/import/jobs",{method:"POST",body:formData});\n            const data=await response.json() as {jobId?:string;error?:string};\n            if(!response.ok||!data.jobId)throw new Error(data.error||"Unable to start import job.");\n            localStorage.setItem("shyraq:import-job",data.jobId);\n            window.location.reload();\n          }catch(error){setJobError(error instanceof Error?error.message:"Unable to start import job.");}finally{setJobStarting(false);}\n        }
      }} className="rounded-2xl border border-black/[0.06] bg-white p-6">
        <label className="block">
          <span className="text-sm font-semibold">Choose import file</span>
          <input name="file" required type="file" accept=".json,.csv,.tsv,.txt,.zip,text/csv,application/json,application/zip,text/plain" onChange={event => void selectFile(event.target.files?.[0] || null)} className="mt-3 block w-full rounded-xl border border-slate-200 p-3 text-sm"/>
        </label>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">CSV / TSV</p><p className="mt-1 text-xs leading-5 text-slate-500">front, back, kind, tags, options, answer, image_url</p></div>
          <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">JSON</p><p className="mt-1 text-xs leading-5 text-slate-500">Cards array, decks/cards, or Shyraq backup JSON.</p></div>
          <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">TXT / ZIP</p><p className="mt-1 text-xs leading-5 text-slate-500">Tab-separated text or complete Shyraq backup.</p></div>
        </div>

        {file && !file.name.toLowerCase().endsWith(".zip") && (
          <div className="mt-5 rounded-2xl border border-slate-200">
            <div className="grid gap-3 border-b border-slate-100 bg-slate-50 p-4 sm:grid-cols-4">
              <div><p className="text-xs text-slate-400">File</p><p className="mt-1 truncate text-sm font-medium">{file.name}</p></div>
              <div><p className="text-xs text-slate-400">Cards</p><p className="mt-1 text-sm font-medium">{rows.length}</p></div>
              <div><p className="text-xs text-slate-400">Validation issues</p><p className="mt-1 text-sm font-medium">{issues.length}</p></div>
              <div><p className="text-xs text-slate-400">Local duplicates</p><p className="mt-1 text-sm font-medium">{duplicates}</p></div>
            </div>
            {issues.length > 0 && <div className="border-b border-red-100 bg-red-50 p-4 text-sm text-red-800">{issues.slice(0, 12).map(issue => <div key={issue.row + issue.message}>Row {issue.row}: {issue.message}</div>)}</div>}
            <div className="max-h-72 overflow-auto p-4">
              {rows.slice(0, 20).map((row, index) => (
                <div key={index} className="grid gap-2 border-b border-slate-100 py-3 text-xs last:border-0 md:grid-cols-[4rem_1fr_1fr_7rem]">
                  <span className="text-slate-400">#{row.sourceRow || index + 1}</span>
                  <span className="truncate font-medium">{row.front || "—"}</span>
                  <span className="truncate text-slate-500">{row.back || "—"}</span>
                  <span className="text-slate-400">{row.kind}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {backupDecks.length > 0 && (
          <div className="mt-5 rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div><p className="text-sm font-semibold">Restore preview</p><p className="mt-1 text-xs text-slate-500">Choose which decks should be restored. Review history and cards are limited to selected decks.</p></div>
              <button type="button" onClick={() => setSelectedDecks(backupDecks.map(deck => deck.id))} className="text-xs font-semibold text-slate-600">Select all</button>
            </div>
            <div className="mt-3 space-y-2">
              {backupDecks.map((deck: {id:string;name:string;cards:number}) => (
                <label key={deck.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <span className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selectedDecks.includes(deck.id)} onChange={() => setSelectedDecks(current => current.includes(deck.id) ? current.filter(id => id !== deck.id) : [...current, deck.id])} className="h-4 w-4 rounded border-slate-300"/>{deck.name}</span>
                  <span className="text-xs text-slate-400">{deck.cards} cards</span>
                </label>
              ))}
            </div>
          </div>
        )}
        <input type="hidden" name="restore_decks" value={JSON.stringify(selectedDecks)} />
        {backupDecks.length > 0 && <div className="mt-4 rounded-2xl border border-slate-200 p-4"><p className="text-sm font-semibold">Deck name conflicts</p><p className="mt-1 text-xs text-slate-500">If a restored deck has the same name as an existing deck, choose whether to keep it as a separate restored copy or skip that deck.</p><select value={conflictMode} onChange={event => setConflictMode(event.target.value as "duplicate"|"skip")} className="mt-3 h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="duplicate">Create separate restored copy</option><option value="skip">Skip conflicting deck</option></select></div>}
        <input type="hidden" name="conflict_mode" value={conflictMode} />
        {file && file.name.toLowerCase().endsWith(".zip") && <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">ZIP integrity is checksum-verified on the server and restore rolls back newly created data if an import step fails.</div>}
        {parseError && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{parseError}</div>}{jobError && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{jobError}</div>}

        <div className="mt-5 rounded-2xl border border-slate-200 p-4">
          <p className="text-sm font-semibold">Duplicate handling</p>
          <p className="mt-1 text-xs text-slate-500">Duplicates are matched by normalized front + back. Existing review history is kept when a card is replaced.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {([
              ["skip", "Skip duplicates"],
              ["replace", "Replace duplicates"],
              ["create", "Always create"]
            ] as const).map(([value, label]) => (
              <button type="button" key={value} onClick={() => setMode(value)} className={"rounded-xl border px-3 py-2 text-xs font-semibold " + (mode === value ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white")}>{label}</button>
            ))}
          </div>
        </div>

        <input type="hidden" name="duplicate_mode" value={mode} />
        <input type="hidden" name="preview_confirmed" value={ready ? "1" : "0"} />
        <button disabled={disabled||jobStarting} className="mt-5 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">
          {file?.name.toLowerCase().endsWith(".zip") ? "Restore backup" : (largeStandard||rows.length>500 ? (jobStarting?"Starting server job…":"Start resumable import") : "Import cards")}
        </button>
      </form>
    </div>
  );
}
