import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";

const schema=readFileSync(new URL("../supabase/schema.sql",import.meta.url),"utf8");
const syncRoute=readFileSync(new URL("../src/app/api/sync/route.ts",import.meta.url),"utf8");
const workspacePage=readFileSync(new URL("../src/app/settings/workspace/page.tsx",import.meta.url),"utf8");
const creatorPage=readFileSync(new URL("../src/app/u/[username]/page.tsx",import.meta.url),"utf8");

test("profiles expose private fields only to the owner and use a public projection for shared identity",()=>{
 assert.match(schema,/create policy profiles_self_select on public\.profiles for select to authenticated using\(id=\(select auth\.uid\(\)\)\);/);
 assert.doesNotMatch(schema,/create policy profiles_public_select on public\.profiles for select to authenticated using\(true\);/);
 assert.ok(schema.includes("create table if not exists public.public_profiles"));
 assert.match(schema,/public_profiles\s+\([\s\S]*?username text unique[\s\S]*?show_followers boolean/);
 assert.match(workspacePage,/from\("public_profiles"\)/);
 assert.match(creatorPage,/from\("public_profiles"\)/);
 assert.ok(schema.includes("create or replace function private.sync_public_profile() returns trigger"));\n assert.ok(schema.includes("security definer\nset search_path=public,private"));
 assert.ok(schema.includes("create trigger sync_public_profile"));
 assert.ok(schema.includes("execute function private.sync_public_profile()"));
 assert.doesNotMatch(schema,/create policy public_profiles_public_(insert|update|delete)/);
});

test("workspace owner role cannot be reassigned through member updates",()=>{
 assert.match(schema,/create or replace function private\.prevent_workspace_owner_role_change\(\)/);
 assert.match(schema,/new\.role='owner'::workspace_role/);
 assert.match(schema,/old\.role='owner'::workspace_role/);
 assert.match(schema,/create trigger workspace_owner_role_immutable/);
 assert.match(schema,/before insert or update or delete on public\.workspace_members/);
 assert.match(schema,/workspace membership identity cannot be changed/);
 assert.match(schema,/only the workspace owner may remove an admin/);
 assert.match(schema,/only the workspace owner may assign admin role/);
 assert.match(schema,/and exists\(select 1 from public\.workspaces w where w\.id=workspace_id and w\.owner_id<>\(select auth\.uid\(\)\)\)/);
});

test("offline bootstrap uses paginated range queries instead of fixed row caps",()=>{
 assert.match(syncRoute,/async function fetchAll<T>/);
 assert.match(syncRoute,/\.range\(from,to\)/);
 const bootstrap=syncRoute.split('if(request.nextUrl.searchParams.get("bootstrap")==="1")')[1]?.split('const {data,error}=await supabase.from("sync_changes")')[0]||"";
 assert.doesNotMatch(bootstrap,/\.limit\((?:500|5000|20000)\)/);
});


test("all SECURITY DEFINER functions pin search_path and deny public/anonymous execution",()=>{
 const privilegedFunctions=[
  "public.is_platform_moderator",
  "public.create_notification",
  "private.is_workspace_member",
  "private.is_workspace_owner",
  "private.record_sync_change",
  "private.prevent_workspace_owner_role_change"
 ];
 for(const name of privilegedFunctions){
  const startIndex=schema.indexOf("create or replace function "+name);
  assert.ok(startIndex>=0,name+" definition must exist");
  const endIndex=schema.indexOf("$shyraq$;",startIndex);
  assert.ok(endIndex>startIndex,name+" body must be terminated");
  const definition=schema.slice(startIndex,endIndex);
  assert.match(definition,/security definer/i);
  assert.match(definition,/set search_path/i);
  assert.ok(schema.includes("revoke all on function "+name),name+" must not be executable by public/anonymous users");
 }
});

test("API routes keep an explicit authentication gate unless intentionally public",()=>{
 const publicRoutes=new Set(["auth/login/route.ts","auth/signup/route.ts","auth/oauth/[provider]/route.ts","health/route.ts","telemetry/client-error/route.ts"]);
 const secretProtectedRoutes=new Set(["cron/backups/route.ts"]);
 const walk=(prefix=""):string[]=>{
  const url=new URL(prefix?`../src/app/api/${prefix}`:"../src/app/api",import.meta.url);
  const out:string[]=[];
  for(const entry of readdirSync(url,{withFileTypes:true})){
   const next=prefix?prefix+"/"+entry.name:entry.name;
   if(entry.isDirectory())out.push(...walk(next));
   else if(entry.isFile()&&entry.name==="route.ts")out.push(next);
  }
  return out;
 };
 for(const route of walk()){
  if(publicRoutes.has(route)||secretProtectedRoutes.has(route))continue;
  const source=readFileSync(new URL("../src/app/api/"+route,import.meta.url),"utf8");
  assert.match(source,/auth\.getUser\(\)|getCurrentUser\(\)/,route+" must authenticate the caller");
 }
 const cron=readFileSync(new URL("../src/app/api/cron/backups/route.ts",import.meta.url),"utf8");
 assert.match(cron,/authorization/i);
});


test("review history export paginates instead of using a fixed row cap",()=>{
 const source=readFileSync(new URL("../src/app/api/export/history/route.ts",import.meta.url),"utf8");
 assert.match(source,/range\(from,from\+999\)/);
 assert.doesNotMatch(source,/\.limit\(10000\)/);
 assert.match(source,/order\("id",\{ascending:true\}\)/);
});


test("legal policy pages remain publicly reachable",()=>{
 const source=readFileSync(new URL("../src/proxy.ts",import.meta.url),"utf8");
 assert.match(source,/["']\/legal["']/);
});
