import {readFileSync} from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const standalonePages=new Set(["src/app/login/page.tsx","src/app/signup/page.tsx"]);
const redirectOnlyPages=new Set(["src/app/page.tsx"]);

const pageFiles=[
  "src/app/collections/[id]/page.tsx",
  "src/app/collections/[id]/permissions/page.tsx",
  "src/app/collections/page.tsx",
  "src/app/collections/public/[id]/page.tsx",
  "src/app/dashboard/page.tsx",
  "src/app/decks/[id]/cards/[cardId]/edit/page.tsx",
  "src/app/decks/[id]/cards/[cardId]/history/page.tsx",
  "src/app/decks/[id]/cards/bulk/page.tsx",
  "src/app/decks/[id]/cards/new/page.tsx",
  "src/app/decks/[id]/collaboration/page.tsx",
  "src/app/decks/[id]/page.tsx",
  "src/app/decks/[id]/permissions/page.tsx",
  "src/app/decks/[id]/settings/page.tsx",
  "src/app/decks/[id]/templates/page.tsx",
  "src/app/decks/[id]/updates/page.tsx",
  "src/app/decks/new/page.tsx",
  "src/app/decks/page.tsx",
  "src/app/decks/trash/page.tsx",
  "src/app/explore/[id]/page.tsx",
  "src/app/explore/following/page.tsx",
  "src/app/explore/page.tsx",
  "src/app/export/page.tsx",
  "src/app/history/audit/page.tsx",
  "src/app/history/page.tsx",
  "src/app/import/anki/page.tsx",
  "src/app/import/page.tsx",
  "src/app/invite/[token]/page.tsx",
  "src/app/legal/community/page.tsx",
  "src/app/legal/data-retention/page.tsx",
  "src/app/legal/privacy/page.tsx",
  "src/app/legal/terms/page.tsx",
  "src/app/login/page.tsx",
  "src/app/markers/page.tsx",
  "src/app/media/page.tsx",
  "src/app/notifications/page.tsx",
  "src/app/offline/page.tsx",
  "src/app/page.tsx",
  "src/app/review/config/page.tsx",
  "src/app/review/page.tsx",
  "src/app/search/page.tsx",
  "src/app/settings/account/page.tsx",
  "src/app/settings/devices/page.tsx",
  "src/app/settings/health/page.tsx",
  "src/app/settings/moderation/page.tsx",
  "src/app/settings/moderation/platform/page.tsx",
  "src/app/settings/moderation/reports/page.tsx",
  "src/app/settings/page.tsx",
  "src/app/settings/profile/page.tsx",
  "src/app/settings/review/diagnostics/page.tsx",
  "src/app/settings/review/page.tsx",
  "src/app/settings/sync/page.tsx",
  "src/app/settings/workspace/page.tsx",
  "src/app/signup/page.tsx",
  "src/app/statistics/page.tsx",
  "src/app/tags/page.tsx",
  "src/app/u/[username]/page.tsx"
] as const;

test("all App Router pages expose a semantic primary heading and no nested main landmark",()=>{
 for(const file of pageFiles){
  const source=readFileSync(new URL("../"+file,import.meta.url),"utf8");
  if(redirectOnlyPages.has(file)) continue;
  assert.match(source,/<h1(?:\s|>)/,file+" should expose an h1");
  if(!standalonePages.has(file)) assert.doesNotMatch(source,/<main(?:\s|>)/,file+" should rely on the shared AppShell main landmark");
 }
});

test("shared shell owns the page main landmark and skip target",()=>{
 const shell=readFileSync(new URL("../src/components/app-shell.tsx",import.meta.url),"utf8");
 assert.match(shell,/<main[^>]+id="main-content"/);
 assert.match(shell,/href="#main-content"/);
});
