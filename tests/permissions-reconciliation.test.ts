import test from "node:test";
import assert from "node:assert/strict";
import {canAdminWorkspace,canCommentDeck,canDeleteDeck,canDeleteWorkspaceMember,canEditDeck,canEditWorkspace,resolveDeckRole,workspaceRoleToDeckRole} from "../src/lib/workspace/permissions.ts";
import {diffCopiedCards} from "../src/lib/decks/copy-diff.ts";
import {isStaleVersion} from "../src/lib/concurrency.ts";

test("workspace role permissions remain least-privilege",()=>{
 assert.equal(canAdminWorkspace("owner"),true);
 assert.equal(canAdminWorkspace("editor"),false);
 assert.equal(canEditWorkspace("editor"),true);
 assert.equal(canEditWorkspace("reviewer"),false);
 assert.equal(canDeleteDeck("admin"),true);
 assert.equal(canDeleteDeck("editor"),false);
 assert.equal(canDeleteWorkspaceMember("admin","admin"),false);
 assert.equal(canDeleteWorkspaceMember("admin","editor"),true);
 assert.equal(canDeleteWorkspaceMember("editor","viewer"),false);
});

test("deck overrides resolve above member defaults but not owner/admin authority",()=>{
 assert.equal(workspaceRoleToDeckRole("reviewer"),"commenter");
 assert.equal(resolveDeckRole("reviewer","viewer"),"viewer");
 assert.equal(resolveDeckRole("editor","viewer"),"viewer");
 assert.equal(resolveDeckRole("admin","viewer"),"editor");
 assert.equal(canCommentDeck("commenter"),true);
 assert.equal(canEditDeck("commenter"),false);
});

test("copy diff detects added changed and removed cards",()=>{
 const source=[
  {id:"a",kind:"basic",content:{front:"A",back:"1"},sort_order:1,is_suspended:false,is_marked:false},
  {id:"b",kind:"basic",content:{front:"B",back:"2"},sort_order:2,is_suspended:false,is_marked:false}
 ];
 const target=[
  {id:"local-a",kind:"basic",content:{front:"A",back:"changed",_sourceCardId:"a"},sort_order:1,is_suspended:false,is_marked:false},
  {id:"local-c",kind:"basic",content:{front:"C",back:"3",_sourceCardId:"c"},sort_order:3,is_suspended:false,is_marked:false}
 ];
 assert.deepEqual(diffCopiedCards(source,target),{changed:1,added:1,removed:1});
});

test("concurrency helper detects stale writes only with comparable timestamps",()=>{
 assert.equal(isStaleVersion("2026-09-25T10:00:00Z","2026-09-25T10:01:00Z"),true);
 assert.equal(isStaleVersion("2026-09-25T10:01:00Z","2026-09-25T10:01:00Z"),false);
 assert.equal(isStaleVersion(undefined,"2026-09-25T10:01:00Z"),false);
});
