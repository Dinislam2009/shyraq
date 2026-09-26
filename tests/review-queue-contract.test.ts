import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const source=readFileSync(new URL("../src/lib/supabase/queries.ts",import.meta.url),"utf8");

test("review queue paginates review-state membership instead of capping at 5000 rows",()=>{
 assert.match(source,/async function fetchAllRows<T>/);
 assert.match(source,/fetchAllRows<\{card_id:string\}>/);
 assert.match(source,/\.range\(from,to\)/);
 assert.doesNotMatch(source,/review_states"\)\.select\("card_id"\)\.eq\("user_id",user\.id\)\.limit\(5000\)/);
});

test("review queue fails closed when review-state membership cannot be loaded",()=>{
 assert.match(source,/if\(trackedResult\.error\)return result/);
 assert.match(source,/if\(trackedResult\.error\)return null/);
});
