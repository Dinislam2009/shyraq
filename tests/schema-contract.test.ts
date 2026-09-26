import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const schema=readFileSync(new URL("../supabase/schema.sql",import.meta.url),"utf8");
const syncRoute=readFileSync(new URL("../src/app/api/sync/route.ts",import.meta.url),"utf8");
const notificationHelper=readFileSync(new URL("../src/lib/supabase/notifications.ts",import.meta.url),"utf8");
const collaborationActions=readFileSync(new URL("../src/app/decks/[id]/collaboration/actions.ts",import.meta.url),"utf8");

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
  "saved_searches","saved_filters","notifications","review_devices",
  "backup_versions","moderation_actions","deck_copy_update_history","error_logs"
 ]) tableBlock(table);
});

test("schema contains columns required by current deck and collection flows",()=>{
 for(const column of ["sort_order","deleted_at"]) assert.match(tableBlock("decks"),new RegExp("\\b"+column+"\\b"));
 assert.match(schema,/alter table public\.collections add column if not exists description/);
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
 assert.match(schema,/create or replace function public\.create_notification/);
 assert.doesNotMatch(schema,/drop policy if not exists/i);
});

test("Realtime and cross-table foreign keys are idempotent",()=>{
 assert.match(schema,/pg_publication_tables/);
 assert.match(schema,/sync_conflicts_event_key_fkey/);
 assert.match(schema,/pg_constraint/);
});


test("schema dollar-quote blocks are syntactically paired",()=>{
 assert.doesNotMatch(schema,/^\s*do \$\s*$/m);
 assert.match(schema,/do \$shyraq\$[\s\S]*?end \$shyraq\$;/);
 assert.match(schema,/as \$shyraq\$[\s\S]*?end;\s*\$shyraq\$;/);
});

