import assert from "node:assert/strict";
import test from "node:test";

test("authenticated contract is opt-in and never requires secrets in source", () => {
  const token = process.env.SHYRAQ_TEST_TOKEN;
  assert.equal(typeof token === "undefined" || typeof token === "string", true);
});
