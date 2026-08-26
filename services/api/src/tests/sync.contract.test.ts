import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const apiBaseUrl = process.env.SHYRAQ_TEST_API_URL ?? "http://localhost:4000";
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const email = process.env.SHYRAQ_TEST_EMAIL;
const password = process.env.SHYRAQ_TEST_PASSWORD;
const enabled = Boolean(supabaseUrl && supabaseAnonKey && email && password);

test("authenticated sync contract", { skip: !enabled }, async () => {
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
  const entityId = randomUUID();
  const operationId = randomUUID();

  const push = await fetch(`${apiBaseUrl}/api/v1/sync/push`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      operations: [{
        operationId,
        entityType: "TASK",
        entityId,
        operation: "CREATE",
        baseVersion: 0,
        payload: { title: "Sync contract test", status: "TODO", priority: "NONE" },
        createdAt: new Date().toISOString(),
      }],
    }),
  });

  assert.equal(push.status, 200);
  const pushBody = await push.json() as { results: Array<{ operationId: string; entityId: string; status: string }> };
  assert.deepEqual(pushBody.results, [{ operationId, entityId, status: "APPLIED" }]);

  const duplicate = await fetch(`${apiBaseUrl}/api/v1/sync/push`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      operations: [{
        operationId,
        entityType: "TASK",
        entityId,
        operation: "CREATE",
        baseVersion: 0,
        payload: { title: "Sync contract test", status: "TODO", priority: "NONE" },
        createdAt: new Date().toISOString(),
      }],
    }),
  });

  assert.equal(duplicate.status, 200);
  const duplicateBody = await duplicate.json() as { results: Array<{ operationId: string; entityId: string; status: string }> };
  assert.deepEqual(duplicateBody.results, [{ operationId, entityId, status: "DUPLICATE" }]);
});
