import test from "node:test";
import assert from "node:assert/strict";
import {createClient} from "@supabase/supabase-js";

const url=process.env.SUPABASE_TEST_URL||process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey=process.env.SUPABASE_TEST_ANON_KEY||process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const enabled=Boolean(url&&anonKey&&process.env.RUN_SUPABASE_INTEGRATION==="1");

test("RLS integration smoke: protected tables reject unauthenticated reads",{skip:!enabled},async()=>{
 const supabase=createClient(String(url),String(anonKey),{auth:{persistSession:false,autoRefreshToken:false}});
 const protectedTables=["review_states","review_events","sync_conflicts","import_jobs","backup_schedules","creator_relations"] as const;
 for(const table of protectedTables){
  const {data,error}=await supabase.from(table).select("*").limit(1);
  assert.equal(error,null,table+" should be queryable through PostgREST");
  assert.equal((data??[]).length,0,table+" must not expose authenticated user rows without a session");
 }
});

test("RLS integration smoke: unauthenticated storage listing is empty or denied",{skip:!enabled},async()=>{
 const supabase=createClient(String(url),String(anonKey),{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await supabase.storage.from("user-media").list("",{limit:1});
 assert.ok(error||Array.isArray(data));
 if(!error)assert.equal(data?.length??0,0);
});
