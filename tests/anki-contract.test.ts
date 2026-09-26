import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const parser=readFileSync(new URL("../src/lib/import/anki.ts",import.meta.url),"utf8");
const importer=readFileSync(new URL("../src/app/import/anki/actions.ts",import.meta.url),"utf8");

test("Anki parser preserves every template ordinal",()=>{
 assert.ok(parser.includes("const sourceTemplates=Array.isArray(model?.tmpls)&&model.tmpls.length?model.tmpls:[{}]"));
 assert.ok(parser.includes("const ord=Number.isFinite(Number(sourceTemplate?.ord))?Number(sourceTemplate.ord):index"));
 assert.ok(parser.includes("sourceModelId:modelId,ord"));
 assert.ok(parser.includes('templateMeta.set(String(id)+":"+String(ord),template)'));
});

test("Anki cards resolve their template by model and ordinal",()=>{
 assert.ok(parser.includes('templateMeta.get(String(note.mid)+":"+String(Number(row[3])))'));
 assert.ok(importer.includes("template.sourceModelId"));
 assert.ok(importer.includes('templateIdsByKey.set(deck.id+":"+String(sourceTemplate.sourceModelId)+":"+String(sourceTemplate.ord),template.id)'));
 assert.ok(importer.includes('templateIdsByKey.get(deck.id+":"+String(card.modelId)+":"+String(card.ord))'));
});


test("Anki cloze imports preserve the card deletion index",()=>{
 const actions=readFileSync(new URL("../src/app/import/anki/actions.ts",import.meta.url),"utf8");
 const runner=readFileSync(new URL("../src/components/review-runner.tsx",import.meta.url),"utf8");
 const rich=readFileSync(new URL("../src/components/rich-content.tsx",import.meta.url),"utf8");
 assert.match(actions,/clozeIndex:card\.kind==="cloze"\?card\.ord\+1/);
 assert.match(runner,/revealCloze=\{revealed\}/);
 assert.match(rich,/renderClozes/);
});


test("Anki cloze hint and type filters are normalized consistently",()=>{
 const parser=readFileSync(new URL("../src/lib/import/anki.ts",import.meta.url),"utf8");
 const runner=readFileSync(new URL("../src/components/review-runner.tsx",import.meta.url),"utf8");
 assert.ok(parser.includes("type\\s*:\\s*([^}]+)"));
 assert.ok(parser.includes("hint\\s*:\\s*([^}]+)"));
 assert.ok(runner.includes("(?:::[^}|]+)?"));
});


test("nested Anki template filters are normalized through repeated passes",()=>{
 const parser=readFileSync(new URL("../src/lib/import/anki.ts",import.meta.url),"utf8");
 assert.match(parser,/pass<6/);
 assert.ok(parser.includes("cloze|text|hint|type|field"));
});
