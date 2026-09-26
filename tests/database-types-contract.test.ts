import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const schema=readFileSync(new URL("../supabase/schema.sql",import.meta.url),"utf8");
const generated=readFileSync(new URL("../src/types/database.generated.ts",import.meta.url),"utf8");

function schemaTables(){
 return [...schema.matchAll(/create table if not exists public\.([A-Za-z0-9_]+)/g)].map(match=>match[1]);
}

function generatedTables(){
 return [...generated.matchAll(/^\s{6}([A-Za-z0-9_]+):\s*\{\s*Row:/gm)].map(match=>match[1]);
}

test("generated Supabase types include every current application table",()=>{
 const generatedSet=new Set(generatedTables());
 const missing=schemaTables().filter(table=>!generatedSet.has(table));
 assert.deepEqual(missing,[]);
});
