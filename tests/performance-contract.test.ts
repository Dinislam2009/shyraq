import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

test("large deck and card lists have virtualization contracts",()=>{
 const decks=readFileSync(new URL("../src/components/deck-library.tsx",import.meta.url),"utf8");
 const cards=readFileSync(new URL("../src/components/card-manager.tsx",import.meta.url),"utf8");
 assert.match(decks,/shouldVirtualize/);
 assert.match(decks,/DECK_ROW_HEIGHT/);
 assert.match(decks,/visibleDecks/);
 assert.match(cards,/shouldVirtualizeTable/);
 assert.match(cards,/TABLE_ROW_HEIGHT/);
 assert.match(cards,/visibleTableRows/);
});

test("performance and accessibility audits are wired into package scripts",()=>{
 const pkg=JSON.parse(readFileSync(new URL("../package.json",import.meta.url),"utf8"));
 assert.equal(pkg.scripts["audit:aria"],"node scripts/aria-audit.mjs");
 assert.equal(pkg.scripts["audit:performance"],"node scripts/page-performance-audit.mjs");
});
