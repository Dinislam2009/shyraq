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

  const headers = {
    authorization: `Bearer ${data.session.access_token}`,
    "content-type": "application/json",
  };
  const operations = Array.from({ length: 3 }, (_, index) => ({
    operationId: randomUUID(),
    entityType: "TASK" as const,
    entityId: randomUUID(),
    operation: "CREATE" as const,
    baseVersion: 0,
    payload: { title: `Pull contract ${index + 1}`, status: "TODO", priority: "NONE" },
    createdAt: new Date(Date.now() + index).toISOString(),
  }));

  const push = await fetch(`${apiBaseUrl}/api/v1/sync/push`, {
    method: "POST",
    headers,
    body: JSON.stringify({ operations }),
  });
  const pushText = await push.text();
  assert.equal(push.status, 200, `push failed: HTTP ${push.status}: ${pushText}`);

  const first = await fetch(`${apiBaseUrl}/api/v1/sync?cursor=0&limit=2`, {
    headers: { authorization: `Bearer ${data.session.access_token}` },
  });
  const firstText = await first.text();
  assert.equal(first.status, 200, `first pull failed: HTTP ${first.status}: ${firstText}`);
  const firstBody = JSON.parse(firstText) as { cursor: string; nextCursor: string; hasMore: boolean; operations: Array<{ operationId: string; sequence: string }> };
  assert.equal(firstBody.cursor, "0");
  assert.equal(firstBody.operations.length, 2);
  assert.equal(firstBody.hasMore, true);
  assert.ok(BigInt(firstBody.nextCursor) > 0n);

  const second = await fetch(`${apiBaseUrl}/api/v1/sync?cursor=${firstBody.nextCursor}&limit=2`, {
    headers: { authorization: `Bearer ${data.session.access_token}` },
  });
  const secondText = await second.text();
  assert.equal(second.status, 200, `second pull failed: HTTP ${second.status}: ${secondText}`);
  const secondBody = JSON.parse(secondText) as { cursor: string; nextCursor: string; hasMore: boolean; operations: Array<{ operationId: string; sequence: string }> };
  assert.equal(secondBody.operations.length, 1);
  assert.equal(secondBody.hasMore, false);
  assert.equal(secondBody.operations[0]?.operationId, operations[2]?.operationId);
  assert.ok(BigInt(secondBody.nextCursor) > BigInt(firstBody.nextCursor));

  const empty = await fetch(`${apiBaseUrl}/api/v1/sync?cursor=${secondBody.nextCursor}&limit=2`, {
    headers: { authorization: `Bearer ${data.session.access_token}` },
  });
  const emptyText = await empty.text();
  assert.equal(empty.status, 200, `empty pull failed: HTTP ${empty.status}: ${emptyText}`);
  const emptyBody = JSON.parse(emptyText) as { cursor: string; nextCursor: string; hasMore: boolean; operations: unknown[] };
  assert.equal(emptyBody.operations.length, 0);
  assert.equal(emptyBody.hasMore, false);
  assert.equal(emptyBody.nextCursor, secondBody.nextCursor);
});
