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


test("workspace member search uses profile identity fields",()=>{
 const page=readFileSync(new URL("../src/app/settings/workspace/page.tsx",import.meta.url),"utf8");
 assert.ok(page.includes('select("id,username,display_name,avatar_url")'));
 assert.ok(page.includes("profile?.username,profile?.display_name"));
 assert.ok(page.includes('placeholder="Search by name, username or user id"'));
 assert.ok(page.includes("profile?.display_name||profile?.username||\"Member\""));
});


test("presence tracks collaborator identity and active editor roles",()=>{
 const presence=readFileSync(new URL("../src/components/collaboration-presence.tsx",import.meta.url),"utf8");
 assert.ok(presence.includes("displayName"));
 assert.ok(presence.includes("role"));
 assert.ok(presence.includes("channel.track(localPresence.current)"));
 assert.ok(presence.includes('const editors=members.filter'));
 assert.ok(presence.includes('active {editors.length===1?"editor":"editors"}'));
 assert.ok(presence.includes("activeCardId"));
 assert.ok(presence.includes("selectionStart"));
 assert.ok(presence.includes("shyraq:editor-presence"));
 assert.ok(deckPage.includes('displayName={String(currentProfile?.display_name||currentProfile?.username||"Member")'));
});


test("card editor uses realtime draft broadcast for existing collaborative cards",()=>{
 const draft=readFileSync(new URL("../src/lib/collaboration/draft.ts",import.meta.url),"utf8");
 const editor=readFileSync(new URL("../src/components/card-editor.tsx",import.meta.url),"utf8");
 assert.ok(draft.includes('event:"card-draft"'));
 assert.ok(draft.includes("sourceRef"));
 assert.ok(editor.includes("useCardDraftChannel"));
 assert.ok(editor.includes("Live draft collaboration is enabled"));
});
