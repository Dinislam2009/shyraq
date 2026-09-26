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
 assert.match(store,/this\.version\(4\)\.stores/);
 assert.match(sync,/function mapTemplate/);
 assert.match(sync,/offlineStore\.cardTemplates\.put/);
});


test("offline storage usage counts templates independently",()=>{
 const store=readFileSync(new URL("../src/lib/offline/store.ts",import.meta.url),"utf8");
 assert.match(store,/offlineStore\.cardTemplates\.count\(\),offlineStore\.mutations\.count\(\),offlineStore\.mediaCache\.toArray\(\)/);
});


test("offline bootstrap keeps templates in the local mirror",()=>{
 const sync=readFileSync(new URL("../src/lib/sync/client.ts",import.meta.url),"utf8");
 assert.ok(sync.includes("templates?:Record<string,unknown>[]"));
 assert.ok(sync.includes("(data.templates??[]).map(item=>mapTemplate(item,userId))"));
 assert.ok(sync.includes("return {userId,decks:data.decks??[],cards:data.cards??[],templates:data.templates??[]}"));
});
