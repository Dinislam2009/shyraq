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

test("authenticated focus session contract", { skip: !enabled }, async () => {
  const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  const { data, error } = await supabase.auth.signInWithPassword({ email: email!, password: password! });
  assert.ifError(error);
  assert.ok(data.session?.access_token);

  const authHeaders = {
    authorization: `Bearer ${data.session.access_token}`,
  };
  const jsonHeaders = {
    ...authHeaders,
    "content-type": "application/json",
  };

  const start = await fetch(`${apiBaseUrl}/api/v1/focus`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({}),
  });
  const startBodyText = await start.text();
  assert.equal(start.status, 201, `start failed: HTTP ${start.status}: ${startBodyText}`);
  const session = JSON.parse(startBodyText) as {
    id: string;
    status: string;
    startedAt: string;
    endedAt: string | null;
    durationSeconds: number | null;
  };
  assert.ok(session.id);
  assert.equal(session.status, "RUNNING");
  assert.equal(session.endedAt, null);
  assert.equal(session.durationSeconds, null);

  const duplicate = await fetch(`${apiBaseUrl}/api/v1/focus`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({}),
  });
  const duplicateBodyText = await duplicate.text();
  assert.equal(duplicate.status, 409, `duplicate start failed: HTTP ${duplicate.status}: ${duplicateBodyText}`);

  const list = await fetch(`${apiBaseUrl}/api/v1/focus`, { headers: authHeaders });
  const listBodyText = await list.text();
  assert.equal(list.status, 200, `list failed: HTTP ${list.status}: ${listBodyText}`);
  const listed = JSON.parse(listBodyText) as Array<{ id: string; status: string }>;
  assert.ok(listed.some((item) => item.id === session.id && item.status === "RUNNING"));

  const complete = await fetch(`${apiBaseUrl}/api/v1/focus/${session.id}/complete`, {
    method: "POST",
    headers: authHeaders,
  });
  const completeBodyText = await complete.text();
  assert.equal(complete.status, 200, `complete failed: HTTP ${complete.status}: ${completeBodyText}`);
  const completed = JSON.parse(completeBodyText) as {
    id: string;
    status: string;
    endedAt: string | null;
    durationSeconds: number | null;
  };
  assert.equal(completed.id, session.id);
  assert.equal(completed.status, "COMPLETED");
  assert.ok(completed.endedAt);
  assert.notEqual(completed.durationSeconds, null);
  assert.ok(completed.durationSeconds! >= 0);

  const completeAgain = await fetch(`${apiBaseUrl}/api/v1/focus/${session.id}/complete`, {
    method: "POST",
    headers: authHeaders,
  });
  const completeAgainBodyText = await completeAgain.text();
  assert.equal(completeAgain.status, 409, `second complete failed: HTTP ${completeAgain.status}: ${completeAgainBodyText}`);

  const startSecond = await fetch(`${apiBaseUrl}/api/v1/focus`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({}),
  });
  const startSecondBodyText = await startSecond.text();
  assert.equal(startSecond.status, 201, `second start failed: HTTP ${startSecond.status}: ${startSecondBodyText}`);
  const second = JSON.parse(startSecondBodyText) as { id: string; status: string };
  assert.equal(second.status, "RUNNING");

  const cancel = await fetch(`${apiBaseUrl}/api/v1/focus/${second.id}/cancel`, {
    method: "POST",
    headers: authHeaders,
  });
  const cancelBodyText = await cancel.text();
  assert.equal(cancel.status, 200, `cancel failed: HTTP ${cancel.status}: ${cancelBodyText}`);
  const cancelled = JSON.parse(cancelBodyText) as {
    id: string;
    status: string;
    endedAt: string | null;
  };
  assert.equal(cancelled.id, second.id);
  assert.equal(cancelled.status, "CANCELLED");
  assert.ok(cancelled.endedAt);

  const invalid = await fetch(`${apiBaseUrl}/api/v1/focus/${randomUUID()}/complete`, {
    method: "POST",
    headers: authHeaders,
  });
  const invalidBodyText = await invalid.text();
  assert.equal(invalid.status, 404, `missing session failed: HTTP ${invalid.status}: ${invalidBodyText}`);
});
