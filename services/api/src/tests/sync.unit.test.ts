import assert from "node:assert/strict";
import test from "node:test";
import { compareLogicalTime } from "../routes/sync.js";

test("older logical time loses to newer logical time", () => {
  const older = new Date("2026-08-26T10:00:00.000Z");
  const newer = new Date("2026-08-26T10:00:01.000Z");
  assert.ok(compareLogicalTime(older, "01900000-0000-7000-8000-000000000001", newer, "01900000-0000-7000-8000-000000000000") < 0);
});

test("equal timestamps use operationId as deterministic tie breaker", () => {
  const timestamp = new Date("2026-08-26T10:00:00.000Z");
  const smaller = "01900000-0000-7000-8000-000000000001";
  const larger = "01900000-0000-7000-8000-000000000002";
  assert.ok(compareLogicalTime(timestamp, smaller, timestamp, larger) < 0);
  assert.ok(compareLogicalTime(timestamp, larger, timestamp, smaller) > 0);
  assert.equal(compareLogicalTime(timestamp, smaller, timestamp, smaller), 0);
});
