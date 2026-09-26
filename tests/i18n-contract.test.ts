import test from "node:test";
import {readFileSync} from "node:fs";
import assert from "node:assert/strict";
import {dictionaries,locales,translateKey} from "../src/lib/i18n.ts";
import {extendedTranslations} from "../src/lib/i18n-catalog.ts";

test("all supported locales expose the same translation keys",()=>{
 const english=new Set(Object.keys(dictionaries.en));
 for(const locale of locales){
  const keys=new Set(Object.keys(dictionaries[locale]));
  assert.deepEqual([...keys].sort(),[...english].sort(),locale+" dictionary keys must match English");
 }
});

test("server locale helper supports the persisted locale values",()=>{
 const source=readFileSync(new URL("../src/lib/i18n-server.ts",import.meta.url),"utf8");
 assert.match(source,/value==="kk"\|\|value==="ru"\|\|value==="en"/);
 assert.match(source,/getServerI18n/);
});


test("extended translation catalog is complete for every supported locale",()=>{
 const entries=Object.entries(extendedTranslations);
 assert.ok(entries.length>=100, "extended catalog should cover the production UI bridge");
 for(const [key,value] of entries){
  for(const locale of locales){
   assert.equal(typeof value[locale],"string",key+" missing "+locale);
   assert.notEqual(value[locale].trim(),"",key+" has empty "+locale);
   assert.equal(translateKey(locale,key),value[locale]);
  }
 }
});
