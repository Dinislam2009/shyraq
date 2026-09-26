import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const parser=readFileSync(new URL("../src/lib/import/anki.ts",import.meta.url),"utf8");
const importer=readFileSync(new URL("../src/app/import/anki/actions.ts",import.meta.url),"utf8");

test("Anki parser preserves every template ordinal",()=>{
 assert.match(parser,/const sourceTemplates=Array.isArray(model?.tmpls)&&model.tmpls.length?model.tmpls:\[\{\}\]/);
 assert.match(parser,/const ord=Number.isFinite(Number(sourceTemplate?.ord))?Number(sourceTemplate.ord):index/);
 assert.match(parser,/sourceModelId:modelId,ord/);
 assert.match(parser,/templateMeta.set(String(id)+":"+String(ord),template)/);
});

test("Anki cards resolve their template by model and ordinal",()=>{
 assert.match(parser,/templateMeta.get(String(note.mid)\+":"+String(Number(row\[3\])))/);
 assert.match(importer,/template.sourceModelId/);
 assert.match(importer,/templateIdsByKey.set(deck.id\+":"+String(sourceTemplate.sourceModelId)\+":"+String(sourceTemplate.ord),template.id)/);
 assert.match(importer,/templateIdsByKey.get(deck.id\+":"+String(card.modelId)\+":"+String(card.ord))/);
});
