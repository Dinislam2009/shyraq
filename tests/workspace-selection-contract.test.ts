import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const source=readFileSync(new URL("../src/lib/supabase/queries.ts",import.meta.url),"utf8");

test("selected workspace repairs missing personal owner membership and surfaces write failure",()=>{
 assert.match(source,/const \{data:membership,error:membershipReadError\}=await supabase\.from\("workspace_members"\)/);
 assert.match(source,/if\(!membership\|\|membership\.role!=="owner"\)/);
 assert.match(source,/const \{error:membershipWriteError\}=await supabase\.from\("workspace_members"\)\.upsert/);
 assert.match(source,/if\(membershipWriteError\)return null/);
});

test("selected workspace fails closed on workspace/profile database errors",()=>{
 assert.match(source,/const \{data:profile,error:profileError\}=await supabase\.from\("profiles"\)/);
 assert.match(source,/if\(profileError\)return null/);
 assert.match(source,/const personalResult=await supabase\.from\("workspaces"\)/);
 assert.match(source,/if\(personalResult\.error\)return null/);
 assert.match(source,/let personal=personalResult\.data/);
 assert.match(source,/const \{data:created,error:createError\}=await supabase\.from\("workspaces"\)\.upsert/);
 assert.match(source,/if\(createError\|\|!created\)return null/);
});
