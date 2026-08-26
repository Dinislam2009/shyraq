import assert from "node:assert/strict";
import test from "node:test";

function compareLogicalTime(clientTime: Date, operationId: string, serverTime: Date) {
  const clientMs = clientTime.getTime();
  const serverMs = serverTime.getTime();
  if (clientMs !== serverMs) return clientMs - serverMs;
  return operationId.localeCompare(operationId);
}

test("older logical time loses to newer logical time", () => {
  const older = new Date("2026-08-26T10:00:00.000Z");
  const newer = new Date("2026-08-26T10:00:01.000Z");
  assert.ok(compareLogicalTime(older, "01900000-0000-7000-8000-000000000001", newer) < 0);
});

test("equal timestamps use operationId as deterministic tie breaker", () => {
  const timestamp = new Date("2026-08-26T10:00:00.000Z");
  assert.ok(compareLogicalTime(timestamp, "01900000-0000-7000-8000-000000000001", timestamp) < 0);
  assert.ok(compareLogicalTime(timestamp, "01900000-0000-7000-8000-000000000002", timestamp) > 0);
});
