import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {verifyArchiveChecksums} from "../src/lib/backup/integrity.ts";

test("valid checksum manifest passes",()=>{
 const bytes=new TextEncoder().encode("hello");
 const checksum=createHash("sha256").update(bytes).digest("hex");
 const manifest=new TextEncoder().encode(JSON.stringify({algorithm:"sha256",files:{"data.txt":checksum}}));
 assert.doesNotThrow(()=>verifyArchiveChecksums({"data.txt":bytes,"checksums.json":manifest}));
});

test("corrupted backup is rejected",()=>{
 const bytes=new TextEncoder().encode("hello");
 const manifest=new TextEncoder().encode(JSON.stringify({algorithm:"sha256",files:{"data.txt":"wrong"}}));
 assert.throws(()=>verifyArchiveChecksums({"data.txt":bytes,"checksums.json":manifest}),/integrity check failed/);
});
