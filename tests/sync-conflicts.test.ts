import test from "node:test";
import assert from "node:assert/strict";
import {compareReviewTimestamps,shouldPreserveRemoteState} from "../src/lib/sync/conflicts.ts";

test("newer incoming review wins",()=>assert.equal(compareReviewTimestamps("2026-09-25T10:00:00Z","2026-09-25T10:01:00Z"),"incoming"));
test("newer remote review is preserved",()=>assert.equal(compareReviewTimestamps("2026-09-25T10:02:00Z","2026-09-25T10:01:00Z"),"remote"));
test("missing remote timestamp does not block incoming",()=>assert.equal(shouldPreserveRemoteState(null,"2026-09-25T10:01:00Z"),false));