test("server notification writes use the RLS-safe RPC",()=>{
 assert.match(syncRoute,/rpc\("create_notification"/);
 assert.doesNotMatch(syncRoute,/from\("notifications"\)\.insert/);
 assert.match(notificationHelper,/rpc\("create_notification"/);
});

test("collaboration member/comment policies enforce resource workspace relationships",()=>{
 assert.match(schema,/d\.id=deck_members\.deck_id[\s\S]*d\.workspace_id=deck_members\.workspace_id/);
 assert.match(schema,/c\.id=collection_members\.collection_id[\s\S]*c\.workspace_id=collection_members\.workspace_id/);
 assert.match(schema,/d\.id=comments\.deck_id[\s\S]*d\.workspace_id=comments\.workspace_id/);
});


test("backup restore stays inside current schema enums and collection metadata",()=>{
 const restore=readFileSync(new URL("../src/app/import/actions.ts",import.meta.url),"utf8");
 assert.match(restore,/\["private","workspace","public"\]/);
 assert.doesNotMatch(restore,/\["private","public","unlisted"\]/);
 assert.match(restore,/value==="favorites"\|\|value==="smart"\?value:"custom"/);
 assert.ok(restore.includes('description:String(collection.description||"").slice(0,5000)'));
 assert.match(restore,/rule:collection\.rule/);
 assert.match(restore,/sort_mode:String\(collection\.sort_mode/);
});


test("public collections and their links have public read RLS",()=>{
 assert.match(schema,/create policy collections_read[\s\S]*using\(is_public or private\.is_workspace_member/);
 assert.match(schema,/create policy collection_cards_select[\s\S]*c\.is_public or private\.is_workspace_member/);
 assert.match(schema,/create policy collection_cards_write[\s\S]*private\.is_workspace_member\(c\.workspace_id,'editor'\)/);
});

test("comment mention notifications surface RPC failures",()=>{
 assert.match(collaborationActions,/const \{error:notificationError\}=await supabase\.rpc\("create_notification"/);
 assert.match(collaborationActions,/if\(notificationError\)[\s\S]*Mention notification failed/);
});


test("secondary feature tables have owner-scoped RLS contracts",()=>{
 assert.match(schema,/alter table public\.backup_versions enable row level security/);
 assert.match(schema,/create policy backup_versions_self[\s\S]*user_id=\(select auth\.uid\(\)\)/);
 assert.match(schema,/alter table public\.deck_copy_update_history enable row level security/);
 assert.match(schema,/create policy deck_copy_update_history_self[\s\S]*user_id=\(select auth\.uid\(\)\)/);
 assert.match(schema,/alter table public\.moderation_actions enable row level security/);
 assert.match(schema,/create policy moderation_actions_insert[\s\S]*moderator_id=\(select auth\.uid\(\)\)/);
});


test("telemetry error logs accept only the signed-in user",()=>{
 assert.match(schema,/alter table public\.error_logs enable row level security/);
 assert.match(schema,/create policy error_logs_insert[\s\S]*user_id=\(select auth\.uid\(\)\)/);
});


test("backup restore tracks newly created resources for rollback",()=>{
 const restore=readFileSync(new URL("../src/app/import/actions.ts",import.meta.url),"utf8");
 assert.match(restore,/const createdDeckIds:string\[\]=\[\]/);
 assert.match(restore,/const createdCollectionIds:string\[\]=\[\]/);
 assert.match(restore,/const uploadedMediaPaths:string\[\]=\[\]/);
 assert.match(restore,/createdDeckIds\.push\(deckId\)/);
 assert.match(restore,/createdCollectionIds\.push\(data\.id\)/);
 assert.match(restore,/uploadedMediaPaths\.push\(newPath\)/);
 assert.match(restore,/cleanupRestore\(supabase,createdDeckIds,createdCollectionIds,uploadedMediaPaths\)/);
});


test("backup restore preserves extended review preferences",()=>{
 const restore=readFileSync(new URL("../src/app/import/actions.ts",import.meta.url),"utf8");
 assert.ok(restore.includes("rating_styles:preferences.rating_styles"));
 assert.ok(restore.includes("accessibility:preferences.accessibility"));
 assert.ok(restore.includes("session_defaults:preferences.session_defaults"));
 assert.ok(restore.includes("scheduler_profiles:Array.isArray(preferences.scheduler_profiles)?preferences.scheduler_profiles:[]"));
});


test("shared offline sync fans out deck/card/template changes to workspace members",()=>{
 assert.match(schema,/workspace_id_value uuid/);
 assert.match(schema,/tg_table_name in \('decks','cards','card_templates','tags','collections','collection_cards'\)/);
 assert.match(schema,/from public\.workspace_members wm/);
 assert.match(schema,/wm\.workspace_id=workspace_id_value/);
 const syncRoute=readFileSync(new URL("../src/app/api/sync/route.ts",import.meta.url),"utf8");
 assert.doesNotMatch(syncRoute,/from\("cards"\)\.select\([^\n]*\)\.eq\("owner_id",user\.id\)/);
 assert.match(syncRoute,/const deckIds=decks\.map\(deck=>deck\.id\)/);
 assert.match(syncRoute,/from\("card_templates"\)/);
});


test("offline mutation API enforces workspace/deck editor permissions for shared resources",()=>{
 const syncRoute=readFileSync(new URL("../src/app/api/sync/route.ts",import.meta.url),"utf8");
 assert.match(syncRoute,/async function canEditWorkspace/);
 assert.match(syncRoute,/\["owner","admin","editor"\]/);
 assert.match(syncRoute,/if\(!workspaceId\|\|!\(await canEditWorkspace/);
 assert.match(syncRoute,/if\(!cardDeck\|\|!\(await canEditDeck\(supabase,user\.id,String\(cardDeck\.id\)\)\)/);
 assert.match(syncRoute,/if\(!templateDeck\|\|!\(await canEditDeck\(supabase,user\.id,String\(templateDeck\.id\)\)\)/);
 assert.match(syncRoute,/if\(existingCard\)row\.owner_id=existingCard\.owner_id/);
});


test("creator mute and block relations have secure storage and feed filtering",()=>{
 assert.match(schema,/create table if not exists public\.creator_relations/);
 assert.match(schema,/relation text not null check\(relation in \('mute','block'\)\)/);
 assert.match(schema,/alter table public\.creator_relations enable row level security/);
 assert.match(schema,/create policy creator_relations_self_select[\s\S]*user_id=\(select auth\.uid\(\)\)/);
 assert.match(schema,/create policy creator_relations_self_update[\s\S]*user_id=\(select auth\.uid\(\)\)/);
 const explore=readFileSync(new URL("../src/app/explore/page.tsx",import.meta.url),"utf8");
 const following=readFileSync(new URL("../src/app/explore/following/page.tsx",import.meta.url),"utf8");
 assert.match(explore,/from\("creator_relations"\)/);
 assert.match(explore,/hiddenCreators/);
 assert.match(explore,/!hiddenCreators\.has\(String\(deck\.owner_id\)\)/);
 assert.match(following,/from\("creator_relations"\)/);
 assert.match(following,/visibleFollows/);
});


test("featured collection curation is exposed to platform moderators",()=>{
 const collectionActions=readFileSync(new URL("../src/app/collections/actions.ts",import.meta.url),"utf8");
 const platformPage=readFileSync(new URL("../src/app/settings/moderation/platform/page.tsx",import.meta.url),"utf8");
 assert.match(collectionActions,/toggleFeaturedCollection/);
 assert.match(collectionActions,/is_platform_moderator/);
 assert.match(platformPage,/featuredCollections/);
 assert.match(platformPage,/toggleFeaturedCollection\.bind/);
 assert.match(platformPage,/Featured public collections/);
});


test("resumable import jobs have owner-scoped persistence and progress endpoints",()=>{
 assert.match(schema,/create table if not exists public\.import_jobs/);
 assert.match(schema,/status text not null default 'queued'/);
 assert.match(schema,/processed_rows integer not null default 0/);
 assert.match(schema,/create policy import_jobs_self[\s\S]*user_id=\(select auth\.uid\(\)\)/);
 const start=readFileSync(new URL("../src/app/api/import/jobs/route.ts",import.meta.url),"utf8");
 const progress=readFileSync(new URL("../src/app/api/import/jobs/[id]/route.ts",import.meta.url),"utf8");
 const ui=readFileSync(new URL("../src/components/import-preview.tsx",import.meta.url),"utf8");
 const panel=readFileSync(new URL("../src/components/import-job-progress.tsx",import.meta.url),"utf8");
 assert.match(start,/storage\.from\("user-media"\)\.upload/);
 assert.match(start,/insert\(\{id:jobId/);
 assert.match(progress,/CHUNK_SIZE=500/);
 assert.match(progress,/processed_rows:processed/);
 assert.match(ui,/\/api\/import\/jobs/);
 assert.match(ui,/shyraq:import-job/);
 assert.match(panel,/Resume import/);
});


test("initial locale is rendered server-side from the locale cookie",()=>{
 const layout=readFileSync(new URL("../src/app/layout.tsx",import.meta.url),"utf8");
 const provider=readFileSync(new URL("../src/components/i18n-provider.tsx",import.meta.url),"utf8");
 assert.match(layout,/cookies\(\)/);
 assert.match(layout,/shyraq-locale/);
 assert.match(layout,/I18nProvider initialLocale=\{initialLocale\}/);
 assert.match(provider,/initialLocale="en"/);
});
