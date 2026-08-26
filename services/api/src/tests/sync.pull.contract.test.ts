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
  let cursor = baseline.nextCursor;

  const operations = Array.from({ length: 3 }, (_, index) => ({
    operationId: randomUUID(),
    entityType: "TASK" as const,
    entityId: randomUUID(),
    operation: "CREATE" as const,
    baseVersion: 0,
    payload: { title: `Pull contract ${index + 1}`, status: "TODO", priority: "NONE" },
    createdAt: new Date(Date.now() + index).toISOString(),
  }));
  const expectedIds = new Set<string>(operations.map((operation) => operation.operationId));

  const push = await fetch(`${apiBaseUrl}/api/v1/sync/push`, {
    method: "POST",
    headers: pushHeaders,
    body: JSON.stringify({ operations }),
  });
  const pushText = await push.text();
  assert.equal(push.status, 200, `push failed: HTTP ${push.status}: ${pushText}`);

  const received = new Set<string>();
  let previousCursor = cursor;
  let pages = 0;

  while (received.size < expectedIds.size && pages < 20) {
    const response = await fetch(`${apiBaseUrl}/api/v1/sync?cursor=${cursor}&limit=2`, { headers: authHeaders });
    const text = await response.text();
    assert.equal(response.status, 200, `pull failed: HTTP ${response.status}: ${text}`);
    const body = JSON.parse(text) as {
      cursor: string;
      nextCursor: string;
      hasMore: boolean;
      operations: Array<{ operationId: string; sequence: string }>;
    };

    assert.equal(body.cursor, cursor);
    assert.ok(BigInt(body.nextCursor) >= BigInt(cursor));

    for (const operation of body.operations) {
      if (expectedIds.has(operation.operationId)) {
        assert.equal(received.has(operation.operationId), false, `operation repeated: ${operation.operationId}`);
        received.add(operation.operationId);
      }
    }

    pages += 1;
    if (body.nextCursor === cursor) break;
    previousCursor = cursor;
    cursor = body.nextCursor;
  }

  assert.equal(received.size, expectedIds.size);
  assert.ok(pages >= 2);
  assert.ok(BigInt(cursor) >= BigInt(previousCursor));
});
