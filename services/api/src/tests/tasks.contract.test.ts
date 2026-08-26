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

test("authenticated task CRUD contract", { skip: !enabled }, async () => {
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
  const operationId = randomUUID();

  const create = await fetch(`${apiBaseUrl}/api/v1/tasks`, {
    method: "POST",
    headers,
    body: JSON.stringify({ operationId, title: "CRUD contract test", description: "initial", priority: "HIGH" }),
  });
  const createBodyText = await create.text();
  assert.equal(create.status, 201, `create failed: HTTP ${create.status}: ${createBodyText}`);
  const created = JSON.parse(createBodyText) as { id: string; title: string; version: number };
  assert.equal(created.title, "CRUD contract test");
  assert.equal(created.version, 1);

  const list = await fetch(`${apiBaseUrl}/api/v1/tasks`, { headers });
  const listBodyText = await list.text();
  assert.equal(list.status, 200, `list failed: HTTP ${list.status}: ${listBodyText}`);
  const listed = JSON.parse(listBodyText) as Array<{ id: string }>;
  assert.ok(listed.some((task) => task.id === created.id));

  const update = await fetch(`${apiBaseUrl}/api/v1/tasks/${created.id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ operationId: randomUUID(), title: "CRUD contract updated", status: "COMPLETED" }),
  });
  const updateBodyText = await update.text();
  assert.equal(update.status, 200, `update failed: HTTP ${update.status}: ${updateBodyText}`);
  const updated = JSON.parse(updateBodyText) as { id: string; title: string; status: string; version: number };
  assert.equal(updated.id, created.id);
  assert.equal(updated.title, "CRUD contract updated");
  assert.equal(updated.status, "COMPLETED");
  assert.equal(updated.version, 2);

  const remove = await fetch(`${apiBaseUrl}/api/v1/tasks/${created.id}`, {
    method: "DELETE",
    headers: { authorization: `Bearer ${data.session.access_token}` },
  });
  const removeBodyText = await remove.text();
  assert.equal(remove.status, 204, `delete failed: HTTP ${remove.status}: ${removeBodyText}`);

  const afterDelete = await fetch(`${apiBaseUrl}/api/v1/tasks`, { headers });
  const afterDeleteBodyText = await afterDelete.text();
  assert.equal(afterDelete.status, 200, `post-delete list failed: HTTP ${afterDelete.status}: ${afterDeleteBodyText}`);
  const remaining = JSON.parse(afterDeleteBodyText) as Array<{ id: string }>;
  assert.equal(remaining.some((task) => task.id === created.id), false);
});
