import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const editPage=readFileSync(new URL("../src/app/decks/[id]/cards/[cardId]/edit/page.tsx",import.meta.url),"utf8");
const editor=readFileSync(new URL("../src/components/card-editor.tsx",import.meta.url),"utf8");
const cardActions=readFileSync(new URL("../src/app/decks/[id]/cards/actions.ts",import.meta.url),"utf8");

test("edit page restores card metadata into CardEditor",()=>{
 assert.match(editPage,/markers:Array.isArray(card.content?.markers)?card.content.markers:[]/);
 assert.match(editPage,/status:typeof card.content?.status==="string"?card.content.status:""/);
 assert.match(editPage,/fields:card.content?.fields&&typeof card.content.fields==="object"/);
 assert.match(editPage,/reviewPreferences:card.content?.reviewPreferences&&typeof card.content.reviewPreferences==="object"/);
});

test("CardEditor exposes persistent marker and status fields",()=>{
 assert.match(editor,/name="markers"/);
 assert.match(editor,/name="status"/);
 assert.match(cardActions,/const markers=String(formData.get("markers")/);
 assert.match(cardActions,/const status=String(formData.get("status")/);
});
