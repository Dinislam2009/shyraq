import {test} from "node:test";
import assert from "node:assert/strict";
import {checkAuthRateLimit} from "../src/lib/auth-rate-limit.ts";

test("auth credential rate limit blocks the 11th attempt for one IP/email",()=>{
 const ip="test-ip-credential-limit";
 const email="Student@Example.com";
 for(let i=0;i<10;i++){
  const result=checkAuthRateLimit(ip,email);
  assert.equal(result.allowed,true);
  assert.ok(result.retryAfter>0);
 }
 const blocked=checkAuthRateLimit(ip,email.toLowerCase());
 assert.equal(blocked.allowed,false);
 assert.ok(blocked.retryAfter>0);
});

test("auth IP rate limit blocks the 31st attempt across distinct credentials",()=>{
 const ip="test-ip-global-limit";
 for(let i=0;i<30;i++){
  const result=checkAuthRateLimit(ip,`user${i}@example.com`);
  assert.equal(result.allowed,true);
 }
 const blocked=checkAuthRateLimit(ip,"user30@example.com");
 assert.equal(blocked.allowed,false);
 assert.ok(blocked.retryAfter>0);
});
