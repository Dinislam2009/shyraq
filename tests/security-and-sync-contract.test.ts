import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const schema=readFileSync(new URL("../supabase/schema.sql",import.meta.url),"utf8");
const syncRoute=readFileSync(new URL("../src/app/api/sync/route.ts",import.meta.url),"utf8");
const workspacePage=readFileSync(new URL("../src/app/settings/workspace/page.tsx",import.meta.url),"utf8");
const creatorPage=readFileSync(new URL("../src/app/u/[username]/page.tsx",import.meta.url),"utf8");

test("profiles expose private fields only to the owner and use a public projection for shared identity",()=>{
 assert.match(schema,/create policy profiles_self_select on public\.profiles for select to authenticated using\(id=\(select auth\.uid\(\)\)\);/);
 assert.doesNotMatch(schema,/create policy profiles_public_select on public\.profiles for select to authenticated using\(true\);/);
 assert.match(schema,/create or replace view public\.public_profiles as[\\s\\S]*select id,username,display_name,bio,avatar_url,created_at,show_activity,show_followers/);
 assert.match(workspacePage,/from\("public_profiles"\)/);
 assert.match(creatorPage,/from\("public_profiles"\)/);
});

test("workspace owner role cannot be reassigned through member updates",()=>{
 assert.match(schema,/create or replace function private\.prevent_workspace_owner_role_change\(\)/);
 assert.match(schema,/new\.role='owner'::workspace_role/);
 assert.match(schema,/old\.role='owner'::workspace_role/);
 assert.match(schema,/create trigger workspace_owner_role_immutable/);
});

test("offline bootstrap uses paginated range queries instead of fixed row caps",()=>{
 assert.match(syncRoute,/async function fetchAll<T>/);
 assert.match(syncRoute,/\.range\(from,to\)/);
 assert.doesNotMatch(syncRoute,/\.limit\((?:500|5000|20000)\)/);
});
