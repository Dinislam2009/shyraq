import test from "node:test";
import assert from "node:assert/strict";
import {duplicateKey,parseStandardText,validateImportRows} from "../src/lib/import/standard.ts";

test("CSV parser preserves quoted delimiters",()=>{
 const rows=parseStandardText('front,back,tags\n"Question, one","Answer, one","math,exam"',"cards.csv");
 assert.equal(rows.length,1);
 assert.equal(rows[0].front,"Question, one");
 assert.equal(rows[0].back,"Answer, one");
 assert.deepEqual(rows[0].tags,["math","exam"]);
});
test("JSON multiple choice answer is clamped",()=>{
 const rows=parseStandardText(JSON.stringify({cards:[{front:"2+2",back:"4",kind:"multiple_choice",options:["3","4"],answer:8}]}),"cards.json");
 assert.equal(rows[0].answer,1);
 assert.deepEqual(validateImportRows(rows),[]);
});
test("invalid multiple choice rows report validation issues",()=>{
 const rows=parseStandardText("front,back,kind,options,answer\nQ,A,multiple_choice,OnlyOne,0","cards.csv");
 assert.equal(validateImportRows(rows).length,1);
});
test("duplicate keys are stable",()=>assert.equal(duplicateKey({front:" Hello ",back:"World"}),"hello\u0000world"));
