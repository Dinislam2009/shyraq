import test from "node:test";
import assert from "node:assert/strict";
import {canAdminWorkspace,canChangeWorkspaceMemberRole,canDeleteDeck,canDeleteWorkspaceMember,canEditWorkspace,canManageDeck,canCommentDeck,canEditDeck,canReadDeck,resolveDeckRole} from "../src/lib/workspace/permissions.ts";

test("workspace role capabilities",()=>{
 assert.equal(canEditWorkspace("owner"),true);
 assert.equal(canEditWorkspace("admin"),true);
 assert.equal(canEditWorkspace("editor"),true);
 assert.equal(canEditWorkspace("reviewer"),false);
 assert.equal(canAdminWorkspace("editor"),false);
 assert.equal(canAdminWorkspace("admin"),true);
});

test("member role changes protect owners and peer admins",()=>{
 assert.equal(canChangeWorkspaceMemberRole("owner","admin"),true);
 assert.equal(canChangeWorkspaceMemberRole("admin","admin"),false);
 assert.equal(canChangeWorkspaceMemberRole("admin","owner"),false);
 assert.equal(canChangeWorkspaceMemberRole("admin","editor"),true);
 assert.equal(canDeleteWorkspaceMember("editor","viewer"),false);
});

test("deck permissions separate edit from delete",()=>{
 assert.equal(canManageDeck("editor"),true);
 assert.equal(canManageDeck("reviewer"),false);
 assert.equal(canDeleteDeck("editor"),false);
 assert.equal(canDeleteDeck("owner"),true);
});

test("deck permission overrides take precedence over workspace role",()=>{
 assert.equal(resolveDeckRole("admin","viewer"),"editor");
 assert.equal(resolveDeckRole("editor","viewer"),"viewer");
 assert.equal(resolveDeckRole("reviewer","editor"),"editor");
 assert.equal(resolveDeckRole("viewer",""),"viewer");
 assert.equal(canReadDeck("viewer"),true);
 assert.equal(canCommentDeck("viewer"),false);
 assert.equal(canCommentDeck("commenter"),true);
 assert.equal(canEditDeck("commenter"),false);
 assert.equal(canEditDeck("editor"),true);
});
