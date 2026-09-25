"use client";

import { useMemo, useState } from "react";
import { importCards } from "@/app/import/actions";
import { duplicateKey, parseStandardText, validateImportRows, type ImportRow } from "@/lib/import/standard";

export function ImportPreview({ initialError }: { initialError?: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [issues, setIssues] = useState<{row:number;message:string}[]>([]);
  const [parseError, setParseError] = useState("");
  const [mode, setMode] = useState<"create"|"skip"|"replace">("skip");
  const [ready, setReady] = useState(false);

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
    if (!next) return;
    const lower = next.name.toLowerCase();
    if (lower.endsWith(".zip")) {
      setReady(true);
      return;
    }
    try {
      const parsed = parseStandardText(await next.text(), next.name);
      const problems = validateImportRows(parsed);
      setRows(parsed);
      setIssues(problems);
      setReady(problems.length === 0 && parsed.length > 0);
      if (!parsed.length) setParseError("No cards were found in this file.");
    } catch (error) {
      setParseError(error instanceof Error ? error.message : "Unable to read this file.");
    }
  }

  const disabled = !file || !ready;

  return (
    <div className="space-y-6">
      {initialError && <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">{initialError}</div>}
      <form action={importCards} className="rounded-2xl border border-black/[0.06] bg-white p-6">
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

        {file && file.name.toLowerCase().endsWith(".zip") && <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">ZIP will be checksum-verified and restored with an automatic rollback on failure.</div>}
        {parseError && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{parseError}</div>}

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
        <button disabled={disabled} className="mt-5 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">
          {file?.name.toLowerCase().endsWith(".zip") ? "Restore backup" : "Import cards"}
        </button>
      </form>
    </div>
  );
}
