import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";

const apiBaseUrl = process.env.SHYRAQ_TEST_API_URL ?? "http://localhost:4000";
const token = process.env.SHYRAQ_TEST_TOKEN;

test("authenticated sync contract", { skip: !token }, async () => {
  const headers = {
    authorization: `Bearer ${token}`,
    "content-type": "application/json",
  };
  const entityId = randomUUID();
  const operationId = randomUUID();

  const push = await fetch(`${apiBaseUrl}/api/v1/sync/push`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      operations: [
        {
          operationId,
          entityType: "TASK",
          entityId,
          operation: "CREATE",
          baseVersion: 0,
          payload: { title: "Sync contract test", status: "TODO", priority: "NONE" },
          createdAt: new Date().toISOString(),
        },
      ],
    }),
  });

  assert.equal(push.status, 200);
  const pushBody = await push.json() as { results: Array<{ operationId: string; status: string }> };
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
  const duplicateBody = await duplicate.json() as { results: Array<{ status: string }> };
  assert.deepEqual(duplicateBody.results, [{ operationId, entityId, status: "DUPLICATE" }]);
});
