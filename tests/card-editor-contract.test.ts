import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const editPage=readFileSync(new URL("../src/app/decks/[id]/cards/[cardId]/edit/page.tsx",import.meta.url),"utf8");
const editor=readFileSync(new URL("../src/components/card-editor.tsx",import.meta.url),"utf8");
const cardActions=readFileSync(new URL("../src/app/decks/[id]/cards/actions.ts",import.meta.url),"utf8");

test("edit page restores card metadata into CardEditor",()=>{
 assert.ok(editPage.includes('markers:Array.isArray(card.content?.markers)?card.content.markers:[]'));
 assert.ok(editPage.includes('status:typeof card.content?.status==="string"?card.content.status:""'));
 assert.ok(editPage.includes('fields:card.content?.fields&&typeof card.content.fields==="object"'));
 assert.ok(editPage.includes('reviewPreferences:card.content?.reviewPreferences&&typeof card.content.reviewPreferences==="object"'));
});

test("CardEditor exposes persistent marker and status fields",()=>{
 assert.match(editor,/name="markers"/);
 assert.match(editor,/name="status"/);
 assert.ok(cardActions.includes('const markers=String(formData.get("markers")'));
 assert.ok(cardActions.includes('const status=String(formData.get("status")'));
});


test("offline mirror includes card templates",()=>{
 const store=readFileSync(new URL("../src/lib/offline/store.ts",import.meta.url),"utf8");
 const sync=readFileSync(new URL("../src/lib/sync/client.ts",import.meta.url),"utf8");
 assert.match(store,/cardTemplates!:Table<OfflineCardTemplate,string>/);
 assert.match(store,/tags!:Table<OfflineTag,string>/);
 assert.match(store,/collections!:Table<OfflineCollection,string>/);
 assert.match(store,/this\.version\(4\)\.stores/);
 assert.match(sync,/function mapTemplate/);
 assert.match(sync,/offlineStore\.cardTemplates\.put/);
 assert.match(sync,/function mapTag/);
 assert.match(sync,/function mapCollection/);
 assert.match(sync,/offlineStore\.tags\.put/);
 assert.match(sync,/offlineStore\.collections\.put/);
});


test("offline storage usage counts templates independently",()=>{
 const store=readFileSync(new URL("../src/lib/offline/store.ts",import.meta.url),"utf8");
 assert.match(store,/offlineStore\.cardTemplates\.count\(\),offlineStore\.tags\.count\(\),offlineStore\.collections\.count\(\),offlineStore\.mutations\.count\(\)/);
});


test("offline bootstrap keeps templates in the local mirror",()=>{
 const sync=readFileSync(new URL("../src/lib/sync/client.ts",import.meta.url),"utf8");
 assert.ok(sync.includes("templates?:Record<string,unknown>[]"));
 assert.ok(sync.includes("(data.templates??[]).map(item=>mapTemplate(item,userId))"));
 assert.ok(sync.includes("return {userId,decks:data.decks??[],cards:data.cards??[],templates:data.templates??[]}"));
});


test("workspace sync fans out tags and collections",()=>{
 const schema=readFileSync(new URL("../supabase/schema.sql",import.meta.url),"utf8");
 const route=readFileSync(new URL("../src/app/api/sync/route.ts",import.meta.url),"utf8");
 assert.match(schema,/tg_table_name in \('decks','cards','card_templates','tags','collections'\)/);
 assert.match(route,/entityType==="tags"/);
 assert.match(route,/entityType==="collections"/);
 assert.match(route,/tags:\(tags\?\?\[\]\)/);
 assert.match(route,/collections:\(collections\?\?\[\]\)/);
});


test("card toggles use optimistic action feedback",()=>{
 const manager=readFileSync(new URL("../src/components/card-manager.tsx",import.meta.url),"utf8");
 const toggle=readFileSync(new URL("../src/components/optimistic-toggle-form.tsx",import.meta.url),"utf8");
 assert.match(manager,/OptimisticToggleForm/);
 assert.match(toggle,/useFormStatus/);
 assert.match(toggle,/onSubmit=\{\(\)=>setActive/);
});
