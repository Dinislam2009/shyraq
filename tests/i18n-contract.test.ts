import test from "node:test";
import assert from "node:assert/strict";
import {dictionaries,locales} from "../src/lib/i18n.ts";

test("all supported locales expose the same translation keys",()=>{
 const english=new Set(Object.keys(dictionaries.en));
 for(const locale of locales){
  const keys=new Set(Object.keys(dictionaries[locale]));
  assert.deepEqual([...keys].sort(),[...english].sort(),locale+" dictionary keys must match English");
 }
});

test("server locale helper supports the persisted locale values",()=>{
 const source=require("node:fs").readFileSync(new URL("../src/lib/i18n-server.ts",import.meta.url),"utf8");
 assert.match(source,/value==="kk"\|\|value==="ru"\|\|value==="en"/);
 assert.match(source,/getServerI18n/);
});
