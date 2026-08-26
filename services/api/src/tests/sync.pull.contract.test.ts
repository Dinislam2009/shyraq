import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
dotenv.config({ path: path.join(repoRoot, ".env") });

const apiBaseUrl = process.env.SHYRAQ_TEST_API_URL ?? "http://localhost:4000";
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const email = process.env.SHYRAQ_TEST_EMAIL;
const password = process.env.SHYRAQ_TEST_PASSWORD;
const enabled = Boolean(supabaseUrl && supabaseAnonKey && email && password);

test("authenticated sync pull cursor contract", { skip: !enabled }, async () => {
  const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  const { data, error } = await supabase.auth.signInWithPassword({ email: email!, password: password! });
  assert.ifError(error);
  assert.ok(data.session?.access_token);

  const authHeaders = { authorization: `Bearer ${data.session.access_token}` };
  const pushHeaders = { ...authHeaders, "content-type": "application/json" };

  const baselineResponse = await fetch(`${apiBaseUrl}/api/v1/sync?cursor=0&limit=500`, { headers: authHeaders });
  const baselineText = await baselineResponse.text();
  assert.equal(baselineResponse.status, 200, `baseline pull failed: HTTP ${baselineResponse.status}: ${baselineText}`);
  const baseline = JSON.parse(baselineText) as { nextCursor: string };
  const baselineCursor = baseline.nextCursor;

  const operations = Array.from({ length: 3 }, (_, index) => ({
    operationId: randomUUID(),
    entityType: "TASK" as const,
    entityId: randomUUID(),
    operation: "CREATE" as const,
    baseVersion: 0,
    payload: { title: `Pull contract ${index + 1}`, status: "TODO", priority: "NONE" },
    createdAt: new Date(Date.now() + index).toISOString(),
  }));
  const expectedIds = new Set(operations.map((operation) => operation.operationId));

  const push = await fetch(`${apiBaseUrl}/api/v1/sync/push`, {
    method: "POST",
    headers: pushHeaders,
    body: JSON.stringify({ operations }),
  });
  const pushText = await push.text();
  assert.equal(push.status, 200, `push failed: HTTP ${push.status}: ${pushText}`);

  let cursor = baselineCursor;
  let previousCursor = BigInt(cursor);
  const seen = new Set<string>();
  const pages: Array<Array<{ operationId: string; sequence: string }>> = [];

  for (let page = 0; page < 10 && seen.size < expectedIds.size; page += 1) {
    const response = await fetch(`${apiBaseUrl}/api/v1/sync?cursor=${cursor}&limit=2`, { headers: authHeaders });
    const text = await response.text();
    assert.equal(response.status, 200, `pull page ${page + 1} failed: HTTP ${response.status}: ${text}`);
    const body = JSON.parse(text) as { cursor: string; nextCursor: string; hasMore: boolean; operations: Array<{ operationId: string; sequence: string }> };
    assert.equal(body.cursor, cursor);

    const nextCursor = BigInt(body.nextCursor);
    if (body.operations.length > 0) assert.ok(nextCursor > previousCursor);
    for (const operation of body.operations) {
      if (expectedIds.has(operation.operationId)) seen.add(operation.operationId);
    }
    pages.push(body.operations);

    if (seen.size === expectedIds.size) break;
    assert.ok(body.hasMore, `cursor stopped before all test operations were observed; seen ${seen.size}/${expectedIds.size}`);
    assert.ok(nextCursor > previousCursor);
    previousCursor = nextCursor;
    cursor = body.nextCursor;
  }

  assert.equal(seen.size, expectedIds.size, `expected all pushed operations to be pullable, seen ${seen.size}/${expectedIds.size}`);
  assert.ok(pages.length >= 2, "limit=2 should require at least two pages for three operations");

  const finalCursor = cursor === baselineCursor ? baselineCursor : cursor;
  const empty = await fetch(`${apiBaseUrl}/api/v1/sync?cursor=${finalCursor}&limit=500`, { headers: authHeaders });
  const emptyText = await empty.text();
  assert.equal(empty.status, 200, `final pull failed: HTTP ${empty.status}: ${emptyText}`);
  const emptyBody = JSON.parse(emptyText) as { cursor: string; nextCursor: string; hasMore: boolean; operations: unknown[] };
  assert.equal(emptyBody.operations.length, 0);
  assert.equal(emptyBody.hasMore, false);
  assert.equal(emptyBody.nextCursor, finalCursor);
});
