import assert from "node:assert/strict";
import test from "node:test";

const apiBaseUrl = process.env.SHYRAQ_TEST_API_URL ?? "http://localhost:4000";

test("health endpoint is reachable", async () => {
  const response = await fetch(`${apiBaseUrl}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok", service: "shyraq-api" });
});

test("database health endpoint is reachable", async () => {
  const response = await fetch(`${apiBaseUrl}/health/db`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok", database: "reachable" });
});
