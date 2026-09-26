import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const rich=readFileSync(new URL("../src/components/rich-content.tsx",import.meta.url),"utf8");
const anki=readFileSync(new URL("../src/components/anki-template-content.tsx",import.meta.url),"utf8");

test("rich content escapes raw HTML before rendering user-authored markup",()=>{
 assert.match(rich,/function escapeHtml\(value: string\)/);
 assert.match(rich,/let html = escapeHtml\(text\)/);
 assert.match(rich,/dangerouslySetInnerHTML=\{\{ __html: renderRichHtml\(content/);
 assert.match(rich,/escapeHtml\(codeLines\.join\("\\n"\)\)/);
});

test("Anki template HTML sanitization strips script/event and javascript URL vectors",()=>{
 assert.match(anki,/function sanitizeHtml/);
 assert.match(anki,/<script\\b/);
 assert.match(anki,/on\\w+\\s*=\\s*/);
 assert.match(anki,/javascript\\s*:/i);
 assert.match(anki,/vbscript\\s*:/i);
});

test("Anki template CSS sanitization blocks import, javascript and expression vectors",()=>{
 assert.match(anki,/function sanitizeCss/);
 assert.match(anki,/@import/);
 assert.match(anki,/url\\s*\\(/i);
 assert.match(anki,/expression\\s*\\(/i);
});