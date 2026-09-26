import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

test("offline route is a local review app with a precached fallback",()=>{
 const page=readFileSync(new URL("../src/app/offline/page.tsx",import.meta.url),"utf8");
 const app=readFileSync(new URL("../src/components/offline-review-app.tsx",import.meta.url),"utf8");
 const worker=readFileSync(new URL("../public/sw.js",import.meta.url),"utf8");
 assert.match(page,/OfflineReviewApp/);
 assert.match(app,/getOfflineReviewQueue/);
 assert.match(app,/queueReview/);
 assert.match(app,/upsertOfflineReviewState/);
 assert.match(worker,/const APP_SHELL=\["\/offline","\/favicon\.ico"\]/);
 assert.match(worker,/caches\.match\("/offline")/);
});
