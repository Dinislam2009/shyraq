import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const backup=readFileSync(new URL("../src/lib/backup/json.ts",import.meta.url),"utf8");
const actions=readFileSync(new URL("../src/app/export/actions.ts",import.meta.url),"utf8");
const diagnostics=readFileSync(new URL("../src/app/api/sync/diagnostics/route.ts",import.meta.url),"utf8");

test("JSON backup fails instead of silently exporting partial database data",()=>{
 assert.match(backup,/const {data:decks,error:decksError}=await/);
 assert.match(backup,/if(decksError)throw new Error(decksError.message)/);
 assert.match(backup,/const firstError=[tagsResult,collectionsResult,eventsResult,statesResult,prefsResult,mediaResult,copiesResult,followsResult].find(result=>result.error)?.error/);
 assert.match(backup,/if(firstError)throw new Error(firstError.message)/);
 assert.match(backup,/const linkError=cardTagsResult.error||collectionCardsResult.error/);
});

test("backup actions surface storage and database cleanup failures",()=>{
 assert.match(actions,/const {error:cleanupError}=await supabase.storage.from("user-media").remove/);
 assert.match(actions,/const {error:storageError}=await supabase.storage.from("user-media").remove([version.storage_path])/);
 assert.match(actions,/const {error:deleteError}=await supabase.from("backup_versions").delete/);
 assert.match(actions,/const {data:record,error:recordError}=await supabase.from("backup_versions")/);
});

test("sync diagnostics fails on database query errors instead of returning incomplete data",()=>{
 assert.match(diagnostics,/const firstError=[devicesResult,eventsResult,changesResult,conflictsResult].find(result=>result.error)?.error/);
 assert.match(diagnostics,/if(firstError)return NextResponse.json({error:firstError.message},{status:500})/);
});
