export function normalizeCustomFields(input: unknown): Record<string, string> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>).slice(0, 20)) {
    const name = String(key).trim().slice(0, 60);
    if (!name) continue;
    result[name] = String(value ?? "").slice(0, 10000);
  }
  return result;
}

export function normalizeMediaItems(input: unknown): Array<{path: string; mimeType?: string; name?: string}> {
  if (!Array.isArray(input)) return [];
  return input.slice(0, 10).map(item => ({
    path: String((item as any)?.path || "").trim(),
    mimeType: String((item as any)?.mimeType || "").slice(0, 120),
    name: String((item as any)?.name || "").slice(0, 160)
  })).filter(item => item.path);
}
