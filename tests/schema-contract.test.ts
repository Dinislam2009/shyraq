import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const schema=readFileSync(new URL("../supabase/schema.sql",import.meta.url),"utf8");

function tableBlock(name:string){
 const match=schema.match(new RegExp("create table if not exists public\\."+name+" \\(([\\s\\S]*?)\\n\\);"));
 assert.ok(match, "missing table: "+name);
 return match[1];
}

test("schema contains application-level tables used by server actions",()=>{
 for(const table of [
  "decks","cards","card_templates","collections","comments","comment_mentions",
  "activity_feed","deck_versions","deck_members","collection_members",
  "workspace_audit_logs","moderators","notification_preferences",
  "saved_searches","saved_filters"
 ]) tableBlock(table);
});

test("schema contains columns required by current deck and collection flows",()=>{
 for(const column of ["sort_order","deleted_at"]) assert.match(tableBlock("decks"),new RegExp("\\b"+column+"\\b"));
 for(const column of ["rule","sort_mode","is_public","is_featured"]) assert.match(tableBlock("collections"),new RegExp("\\b"+column+"\\b"));
 for(const column of ["rating_styles","accessibility","session_defaults","scheduler_profiles"]) assert.match(tableBlock("review_preferences"),new RegExp("\\b"+column+"\\b"));
});

test("schema includes profile/workspace preferences required by settings actions",()=>{
 assert.match(schema,/alter table public\.profiles add column if not exists selected_workspace_id/);
 assert.match(tableBlock("profiles"),/show_activity/);
 assert.match(tableBlock("profiles"),/show_followers/);
 assert.match(schema,/create table if not exists public\.workspace_audit_logs/);
});

test("schema has supported notification events and idempotent policy syntax",()=>{
 assert.match(schema,/comment_mention/);
 assert.doesNotMatch(schema,/drop policy if not exists/i);
});

test("Realtime publication setup is idempotent",()=>{
 assert.match(schema,/pg_publication_tables/);
});
