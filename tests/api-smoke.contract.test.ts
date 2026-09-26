import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const smoke=readFileSync(new URL("../scripts/api-smoke.mjs",import.meta.url),"utf8");

test("API smoke starts Next directly with Node",()=>{
 assert.match(smoke,/spawn\(process\.execPath,\[nextBin\.pathname,"start","-p",port\]/);
 assert.match(smoke,/new URL\("\.\.\/node_modules\/next\/dist\/bin\/next",import\.meta\.url\)/);
});

test("API smoke terminates its tracked child process",()=>{
 assert.match(smoke,/child\.kill\("SIGTERM"\)/);
 assert.match(smoke,/child\.kill\("SIGKILL"\)/);
});
