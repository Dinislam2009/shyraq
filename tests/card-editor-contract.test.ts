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
 assert.match(store,/offlineStore\.cardTemplates\.count\(\),offlineStore\.tags\.count\(\),offlineStore\.collections\.count\(\),offlineStore\.collectionCards\.count\(\),offlineStore\.mutations\.count\(\)/);
});


test("offline bootstrap keeps templates in the local mirror",()=>{
 const sync=readFileSync(new URL("../src/lib/sync/client.ts",import.meta.url),"utf8");
 assert.ok(sync.includes("templates?:Record<string,unknown>[]"));
 assert.ok(sync.includes("(data.templates??[]).map(item=>mapTemplate(item,userId))"));
 assert.ok(sync.includes("data.collectionCards??[]"));
 assert.ok(sync.includes("return {userId,decks:data.decks??[],cards:data.cards??[],templates:data.templates??[],tags:data.tags??[],collections:data.collections??[],collectionCards:data.collectionCards??[]}"));
});


test("workspace sync fans out tags and collections",()=>{
 const schema=readFileSync(new URL("../supabase/schema.sql",import.meta.url),"utf8");
 const route=readFileSync(new URL("../src/app/api/sync/route.ts",import.meta.url),"utf8");
 assert.match(schema,/tg_table_name in \('decks','cards','card_templates','tags','collections','collection_cards'\)/);
 assert.match(route,/entityType==="tags"/);
 assert.match(route,/entityType==="collections"/);
 assert.match(route,/tags:tags\?\?\[\]/);
 assert.match(route,/collections:collections\?\?\[\]/);
});


test("card toggles use optimistic action feedback",()=>{
 const manager=readFileSync(new URL("../src/components/card-manager.tsx",import.meta.url),"utf8");
 const toggle=readFileSync(new URL("../src/components/optimistic-toggle-form.tsx",import.meta.url),"utf8");
 assert.match(manager,/OptimisticToggleForm/);
 assert.match(toggle,/useFormStatus/);
 assert.match(toggle,/onSubmit=\{\(\)=>setActive/);
});

test("collection-card relations are mirrored with a stable composite key",()=>{
 const store=readFileSync(new URL("../src/lib/offline/store.ts",import.meta.url),"utf8");
 const sync=readFileSync(new URL("../src/lib/sync/client.ts",import.meta.url),"utf8");
 assert.match(store,/collectionCards!:Table<OfflineCollectionCard,string>/);
 assert.match(store,/collectionCards:"id,collectionId,cardId,createdAt"/);
 assert.match(sync,/function mapCollectionCard/);
 assert.match(sync,/collectionId\+":\"\+cardId/);
});


test("large image uploads use client-side compression",()=>{
 const editor=readFileSync(new URL("../src/components/card-editor.tsx",import.meta.url),"utf8");
 const input=readFileSync(new URL("../src/components/compressed-image-input.tsx",import.meta.url),"utf8");
 assert.match(editor,/CompressedImageInput/);
 assert.match(input,/image\/webp/);
 assert.match(input,/1024\*1024/);
 assert.match(input,/DataTransfer/);
});


test("offline service worker is registered and avoids protected-route precache",()=>{
 const sw=readFileSync(new URL("../public/sw.js",import.meta.url),"utf8");
 const layout=readFileSync(new URL("../src/app/layout.tsx",import.meta.url),"utf8");
 const reg=readFileSync(new URL("../src/components/service-worker-registration.tsx",import.meta.url),"utf8");
 assert.match(sw,/const APP_SHELL=\["\/offline","\/favicon\.ico"\]/);
 assert.match(sw,/request\.mode==="navigate"/);
 assert.ok(layout.includes("<ServiceWorkerRegistration/>"));
 assert.match(reg,/serviceWorker\.register\("\/sw\.js"/);
});


test("offline cold-start mirrors review state and preferences",()=>{
 const store=readFileSync(new URL("../src/lib/offline/store.ts",import.meta.url),"utf8");
 const sync=readFileSync(new URL("../src/lib/sync/client.ts",import.meta.url),"utf8");
 const route=readFileSync(new URL("../src/app/api/sync/route.ts",import.meta.url),"utf8");
 const bootstrap=readFileSync(new URL("../src/components/review-bootstrap.tsx",import.meta.url),"utf8");
 const reviewPage=readFileSync(new URL("../src/app/review/page.tsx",import.meta.url),"utf8");
 assert.match(store,/reviewStates!:Table<OfflineReviewState,string>/);
 assert.match(store,/this\.version\(6\)\.stores/);
 assert.match(store,/getOfflineReviewQueue/);
 assert.match(sync,/function mapReviewState/);
 assert.match(sync,/data\.reviewStates/);
 assert.match(sync,/cacheReviewPreferences/);
 assert.match(route,/from\("review_states"\)/);
 assert.match(route,/from\("review_preferences"\)/);
 assert.match(route,/reviewStates:reviewStates\?\?\[\]/);
 assert.match(bootstrap,/getOfflineReviewQueue/);
 assert.match(bootstrap,/getCachedReviewPreferences/);
 assert.match(reviewPage,/deckId=\{deck\} limit=\{requestedLimit\}/);
});
