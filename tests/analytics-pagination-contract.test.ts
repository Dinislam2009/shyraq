import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const source=readFileSync(new URL("../src/lib/supabase/queries.ts",import.meta.url),"utf8");

test("analytics reads paginate instead of truncating at fixed large caps",()=>{
 assert.match(source,/workspaceCardsResult=workspaceDeckIds\.length/);
 assert.match(source,/fetchAllRows<\{id:string\}>/);
 assert.match(source,/const \[eventsResult,statesResult\]=await Promise\.all/);
 assert.match(source,/fetchAllRows<any>\(\(from,to\)=>supabase\.from\("review_events"/);
 assert.doesNotMatch(source,/review_events"[\s\S]*\.limit\(50000\)/);
 assert.doesNotMatch(source,/review_states"[\s\S]*\.limit\(50000\)/);
 assert.doesNotMatch(source,/from\("cards"\)[\s\S]*\.limit\(20000\)/);
 assert.doesNotMatch(source,/review_events"[\s\S]*\.limit\(5000\)/);
});

test("analytics surfaces pagination query failures",()=>{
 assert.match(source,/if\(workspaceCardsResult\.error\)throw workspaceCardsResult\.error/);
 assert.match(source,/if\(eventsResult\.error\)throw eventsResult\.error/);
 assert.match(source,/if\(statesResult\.error\)throw statesResult\.error/);
 assert.match(source,/if\(todayEventsResult\.error\)throw todayEventsResult\.error/);
});
