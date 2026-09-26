import test from "node:test";
import assert from "node:assert/strict";
import {formatDate,formatDateTime,formatNumber} from "../src/lib/i18n-format.ts";

test("locale-aware number formatting is deterministic for supported locales",()=>{
 assert.equal(formatNumber(1234567,"en"),"1,234,567");
 assert.equal(formatNumber(1234567,"de" as never),"1,234,567");
 assert.notEqual(formatNumber(1234567,"kk"),formatNumber(1234567,"en"));
});

test("locale-aware dates and date-times format valid timestamps",()=>{
 const value="2026-01-02T15:04:00.000Z";
 assert.ok(formatDate(value,"en"));
 assert.ok(formatDate(value,"kk"));
 assert.ok(formatDateTime(value,"ru"));
 assert.equal(formatDate("not-a-date","en"),"—");
});
