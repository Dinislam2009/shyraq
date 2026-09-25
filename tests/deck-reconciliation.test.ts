import test from "node:test";
import assert from "node:assert/strict";
import {isStaleVersion} from "../src/lib/concurrency.ts";

test("matching timestamps are not stale",()=>{
 const timestamp="2026-09-25T12:00:00.000Z";
 assert.equal(isStaleVersion(timestamp,timestamp),false);
});

test("different timestamps are stale",()=>{
 assert.equal(isStaleVersion("2026-09-25T12:00:00.000Z","2026-09-25T12:00:01.000Z"),true);
});

test("missing timestamps do not force a conflict",()=>{
 assert.equal(isStaleVersion(undefined,"2026-09-25T12:00:00.000Z"),false);
});
