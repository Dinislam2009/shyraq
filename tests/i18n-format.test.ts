import test from "node:test";
import assert from "node:assert/strict";
import {formatDate,formatDateTime,formatNumber} from "../src/lib/i18n-format.ts";

test("locale-aware number formatting is deterministic for supported locales",()=>{
 assert.equal(formatNumber(1234567,"en"),"1,234,567");
 assert.equal(formatNumber(12.5,"ru"),"12,5");
});

test("locale-aware dates and date-times format valid timestamps",()=>{
 const value="2026-01-02T15:04:00.000Z";
 assert.ok(formatDate(value,"en"));
 assert.ok(formatDate(value,"kk"));
 assert.ok(formatDateTime(value,"ru"));
 assert.equal(formatDate("not-a-date","en"),"—");
});


test("server request locale uses the persisted locale cookie",()=>{
 const server=readFileSync(new URL("../src/lib/i18n-server.ts",import.meta.url),"utf8");
 const provider=readFileSync(new URL("../src/components/i18n-provider.tsx",import.meta.url),"utf8");
 assert.match(server,/shyraq-locale/);
 assert.match(server,/value==="kk"\|\|value==="ru"\|\|value==="en"/);
 assert.match(provider,/formatNumber:/);
 assert.match(provider,/formatDateTime:/);
});
