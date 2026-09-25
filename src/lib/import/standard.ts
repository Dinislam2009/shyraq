export const SUPPORTED_KINDS = ["basic","reverse","cloze","multiple_choice","image","custom"] as const;
export type ImportKind = typeof SUPPORTED_KINDS[number];
export type ImportRow = {
  front: string;
  back: string;
  kind: ImportKind;
  tags: string[];
  options: string[];
  answer: number;
  imageUrl?: string;
  fields?: Record<string,string>;
  sourceRow?: number;
};

export type ImportIssue = { row: number; message: string };

export function csvLine(line: string, delimiter = ",") {
  const out: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') { current += '"'; i++; }
      else quoted = !quoted;
    } else if (ch === delimiter && !quoted) {
      out.push(current);
      current = "";
    } else current += ch;
  }
  out.push(current);
  return out;
}

function normalizeKind(value: unknown): ImportKind {
  const kind = String(value || "basic");
  return (SUPPORTED_KINDS as readonly string[]).includes(kind) ? kind as ImportKind : "basic";
}

function tags(value: unknown) {
  if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean).slice(0, 30);
  return String(value || "").split(",").map(item => item.trim()).filter(Boolean).slice(0, 30);
}

function options(value: unknown) {
  if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean).slice(0, 10);
  return String(value || "").split("|").map(item => item.trim()).filter(Boolean).slice(0, 10);
}

function rowFromObject(card: any, sourceRow?: number): ImportRow {
  const content = card?.content ?? card ?? {};
  const fields = content?.fields && typeof content.fields === "object" && !Array.isArray(content.fields) ? Object.fromEntries(Object.entries(content.fields).slice(0, 20).map(([k,v]) => [String(k),String(v ?? "")])) : {};
  const row: ImportRow = {
    front: String(content.front ?? card?.front ?? ""),
    back: String(content.back ?? card?.back ?? ""),
    kind: normalizeKind(card?.kind ?? content.kind),
    tags: tags(content.tags ?? card?.tags),
    options: options(content.options ?? card?.options),
    answer: Number(content.answer ?? card?.answer ?? 0),
    imageUrl: String(content.imageUrl ?? card?.imageUrl ?? "").trim() || undefined,
    fields
  };
  if (!Number.isFinite(row.answer)) row.answer = 0;
  row.answer = row.options.length ? Math.max(0, Math.min(row.options.length - 1, Math.trunc(row.answer))) : 0;
  return { ...row, sourceRow };
}

export function parseDelimited(text: string, delimiter = ","): ImportRow[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n").filter(line => line.trim());
  if (!lines.length) return [];
  const header = csvLine(lines[0], delimiter).map(value => value.trim().toLowerCase());
  const index = (name: string) => header.indexOf(name);
  const frontIndex = index("front");
  const backIndex = index("back");
  if (frontIndex < 0 || backIndex < 0) throw new Error("Import file must contain front and back columns.");
  return lines.slice(1).map((line, offset) => {
    const values = csvLine(line, delimiter);
    return rowFromObject({
      front: values[frontIndex] || "",
      back: values[backIndex] || "",
      kind: values[index("kind")] || "basic",
      tags: values[index("tags")] || "",
      options: values[index("options")] || "",
      answer: values[index("answer")] || 0,
      imageUrl: values[index("image_url")] || ""
    }, offset + 2);
  });
}

export function parseStandardText(text: string, filename = ""): ImportRow[] {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".json") || text.trim().startsWith("{") || text.trim().startsWith("[")) {
    const data = JSON.parse(text);
    const cards = Array.isArray(data) ? data : Array.isArray(data.cards) ? data.cards : Array.isArray(data.decks) ? data.decks.flatMap((deck: any) => deck.cards || []) : [];
    return cards.map((card: any, index: number) => rowFromObject(card, index + 1)).filter((row: ImportRow) => row.front || row.back);
  }
  const firstLine = text.split(/\r?\n/).find(line => line.trim()) || "";
  const headerText = firstLine.toLowerCase();
  let delimiter = ",";
  if (lower.endsWith(".tsv") || headerText.includes("\t")) delimiter = "\t";
  else if (headerText.includes("||") && headerText.includes("front") && headerText.includes("back")) delimiter = "||";
  else if (lower.endsWith(".txt") && headerText.includes("|")) delimiter = "|";
  return parseDelimited(text, delimiter);
}

export function validateImportRows(rows: ImportRow[]) {
  const issues: ImportIssue[] = [];
  rows.forEach((row, index) => {
    const sourceRow = row.sourceRow || index + 1;
    if (!row.front.trim() && !row.back.trim()) issues.push({ row: sourceRow, message: "Both front and back are empty." });
    if (row.kind === "multiple_choice" && row.options.length < 2) issues.push({ row: sourceRow, message: "Multiple-choice cards need at least two options." });
    if (row.kind === "multiple_choice" && (row.answer < 0 || row.answer >= row.options.length)) issues.push({ row: sourceRow, message: "Correct option index is outside the option range." });
  });
  return issues;
}

export function duplicateKey(row: Pick<ImportRow,"front"|"back">) {
  return (String(row.front || "").trim() + "\u0000" + String(row.back || "").trim()).toLowerCase();
}
