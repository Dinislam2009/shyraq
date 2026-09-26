import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const backup=readFileSync(new URL("../src/lib/backup/json.ts",import.meta.url),"utf8");
const actions=readFileSync(new URL("../src/app/export/actions.ts",import.meta.url),"utf8");
const diagnostics=readFileSync(new URL("../src/app/api/sync/diagnostics/route.ts",import.meta.url),"utf8");
const notifications=readFileSync(new URL("../src/app/notifications/actions.ts",import.meta.url),"utf8");

test("JSON backup fails instead of silently exporting partial database data",()=>{
 assert.ok(backup.includes("const {data:decks,error:decksError}=await"));
 assert.ok(backup.includes("if(decksError)throw new Error(decksError.message)"));
 assert.ok(backup.includes("const firstError=[tagsResult,collectionsResult,eventsResult,statesResult,prefsResult,mediaResult,copiesResult,followsResult].find(result=>result.error)?.error"));
 assert.ok(backup.includes("if(firstError)throw new Error(firstError.message)"));
 assert.ok(backup.includes("const linkError=cardTagsResult.error||collectionCardsResult.error"));
});

test("backup actions surface storage and database cleanup failures",()=>{
 assert.ok(actions.includes('const {error:cleanupError}=await supabase.storage.from("user-media").remove'));
 assert.ok(actions.includes('const {error:storageError}=await supabase.storage.from("user-media").remove([version.storage_path])'));
 assert.ok(actions.includes('const {error:deleteError}=await supabase.from("backup_versions").delete'));
 assert.ok(actions.includes('const {data:record,error:recordError}=await supabase.from("backup_versions")'));
});

test("sync diagnostics fails on database query errors instead of returning incomplete data",()=>{
 assert.ok(diagnostics.includes("const firstError=[devicesResult,eventsResult,changesResult,conflictsResult].find(result=>result.error)?.error"));
 assert.ok(diagnostics.includes("if(firstError)return NextResponse.json({error:firstError.message},{status:500})"));
});

test("notification update actions surface database write failures",()=>{
 assert.ok(notifications.includes('const {error}=await supabase.from("notifications").update'));
 assert.ok(notifications.includes('if(error)redirect("/notifications?error='));
});


const cardsActions=readFileSync(new URL("../src/app/decks/[id]/cards/actions.ts",import.meta.url),"utf8");
const collaborationActions=readFileSync(new URL("../src/app/decks/[id]/collaboration/actions.ts",import.meta.url),"utf8");
const copiedDeckActions=readFileSync(new URL("../src/app/explore/[id]/actions.ts",import.meta.url),"utf8");
const collectionActions=readFileSync(new URL("../src/app/collections/actions.ts",import.meta.url),"utf8");

test("card actions surface media cleanup and bulk tag write failures",()=>{
 assert.ok(cardsActions.includes(`const {error:mediaError}=await supabase.from("media").delete`));
 assert.ok(cardsActions.includes(`const {error:storageError}=await supabase.storage.from("user-media").remove`));
 assert.ok(cardsActions.includes(`const {error:linkError}=await supabase.from("card_tags").upsert`));
 assert.ok(cardsActions.includes("async function fetchAllRows<T>"));
});

test("collaboration actions surface activity, mention, and restore write failures",()=>{
 assert.ok(collaborationActions.includes(`const {error}=await supabase.from("activity_feed").insert`));
 assert.ok(collaborationActions.includes(`const {error:mentionError}=await supabase.from("comment_mentions").upsert`));
 assert.ok(collaborationActions.includes(`const {error:cardError}=await supabase.from("cards").update`));
});

test("copied-deck updates surface partial write failures",()=>{
 assert.ok(copiedDeckActions.includes(`const {error}=await supabase.from("cards").update`));
 assert.ok(copiedDeckActions.includes(`const {error:copyUpdateError}=await supabase.from("deck_copies").update`));
 assert.ok(copiedDeckActions.includes(`const {error:historyError}=await supabase.from("deck_copy_update_history").insert`));
});

test("collection favorite link mutations surface database failures",()=>{
 assert.ok(collectionActions.includes(`const {error}=await supabase.from("collection_cards").delete`));
 assert.ok(collectionActions.includes(`const {error}=await supabase.from("collection_cards").insert`));
});
