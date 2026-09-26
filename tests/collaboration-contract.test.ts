import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const realtime=readFileSync(new URL("../src/components/collaboration-realtime.tsx",import.meta.url),"utf8");
const deckPage=readFileSync(new URL("../src/app/decks/[id]/page.tsx",import.meta.url),"utf8");

test("collaboration realtime refreshes app data without a full browser reload",()=>{
 assert.ok(realtime.includes('import {useRouter} from "next/navigation";'));
 assert.ok(realtime.includes("router.refresh()"));
 assert.ok(!realtime.includes("window.location.reload()"));
});

test("deck page subscribes to collaborative realtime updates",()=>{
 assert.ok(deckPage.includes('<CollaborationRealtime deckId={id} workspaceId={String(deck.workspace_id)}/>'));
 assert.ok(realtime.includes('table:"cards",filter:"deck_id=eq."+deckId'));
 assert.ok(realtime.includes('table:"card_templates",filter:"deck_id=eq."+deckId'));
});
