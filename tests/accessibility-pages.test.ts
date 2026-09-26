import {readFileSync} from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const corePages=[
 "src/app/dashboard/page.tsx",
 "src/app/decks/page.tsx",
 "src/app/review/page.tsx",
 "src/app/explore/page.tsx",
 "src/app/import/page.tsx",
 "src/app/export/page.tsx",
 "src/app/search/page.tsx",
 "src/app/statistics/page.tsx",
 "src/app/settings/page.tsx",
 "src/app/settings/workspace/page.tsx",
 "src/app/settings/profile/page.tsx",
 "src/app/offline/page.tsx",
] as const;

test("core App Router pages expose a semantic primary heading",()=>{
 for(const file of corePages){
  const source=readFileSync(new URL("../"+file,import.meta.url),"utf8");
  assert.match(source,/<h1(?:\s|>)/,file+" should expose an h1");
  assert.doesNotMatch(source,/<main(?:\s|>)/,file+" should rely on the shared AppShell main landmark");
 }
});

test("shared shell owns the page main landmark and skip target",()=>{
 const shell=readFileSync(new URL("../src/components/app-shell.tsx",import.meta.url),"utf8");
 assert.match(shell,/<main[^>]+id="main-content"/);
 assert.match(shell,/href="#main-content"/);
});
