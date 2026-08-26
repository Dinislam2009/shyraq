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

test("authenticated project CRUD contract", { skip: !enabled }, async () => {
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

  const create = await fetch(`${apiBaseUrl}/api/v1/projects`, {
    method: "POST",
    headers,
    body: JSON.stringify({ name: `Projects contract ${randomUUID()}`, description: "initial" }),
  });
  const createText = await create.text();
  assert.equal(create.status, 201, `create failed: HTTP ${create.status}: ${createText}`);
  const created = JSON.parse(createText) as { id: string; name: string; description: string | null };
  assert.ok(created.id);
  assert.equal(created.description, "initial");

  const list = await fetch(`${apiBaseUrl}/api/v1/projects`, { headers });
  const listText = await list.text();
  assert.equal(list.status, 200, `list failed: HTTP ${list.status}: ${listText}`);
  const projects = JSON.parse(listText) as Array<{ id: string }>;
  assert.ok(projects.some((project) => project.id === created.id));

  const update = await fetch(`${apiBaseUrl}/api/v1/projects/${created.id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ name: "Projects contract updated" }),
  });
  const updateText = await update.text();
  assert.equal(update.status, 200, `update failed: HTTP ${update.status}: ${updateText}`);
  const updated = JSON.parse(updateText) as { name: string };
  assert.equal(updated.name, "Projects contract updated");

  const archive = await fetch(`${apiBaseUrl}/api/v1/projects/${created.id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ archived: true }),
  });
  assert.equal(archive.status, 200, `archive failed: HTTP ${archive.status}: ${await archive.text()}`);

  const afterArchive = await fetch(`${apiBaseUrl}/api/v1/projects`, { headers });
  const afterArchiveText = await afterArchive.text();
  assert.equal(afterArchive.status, 200, `post-archive list failed: HTTP ${afterArchive.status}: ${afterArchiveText}`);
  const remaining = JSON.parse(afterArchiveText) as Array<{ id: string }>;
  assert.equal(remaining.some((project) => project.id === created.id), false);

  const remove = await fetch(`${apiBaseUrl}/api/v1/projects/${created.id}`, {
    method: "DELETE",
    headers: { authorization: `Bearer ${data.session.access_token}` },
  });
  assert.equal(remove.status, 204, `delete failed: HTTP ${remove.status}: ${await remove.text()}`);
});
