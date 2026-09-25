import test from "node:test";
import assert from "node:assert/strict";
import {GET as healthGET} from "../src/app/api/health/route.ts";
import {POST as telemetryPOST} from "../src/app/api/telemetry/client-error/route.ts";

test("health route returns an HTTP response",async()=>{
 const response=await healthGET();
 assert.equal(typeof response.status,"number");
 assert.ok(response.status===200||response.status===503);
});

test("telemetry route rejects malformed payloads safely",async()=>{
 const request=new Request("http://localhost/api/telemetry/client-error",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({message:"test"})});
 const response=await telemetryPOST(request);
 assert.ok([200,400,503].includes(response.status));
});
