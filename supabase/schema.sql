create extension if not exists pgcrypto;
create schema if not exists private;

do $$ begin create type public.workspace_kind as enum ('personal','team'); exception when duplicate_object then null; end $$;
do $$ begin create type public.workspace_role as enum ('owner','admin','editor','reviewer','viewer'); exception when duplicate_object then null; end $$;
do $$ begin create type public.deck_visibility as enum ('private','workspace','public'); exception when duplicate_object then null; end $$;
do $$ begin create type public.card_kind as enum ('basic','reverse','cloze','multiple_choice','image','custom'); exception when duplicate_object then null; end $$;
do $$ begin create type public.review_rating as enum ('again','hard','good','easy'); exception when duplicate_object then null; end $$;
do $$ begin create type public.card_queue as enum ('learning','review','relearning','suspended'); exception when duplicate_object then null; end $$;
do $shyraq$ begin create type public.collection_kind as enum ('favorites','custom'); exception when duplicate_object then null; end $shyraq$;
alter type public.collection_kind add value if not exists 'smart';

create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 username text unique, display_name text, avatar_url text, bio text,
 timezone text not null default 'Asia/Almaty', locale text not null default 'en',
 show_activity boolean not null default true, show_followers boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.workspaces (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
 kind public.workspace_kind not null default 'personal', name text not null, slug text not null, description text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(owner_id,slug)
);
alter table public.profiles add column if not exists show_activity boolean not null default true;
alter table public.profiles add column if not exists show_followers boolean not null default true;
alter table public.profiles add column if not exists selected_workspace_id uuid references public.workspaces(id) on delete set null;

create table if not exists public.workspace_members (
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role public.workspace_role not null default 'viewer', created_at timestamptz not null default now(),
 primary key(workspace_id,user_id)
);
create table if not exists public.decks (
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
 owner_id uuid not null references auth.users(id) on delete cascade, name text not null,
 description text not null default '', visibility public.deck_visibility not null default 'private',
 settings jsonb not null default '{}'::jsonb, sort_order integer not null default 0,
 deleted_at timestamptz, source_deck_id uuid references public.decks(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.decks add column if not exists sort_order integer not null default 0;
alter table public.decks add column if not exists deleted_at timestamptz;

create table if not exists public.card_templates (
 id uuid primary key default gen_random_uuid(), deck_id uuid not null references public.decks(id) on delete cascade,
 name text not null default 'Basic', front_template text not null default '{{front}}',
 back_template text not null default '{{back}}', css text not null default '', field_schema jsonb not null default '[]'::jsonb,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.cards (
 id uuid primary key default gen_random_uuid(), deck_id uuid not null references public.decks(id) on delete cascade,
 template_id uuid references public.card_templates(id) on delete set null, owner_id uuid not null references auth.users(id) on delete cascade,
 kind public.card_kind not null default 'basic', content jsonb not null default '{}'::jsonb, sort_order integer not null default 0,
 is_suspended boolean not null default false, is_marked boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.tags (
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
 name text not null, unique(workspace_id,name)
);
create table if not exists public.card_tags (
 card_id uuid not null references public.cards(id) on delete cascade,
 tag_id uuid not null references public.tags(id) on delete cascade, primary key(card_id,tag_id)
);
create table if not exists public.collections (
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
 owner_id uuid not null references auth.users(id) on delete cascade, name text not null,
 kind public.collection_kind not null default 'custom',
 rule jsonb not null default '{}'::jsonb, sort_mode text not null default 'manual',
 is_public boolean not null default false, is_featured boolean not null default false,
 created_at timestamptz not null default now()
);
alter table public.collections add column if not exists description text not null default '';
alter table public.collections add column if not exists rule jsonb not null default '{}'::jsonb;
alter table public.collections add column if not exists sort_mode text not null default 'manual';
alter table public.collections add column if not exists is_public boolean not null default false;
alter table public.collections add column if not exists is_featured boolean not null default false;

create table if not exists public.collection_cards (
 collection_id uuid not null references public.collections(id) on delete cascade,
 card_id uuid not null references public.cards(id) on delete cascade, created_at timestamptz not null default now(),
 primary key(collection_id,card_id)
);
create table if not exists public.review_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 desired_retention double precision not null default 0.9 check(desired_retention >= 0.7 and desired_retention <= 0.99),
 maximum_interval integer not null default 36500 check(maximum_interval >= 1),
 learning_steps jsonb not null default '["1m","10m"]'::jsonb,
 relearning_steps jsonb not null default '["10m"]'::jsonb,
 new_cards_per_day integer not null default 20 check(new_cards_per_day >= 0),
 reviews_per_day integer not null default 9999 check(reviews_per_day >= 0),
 enable_fuzz boolean not null default true,
 enable_short_term boolean not null default true,
 rating_labels jsonb not null default '{"again":"Again","hard":"Hard","good":"Good","easy":"Easy"}'::jsonb,
 rating_order jsonb not null default '["again","hard","good","easy"]'::jsonb,
 show_keyboard_hints boolean not null default true,
 swipe_enabled boolean not null default true,
 rating_styles jsonb not null default '{}'::jsonb,
 accessibility jsonb not null default '{}'::jsonb,
 session_defaults jsonb not null default '{}'::jsonb,
 scheduler_profiles jsonb not null default '[]'::jsonb,
 updated_at timestamptz not null default now()
);

alter table public.review_preferences add column if not exists rating_styles jsonb not null default '{}'::jsonb;
alter table public.review_preferences add column if not exists accessibility jsonb not null default '{}'::jsonb;
alter table public.review_preferences add column if not exists session_defaults jsonb not null default '{}'::jsonb;
alter table public.review_preferences add column if not exists scheduler_profiles jsonb not null default '[]'::jsonb;

create table if not exists public.review_states (
 user_id uuid not null references auth.users(id) on delete cascade, card_id uuid not null references public.cards(id) on delete cascade,
 queue public.card_queue not null default 'learning', state_data jsonb not null default '{}'::jsonb, due_at timestamptz,
 last_reviewed_at timestamptz, reps integer not null default 0, lapses integer not null default 0,
 stability double precision, difficulty double precision, scheduled_days integer not null default 0,
 updated_at timestamptz not null default now(), primary key(user_id,card_id)
);
create table if not exists public.sync_conflicts (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 card_id uuid not null references public.cards(id) on delete cascade,
 event_key uuid not null unique,
 detected_at timestamptz not null default now(),
 incoming_state jsonb not null default '{}'::jsonb,
 current_state jsonb not null default '{}'::jsonb,
 incoming_reviewed_at timestamptz,
 current_reviewed_at timestamptz,
 resolution text check(resolution in ('keep_remote','apply_incoming')),
 resolved_at timestamptz
);

create table if not exists public.review_events (
 id uuid primary key default gen_random_uuid(), event_key uuid not null unique,
 user_id uuid not null references auth.users(id) on delete cascade, card_id uuid not null references public.cards(id) on delete cascade,
 device_id uuid not null, client_sequence bigint, reviewed_at timestamptz not null, rating public.review_rating not null,
 elapsed_ms integer, previous_state jsonb not null default '{}'::jsonb, next_state jsonb not null default '{}'::jsonb,
 metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), unique(device_id,client_sequence)
);
do $shyraq$
begin
  if not exists (
    select 1 from pg_constraint
    where conname='sync_conflicts_event_key_fkey'
      and conrelid='public.sync_conflicts'::regclass
  ) then
    alter table public.sync_conflicts
      add constraint sync_conflicts_event_key_fkey
      foreign key(event_key) references public.review_events(event_key) on delete cascade;
  end if;
end $shyraq$;

create table if not exists public.media (
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
 owner_id uuid not null references auth.users(id) on delete cascade, storage_path text not null unique,
 mime_type text not null, byte_size bigint, checksum text, created_at timestamptz not null default now()
);
create table if not exists public.sync_cursors (
 user_id uuid primary key references auth.users(id) on delete cascade, last_cursor bigint not null default 0,
 updated_at timestamptz not null default now()
);
create table if not exists public.sync_changes (
 cursor bigint generated always as identity primary key, event_key uuid not null, user_id uuid not null references auth.users(id) on delete cascade,
 entity_type text not null, entity_id uuid not null, operation text not null check(operation in ('upsert','delete')),
 payload jsonb not null default '{}'::jsonb, occurred_at timestamptz not null default now(), unique(user_id,event_key)
);
create table if not exists public.deck_reports (
 id uuid primary key default gen_random_uuid(),
 deck_id uuid not null references public.decks(id) on delete cascade,
 reporter_id uuid not null references auth.users(id) on delete cascade,
 reason text not null,
 details text,
 status text not null default 'open' check(status in ('open','reviewing','resolved','dismissed')),
 created_at timestamptz not null default now(),
 resolved_at timestamptz,
 unique(deck_id,reporter_id)
);

create table if not exists public.public_deck_follows (
 user_id uuid not null references auth.users(id) on delete cascade, deck_id uuid not null references public.decks(id) on delete cascade,
 created_at timestamptz not null default now(), primary key(user_id,deck_id)
);

create table if not exists public.creator_relations (
 user_id uuid not null references auth.users(id) on delete cascade,
 creator_id uuid not null references auth.users(id) on delete cascade,
 relation text not null check(relation in ('mute','block')),
 created_at timestamptz not null default now(),
 primary key(user_id,creator_id,relation),
 check(user_id<>creator_id)
);
create index if not exists creator_relations_user_idx on public.creator_relations(user_id,relation,created_at desc);
create index if not exists creator_relations_creator_idx on public.creator_relations(creator_id,relation,created_at desc);
create table if not exists public.deck_copies (
 user_id uuid not null references auth.users(id) on delete cascade,
 source_deck_id uuid not null references public.decks(id) on delete cascade,
 copied_deck_id uuid not null references public.decks(id) on delete cascade,
 source_updated_at timestamptz,
 last_synced_source_updated_at timestamptz,
 update_policy text not null default 'ask' check(update_policy in ('ask','accept_all')),
 created_at timestamptz not null default now(),
 primary key(user_id,source_deck_id,copied_deck_id)
);

create table if not exists public.notifications (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check(kind in ('sync_conflict','deck_update','workspace_invite','collaboration','moderation','backup','system')),
 title text not null,
 body text not null default '',
 href text,
 read_at timestamptz,
 created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications(user_id,read_at,created_at desc);

create table if not exists public.review_devices (
 id uuid primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 name text not null default 'Device',
 last_seen_at timestamptz not null default now(),
 created_at timestamptz not null default now(),
 unique(user_id,id)
);
create index if not exists review_devices_user_idx on public.review_devices(user_id,last_seen_at desc);

create table if not exists public.workspace_invitations (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 invited_by uuid not null references auth.users(id) on delete cascade,
 email text,
 role public.workspace_role not null default 'reviewer',
 token_hash text not null unique,
 expires_at timestamptz not null,
 accepted_at timestamptz,
 created_at timestamptz not null default now()
);

create index if not exists profiles_username_idx on public.profiles(username);
create index if not exists review_preferences_updated_idx on public.review_preferences(updated_at);
create index if not exists decks_workspace_idx on public.decks(workspace_id);
create index if not exists decks_owner_id_idx on public.decks(owner_id);
create index if not exists decks_source_deck_id_idx on public.decks(source_deck_id);
create index if not exists cards_deck_idx on public.cards(deck_id,sort_order);
create index if not exists cards_owner_id_idx on public.cards(owner_id);
create index if not exists cards_template_id_idx on public.cards(template_id);
create index if not exists card_templates_deck_id_idx on public.card_templates(deck_id);
create index if not exists card_tags_tag_id_idx on public.card_tags(tag_id);
create index if not exists collection_cards_card_id_idx on public.collection_cards(card_id);
create index if not exists collections_owner_id_idx on public.collections(owner_id);
create index if not exists collections_workspace_id_idx on public.collections(workspace_id);
create index if not exists deck_copies_source_deck_id_idx on public.deck_copies(source_deck_id);
create index if not exists deck_copies_copied_deck_id_idx on public.deck_copies(copied_deck_id);

create table if not exists public.deck_copy_update_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_deck_id uuid not null references public.decks(id) on delete cascade,
  copied_deck_id uuid not null references public.decks(id) on delete cascade,
  source_updated_at timestamptz not null,
  accepted_at timestamptz not null default now(),
  card_changes jsonb not null default '{}'::jsonb
);
create index if not exists deck_copy_update_history_user_idx on public.deck_copy_update_history(user_id,accepted_at desc);
create index if not exists deck_copy_update_history_copy_idx on public.deck_copy_update_history(copied_deck_id,accepted_at desc);

create index if not exists media_owner_id_idx on public.media(owner_id);

create table if not exists public.error_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  source text not null default 'client',
  level text not null default 'error' check(level in ('error','warn','fatal')),
  message text not null,
  digest text,
  route text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists error_logs_user_idx on public.error_logs(user_id,created_at desc);
create index if not exists error_logs_created_idx on public.error_logs(created_at desc);

create table if not exists public.import_jobs (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 deck_id uuid references public.decks(id) on delete set null,
 storage_path text not null,
 source_name text not null,
 format text not null default 'standard',
 duplicate_mode text not null default 'skip' check(duplicate_mode in ('create','skip','replace')),
 total_rows integer not null default 0,
 processed_rows integer not null default 0,
 created_rows integer not null default 0,
 replaced_rows integer not null default 0,
 skipped_rows integer not null default 0,
 status text not null default 'queued' check(status in ('queued','processing','completed','failed','cancelled')),
 error text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 completed_at timestamptz
);
create index if not exists import_jobs_user_idx on public.import_jobs(user_id,created_at desc);
create index if not exists import_jobs_workspace_idx on public.import_jobs(workspace_id);
create index if not exists import_jobs_deck_idx on public.import_jobs(deck_id);
create table if not exists public.backup_schedules (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 frequency text not null default 'weekly' check(frequency in ('daily','weekly','monthly')),
 enabled boolean not null default false,
 next_run_at timestamptz,
 last_run_at timestamptz,
 last_error text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(user_id)
);
create index if not exists backup_schedules_due_idx on public.backup_schedules(enabled,next_run_at);
create table if not exists public.backup_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  format text not null default 'json' check(format in ('json')),
  storage_path text not null unique,
  size_bytes bigint not null default 0 check(size_bytes >= 0),
  checksum text not null,
  created_at timestamptz not null default now()
);
create index if not exists backup_versions_user_idx on public.backup_versions(user_id,created_at desc);

create index if not exists media_workspace_id_idx on public.media(workspace_id);
create index if not exists public_deck_follows_deck_id_idx on public.public_deck_follows(deck_id);
create index if not exists deck_reports_deck_idx on public.deck_reports(deck_id,status,created_at desc);
create index if not exists deck_reports_reporter_idx on public.deck_reports(reporter_id);

create table if not exists public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.deck_reports(id) on delete cascade,
  moderator_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  note text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists moderation_actions_report_idx on public.moderation_actions(report_id,created_at desc);
create index if not exists moderation_actions_moderator_idx on public.moderation_actions(moderator_id,created_at desc);

create index if not exists sync_conflicts_card_idx on public.sync_conflicts(card_id);
create index if not exists review_states_due_idx on public.review_states(user_id,due_at);
create index if not exists review_states_card_id_idx on public.review_states(card_id);
create index if not exists review_events_user_idx on public.review_events(user_id,reviewed_at desc);
create index if not exists sync_conflicts_user_idx on public.sync_conflicts(user_id,resolved_at,detected_at desc);
create index if not exists review_events_card_id_idx on public.review_events(card_id);
create index if not exists sync_changes_user_cursor_idx on public.sync_changes(user_id,cursor);
create index if not exists workspace_invitations_invited_by_idx on public.workspace_invitations(invited_by);
create index if not exists workspace_members_user_id_idx on public.workspace_members(user_id);
create index if not exists public_decks_idx on public.decks(visibility,updated_at desc);
create index if not exists workspace_invitations_workspace_idx on public.workspace_invitations(workspace_id,expires_at);

-- Application features added after the initial schema.
create table if not exists public.deck_members (
 id uuid primary key default gen_random_uuid(),
 deck_id uuid not null references public.decks(id) on delete cascade,
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null check(role in ('editor','commenter','viewer')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(deck_id,user_id)
);
create index if not exists deck_members_deck_idx on public.deck_members(deck_id);
create index if not exists deck_members_user_idx on public.deck_members(user_id);

create table if not exists public.collection_members (
 id uuid primary key default gen_random_uuid(),
 collection_id uuid not null references public.collections(id) on delete cascade,
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null check(role in ('editor','commenter','viewer')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(collection_id,user_id)
);
create index if not exists collection_members_collection_idx on public.collection_members(collection_id);
create index if not exists collection_members_user_idx on public.collection_members(user_id);

create table if not exists public.comments (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 deck_id uuid not null references public.decks(id) on delete cascade,
 card_id uuid references public.cards(id) on delete cascade,
 author_id uuid not null references auth.users(id) on delete cascade,
 parent_id uuid references public.comments(id) on delete cascade,
 body text not null,
 resolved boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists comments_deck_idx on public.comments(deck_id,created_at);
create index if not exists comments_card_idx on public.comments(card_id,created_at);

create table if not exists public.comment_mentions (
 comment_id uuid not null references public.comments(id) on delete cascade,
 mentioned_user_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(comment_id,mentioned_user_id)
);

create table if not exists public.activity_feed (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 actor_id uuid not null references auth.users(id) on delete cascade,
 event_type text not null,
 entity_type text not null,
 entity_id uuid,
 metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
create index if not exists activity_feed_workspace_idx on public.activity_feed(workspace_id,created_at desc);

create table if not exists public.deck_versions (
 id uuid primary key default gen_random_uuid(),
 deck_id uuid not null references public.decks(id) on delete cascade,
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 created_by uuid not null references auth.users(id) on delete cascade,
 version_number integer not null,
 label text not null default 'Snapshot',
 reason text,
 snapshot jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 unique(deck_id,version_number)
);
create index if not exists deck_versions_deck_idx on public.deck_versions(deck_id,version_number desc);

create table if not exists public.workspace_audit_logs (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 actor_id uuid not null references auth.users(id) on delete cascade,
 event_type text not null,
 metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
create index if not exists workspace_audit_logs_workspace_idx on public.workspace_audit_logs(workspace_id,created_at desc);

create table if not exists public.moderators (
 user_id uuid primary key references auth.users(id) on delete cascade,
 role text not null check(role in ('moderator','admin')),
 enabled boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create or replace function public.is_platform_moderator()
returns boolean language sql security definer set search_path=public,private as $shyraq$
 select exists(select 1 from public.moderators m where m.user_id=(select auth.uid()) and m.enabled);
$shyraq$;
revoke all on function public.is_platform_moderator() from public,anon;
grant execute on function public.is_platform_moderator() to authenticated;

create or replace function public.create_notification(
 target_user uuid,
 notification_kind text,
 notification_title text,
 notification_body text default '',
 notification_href text default null,
 source_comment_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path=public,private
as $shyraq$
declare
 new_id uuid;
 caller uuid := (select auth.uid());
begin
 if caller is null then
   raise exception 'authentication required';
 end if;
 if target_user <> caller and not (
   notification_kind='comment_mention'
   and source_comment_id is not null
   and exists(
     select 1
     from public.comment_mentions cm
     join public.comments c on c.id=cm.comment_id
     where cm.comment_id=source_comment_id
       and cm.mentioned_user_id=target_user
       and c.author_id=caller
   )
 ) then
   raise exception 'notification target is not allowed';
 end if;

 insert into public.notifications(user_id,kind,title,body,href)
 values(target_user,notification_kind,notification_title,notification_body,notification_href)
 returning id into new_id;
 return new_id;
end
$shyraq$;

revoke all on function public.create_notification(uuid,text,text,text,text,uuid) from public,anon;
grant execute on function public.create_notification(uuid,text,text,text,text,uuid) to authenticated;

create table if not exists public.notification_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 sync_conflicts boolean not null default true,
 author_updates boolean not null default true,
 workspace_invites boolean not null default true,
 collaboration boolean not null default true,
 moderation boolean not null default true,
 backup boolean not null default true,
 offline_state boolean not null default true,
 in_app boolean not null default true,
 updated_at timestamptz not null default now()
);

create table if not exists public.saved_searches (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 name text not null,
 query text not null,
 filters jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
create index if not exists saved_searches_user_idx on public.saved_searches(user_id,created_at desc);

create table if not exists public.saved_filters (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 name text not null,
 kind text not null default 'review_history',
 query jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
create index if not exists saved_filters_user_idx on public.saved_filters(user_id,created_at desc);

-- Keep notification types in sync with application events.
alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
 check(kind in ('sync_conflict','deck_update','workspace_invite','collaboration','moderation','backup','system','comment_mention'));


create or replace function private.is_workspace_member(target_workspace uuid, minimum_role public.workspace_role default 'viewer')
returns boolean language sql security definer set search_path=public,private as $$
 select exists(select 1 from public.workspace_members m where m.workspace_id=target_workspace and m.user_id=(select auth.uid()) and
 case minimum_role
  when 'viewer' then m.role in ('viewer','reviewer','editor','admin','owner')
  when 'reviewer' then m.role in ('reviewer','editor','admin','owner')
  when 'editor' then m.role in ('editor','admin','owner')
  when 'admin' then m.role in ('admin','owner')
  when 'owner' then m.role='owner'
 end);
$$;
create or replace function private.is_workspace_owner(target_workspace uuid)
returns boolean language sql security definer set search_path=public,private as $$
 select exists(select 1 from public.workspaces w where w.id=target_workspace and w.owner_id=(select auth.uid()));
$$;

create or replace function private.touch_deck_updated_at() returns trigger language plpgsql set search_path=public,private as $shyraq$ begin update public.decks set updated_at=now() where id=coalesce(new.deck_id,old.deck_id); return coalesce(new,old); end $shyraq$;

create or replace function private.touch_updated_at() returns trigger language plpgsql set search_path=public,private as $shyraq$ begin new.updated_at=now(); return new; end $shyraq$;
do $$ declare t text; begin
 foreach t in array array['profiles','workspaces','decks','card_templates','cards','review_states','sync_cursors'] loop
  execute format('drop trigger if exists %I_touch on public.%I',t,t);
  execute format('create trigger %I_touch before update on public.%I for each row execute function private.touch_updated_at()',t,t);
 end loop;
end $$;

create or replace function private.handle_new_user() returns trigger
language plpgsql security definer set search_path=public,private as $$
declare w uuid;
begin
 insert into public.profiles(id,display_name) values(new.id,coalesce(new.raw_user_meta_data->>'display_name',split_part(coalesce(new.email,'student'),'@',1))) on conflict(id) do nothing;
 insert into public.workspaces(owner_id,name,slug) values(new.id,'Personal workspace','personal') on conflict(owner_id,slug) do update set updated_at=now() returning id into w;
 insert into public.workspace_members(workspace_id,user_id,role) values(w,new.id,'owner') on conflict(workspace_id,user_id) do nothing;
 return new;
end;
$$;
revoke all on function private.is_workspace_member(uuid,public.workspace_role) from public,anon,authenticated;
revoke all on function private.is_workspace_owner(uuid) from public,anon,authenticated;
grant execute on function private.is_workspace_member(uuid,public.workspace_role) to authenticated;
grant execute on function private.is_workspace_owner(uuid) to authenticated;
revoke all on function private.handle_new_user() from public,anon,authenticated;
revoke all on function private.touch_updated_at() from public,anon,authenticated;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.handle_new_user();

create or replace function private.record_sync_change() returns trigger language plpgsql security definer set search_path=public,private as $
declare
 payload jsonb;
 eid uuid;
 uid uuid;
 deck_id_value uuid;
 workspace_id_value uuid;
 operation_name text;
begin
 payload:=case when tg_op='DELETE' then to_jsonb(old) else to_jsonb(new) end;
 eid:=nullif(payload->>'id','')::uuid;
 if tg_table_name='review_states' or tg_table_name='card_tags' then eid:=nullif(payload->>'card_id','')::uuid; end if;
 if tg_table_name='collection_cards' then eid:=nullif(payload->>'collection_id','')::uuid; end if;
 if payload ? 'user_id' then uid:=nullif(payload->>'user_id','')::uuid;
 elsif payload ? 'owner_id' then uid:=nullif(payload->>'owner_id','')::uuid;
 end if;
 if payload ? 'workspace_id' then workspace_id_value:=nullif(payload->>'workspace_id','')::uuid; end if;
 if payload ? 'deck_id' then deck_id_value:=nullif(payload->>'deck_id','')::uuid;
 elsif tg_table_name='card_tags' then
   select c.deck_id into deck_id_value from public.cards c where c.id=eid;
 elsif tg_table_name='review_states' then
   select c.deck_id into deck_id_value from public.cards c where c.id=eid;
 end if;
 if workspace_id_value is null and tg_table_name='collection_cards' and eid is not null then
   select c.workspace_id into workspace_id_value from public.collections c where c.id=eid;
 end if;
 if workspace_id_value is null and deck_id_value is not null then
   select d.workspace_id into workspace_id_value from public.decks d where d.id=deck_id_value;
 end if;
 if uid is null and deck_id_value is not null then
   select d.owner_id into uid from public.decks d where d.id=deck_id_value;
 end if;
 operation_name:=case when tg_op='DELETE' then 'delete' else 'upsert' end;

 if eid is not null and workspace_id_value is not null and tg_table_name in ('decks','cards','card_templates','tags','collections','collection_cards') then
   insert into public.sync_changes(event_key,user_id,entity_type,entity_id,operation,payload)
   select gen_random_uuid(),wm.user_id,tg_table_name,eid,operation_name,payload
   from public.workspace_members wm
   where wm.workspace_id=workspace_id_value;
 elsif uid is not null and eid is not null then
   insert into public.sync_changes(event_key,user_id,entity_type,entity_id,operation,payload)
   values(gen_random_uuid(),uid,tg_table_name,eid,operation_name,payload);
 end if;
 return coalesce(new,old);
end $;
revoke all on function private.record_sync_change() from public,anon,authenticated;

do $$ declare t text; begin
 foreach t in array array['decks','card_templates','cards','tags','collections','collection_cards','review_states','review_events','media'] loop
  execute format('drop trigger if exists %I_sync on public.%I',t,t);
  execute format('create trigger %I_sync after insert or update or delete on public.%I for each row execute function private.record_sync_change()',t,t);
 end loop;
end $$;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.decks enable row level security;
alter table public.card_templates enable row level security;
alter table public.cards enable row level security;
alter table public.tags enable row level security;
alter table public.card_tags enable row level security;
alter table public.collections enable row level security;
alter table public.collection_cards enable row level security;
alter table public.review_preferences enable row level security;
alter table public.review_states enable row level security;
alter table public.sync_conflicts enable row level security;
alter table public.review_events enable row level security;
alter table public.media enable row level security;
alter table public.sync_cursors enable row level security;
alter table public.sync_changes enable row level security;
alter table public.error_logs enable row level security;
alter table public.deck_reports enable row level security;
alter table public.moderation_actions enable row level security;
alter table public.public_deck_follows enable row level security;
alter table public.creator_relations enable row level security;
alter table public.deck_copies enable row level security;
alter table public.deck_copy_update_history enable row level security;
alter table public.backup_versions enable row level security;
alter table public.backup_schedules enable row level security;
alter table public.import_jobs enable row level security;

alter table public.workspace_invitations enable row level security;
alter table public.notifications enable row level security;
alter table public.review_devices enable row level security;
alter table public.deck_members enable row level security;
alter table public.collection_members enable row level security;
alter table public.comments enable row level security;
alter table public.comment_mentions enable row level security;
alter table public.activity_feed enable row level security;
alter table public.deck_versions enable row level security;
alter table public.workspace_audit_logs enable row level security;
alter table public.moderators enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.saved_searches enable row level security;
alter table public.saved_filters enable row level security;

drop policy if exists error_logs_self_read on public.error_logs;
create policy error_logs_self_read on public.error_logs for select to authenticated
using(user_id=(select auth.uid()) or public.is_platform_moderator());

drop policy if exists error_logs_insert on public.error_logs;
create policy error_logs_insert on public.error_logs for insert to authenticated
with check(user_id=(select auth.uid()));

drop policy if exists profiles_self on public.profiles;
drop policy if exists profiles_public_read on public.profiles;
create policy profiles_public_select on public.profiles for select to authenticated using(true);
create policy profiles_self_insert on public.profiles for insert to authenticated with check(id=(select auth.uid()));
create policy profiles_self_update on public.profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy profiles_self_delete on public.profiles for delete to authenticated using(id=(select auth.uid()));


drop policy if exists workspace_member_read on public.workspaces;
create policy workspace_member_read on public.workspaces for select to authenticated using(owner_id=(select auth.uid()) or private.is_workspace_member(id,'viewer'));
drop policy if exists workspace_owner_write on public.workspaces;
create policy workspace_owner_insert on public.workspaces for insert to authenticated with check(owner_id=(select auth.uid()));
create policy workspace_owner_update on public.workspaces for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
create policy workspace_owner_delete on public.workspaces for delete to authenticated using(owner_id=(select auth.uid()));

drop policy if exists members_read on public.workspace_members;
create policy members_read on public.workspace_members for select to authenticated using(user_id=(select auth.uid()) or private.is_workspace_member(workspace_id,'admin'));
drop policy if exists members_admin_write on public.workspace_members;
create policy members_admin_insert on public.workspace_members for insert to authenticated with check(private.is_workspace_member(workspace_id,'admin') or private.is_workspace_owner(workspace_id));
create policy members_admin_update on public.workspace_members for update to authenticated using((select private.is_workspace_member(workspace_id,'admin')) or (select private.is_workspace_owner(workspace_id))) with check((select private.is_workspace_member(workspace_id,'admin')) or (select private.is_workspace_owner(workspace_id)));
create policy members_admin_delete on public.workspace_members for delete to authenticated using(private.is_workspace_member(workspace_id,'admin'));

drop policy if exists decks_read on public.decks;
create policy decks_read on public.decks for select to authenticated using(visibility='public' or private.is_workspace_member(workspace_id,'viewer'));
drop policy if exists decks_insert on public.decks;
create policy decks_insert on public.decks for insert to authenticated with check(owner_id=(select auth.uid()) and private.is_workspace_member(workspace_id,'editor'));
drop policy if exists decks_update on public.decks;
create policy decks_update on public.decks for update to authenticated using(private.is_workspace_member(workspace_id,'editor')) with check(private.is_workspace_member(workspace_id,'editor'));
drop policy if exists decks_delete on public.decks;
create policy decks_delete on public.decks for delete to authenticated using(owner_id=(select auth.uid()) or private.is_workspace_member(workspace_id,'admin'));

drop policy if exists templates_read on public.card_templates;
create policy templates_read on public.card_templates for select to authenticated using(exists(select 1 from public.decks d where d.id=deck_id and (d.visibility='public' or private.is_workspace_member(d.workspace_id,'viewer'))));
drop policy if exists templates_write on public.card_templates;
drop policy if exists templates_read on public.card_templates;
create policy templates_read on public.card_templates for select to authenticated using(exists(select 1 from public.decks d where d.id=deck_id and (d.visibility='public' or private.is_workspace_member(d.workspace_id,'viewer'))));
create policy templates_insert on public.card_templates for insert to authenticated with check(exists(select 1 from public.decks d where d.id=deck_id and private.is_workspace_member(d.workspace_id,'editor')));
create policy templates_update on public.card_templates for update to authenticated using(exists(select 1 from public.decks d where d.id=deck_id and private.is_workspace_member(d.workspace_id,'editor'))) with check(exists(select 1 from public.decks d where d.id=deck_id and private.is_workspace_member(d.workspace_id,'editor')));
create policy templates_delete on public.card_templates for delete to authenticated using(exists(select 1 from public.decks d where d.id=deck_id and private.is_workspace_member(d.workspace_id,'editor')));

drop policy if exists cards_read on public.cards;
create policy cards_read on public.cards for select to authenticated using(exists(select 1 from public.decks d where d.id=deck_id and (d.visibility='public' or private.is_workspace_member(d.workspace_id,'viewer'))));
drop policy if exists cards_insert on public.cards;
create policy cards_insert on public.cards for insert to authenticated with check(owner_id=(select auth.uid()) and exists(select 1 from public.decks d where d.id=deck_id and private.is_workspace_member(d.workspace_id,'editor')));
drop policy if exists cards_update on public.cards;
create policy cards_update on public.cards for update to authenticated using(exists(select 1 from public.decks d where d.id=deck_id and private.is_workspace_member(d.workspace_id,'editor'))) with check(owner_id=(select auth.uid()) and exists(select 1 from public.decks d where d.id=deck_id and private.is_workspace_member(d.workspace_id,'editor')));
drop policy if exists cards_delete on public.cards;
create policy cards_delete on public.cards for delete to authenticated using(exists(select 1 from public.decks d where d.id=deck_id and private.is_workspace_member(d.workspace_id,'editor')));

drop policy if exists tags_member on public.tags;
create policy tags_member on public.tags for all to authenticated using(private.is_workspace_member(workspace_id,'editor')) with check(private.is_workspace_member(workspace_id,'editor'));
drop policy if exists card_tags_member on public.card_tags;
create policy card_tags_member on public.card_tags for all to authenticated using(exists(select 1 from public.cards c join public.decks d on d.id=c.deck_id where c.id=card_id and private.is_workspace_member(d.workspace_id,'editor'))) with check(exists(select 1 from public.cards c join public.decks d on d.id=c.deck_id where c.id=card_id and private.is_workspace_member(d.workspace_id,'editor')));

drop policy if exists collections_read on public.collections;
create policy collections_read on public.collections for select to authenticated
using(is_public or private.is_workspace_member(workspace_id,'viewer'));
drop policy if exists collections_write on public.collections;
create policy collections_write on public.collections for insert to authenticated with check(owner_id=(select auth.uid()) and private.is_workspace_member(workspace_id,'editor'));
drop policy if exists collections_update on public.collections;
create policy collections_update on public.collections for update to authenticated using(owner_id=(select auth.uid()) and private.is_workspace_member(workspace_id,'editor')) with check(owner_id=(select auth.uid()) and private.is_workspace_member(workspace_id,'editor'));
drop policy if exists collections_delete on public.collections;
create policy collections_delete on public.collections for delete to authenticated using(owner_id=(select auth.uid()) and private.is_workspace_member(workspace_id,'editor'));
drop policy if exists collections_feature_moderator_update on public.collections;
create policy collections_feature_moderator_update on public.collections for update to authenticated using(public.is_platform_moderator()) with check(public.is_platform_moderator());
drop policy if exists collection_cards_member on public.collection_cards;
create policy collection_cards_select on public.collection_cards for select to authenticated
using (
  exists (
    select 1 from public.collections c
    where c.id=collection_id
      and (c.is_public or private.is_workspace_member(c.workspace_id,'viewer'))
  )
);
create policy collection_cards_write on public.collection_cards for insert to authenticated
with check (
  exists (
    select 1 from public.collections c
    where c.id=collection_id
      and private.is_workspace_member(c.workspace_id,'editor')
  )
);
create policy collection_cards_update on public.collection_cards for update to authenticated
using (
  exists (
    select 1 from public.collections c
    where c.id=collection_id
      and private.is_workspace_member(c.workspace_id,'editor')
  )
)
with check (
  exists (
    select 1 from public.collections c
    where c.id=collection_id
      and private.is_workspace_member(c.workspace_id,'editor')
  )
);
create policy collection_cards_delete on public.collection_cards for delete to authenticated
using (
  exists (
    select 1 from public.collections c
    where c.id=collection_id
      and private.is_workspace_member(c.workspace_id,'editor')
  )
);

drop policy if exists review_preferences_self on public.review_preferences;
create policy review_preferences_self on public.review_preferences for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

drop policy if exists review_state_self on public.review_states;
create policy review_state_self on public.review_states for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
drop policy if exists review_event_self on public.review_events;
create policy review_event_self on public.review_events for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
drop policy if exists sync_cursor_self on public.sync_cursors;
create policy sync_cursor_self on public.sync_cursors for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
drop policy if exists sync_change_self on public.sync_changes;
create policy sync_change_self on public.sync_changes for select to authenticated using(user_id=(select auth.uid()));

drop policy if exists media_read on public.media;
create policy media_read on public.media for select to authenticated using(owner_id=(select auth.uid()) or private.is_workspace_member(workspace_id,'viewer'));
drop policy if exists media_insert on public.media;
create policy media_insert on public.media for insert to authenticated with check(owner_id=(select auth.uid()) and private.is_workspace_member(workspace_id,'editor'));
drop policy if exists media_update on public.media;
create policy media_update on public.media for update to authenticated using(owner_id=(select auth.uid()) and private.is_workspace_member(workspace_id,'editor')) with check(owner_id=(select auth.uid()) and private.is_workspace_member(workspace_id,'editor'));
drop policy if exists media_delete on public.media;
create policy media_delete on public.media for delete to authenticated using(owner_id=(select auth.uid()) and private.is_workspace_member(workspace_id,'editor'));

drop policy if exists deck_reports_insert on public.deck_reports;
create policy deck_reports_insert on public.deck_reports for insert to authenticated with check(reporter_id=(select auth.uid()) and exists(select 1 from public.decks d where d.id=deck_id and d.visibility='public'));
drop policy if exists deck_reports_read on public.deck_reports;
create policy deck_reports_read on public.deck_reports for select to authenticated using(reporter_id=(select auth.uid()) or exists(select 1 from public.decks d where d.id=deck_id and d.owner_id=(select auth.uid())));
drop policy if exists deck_reports_update on public.deck_reports;
create policy deck_reports_update on public.deck_reports for update to authenticated using(exists(select 1 from public.decks d where d.id=deck_id and d.owner_id=(select auth.uid()))) with check(exists(select 1 from public.decks d where d.id=deck_id and d.owner_id=(select auth.uid())));

drop policy if exists moderation_actions_read on public.moderation_actions;
create policy moderation_actions_read on public.moderation_actions for select to authenticated
using (
  moderator_id=(select auth.uid())
  or public.is_platform_moderator()
  or exists (
    select 1 from public.deck_reports r
    join public.decks d on d.id=r.deck_id
    where r.id=report_id and d.owner_id=(select auth.uid())
  )
);
drop policy if exists moderation_actions_insert on public.moderation_actions;
create policy moderation_actions_insert on public.moderation_actions for insert to authenticated
with check (
  moderator_id=(select auth.uid())
  and (
    public.is_platform_moderator()
    or exists (
      select 1 from public.deck_reports r
      join public.decks d on d.id=r.deck_id
      where r.id=report_id and d.owner_id=(select auth.uid())
    )
  )
);

drop policy if exists deck_copy_update_history_self on public.deck_copy_update_history;
create policy deck_copy_update_history_self on public.deck_copy_update_history for all to authenticated
using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

drop policy if exists backup_versions_self on public.backup_versions;
drop policy if exists import_jobs_self on public.import_jobs;
create policy import_jobs_self on public.import_jobs for all to authenticated
using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

drop policy if exists backup_schedules_self on public.backup_schedules;
create policy backup_schedules_self on public.backup_schedules for all to authenticated
using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

create policy backup_versions_self on public.backup_versions for all to authenticated
using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));


drop policy if exists creator_relations_self_select on public.creator_relations;
create policy creator_relations_self_select on public.creator_relations for select to authenticated
using(user_id=(select auth.uid()));

drop policy if exists creator_relations_self_insert on public.creator_relations;
create policy creator_relations_self_insert on public.creator_relations for insert to authenticated
with check(user_id=(select auth.uid()) and creator_id<>(select auth.uid()));

drop policy if exists creator_relations_self_delete on public.creator_relations;
create policy creator_relations_self_delete on public.creator_relations for delete to authenticated
using(user_id=(select auth.uid()));

drop policy if exists creator_relations_self_update on public.creator_relations;
create policy creator_relations_self_update on public.creator_relations for update to authenticated
using(user_id=(select auth.uid()))
with check(user_id=(select auth.uid()) and creator_id<>(select auth.uid()));

drop policy if exists follows_self on public.public_deck_follows;
create policy follows_self on public.public_deck_follows for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
drop policy if exists copies_self on public.deck_copies;
create policy copies_self on public.deck_copies for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

drop policy if exists invitations_admin_read on public.workspace_invitations;
create policy invitations_admin_read on public.workspace_invitations for select to authenticated using((select private.is_workspace_member(workspace_id,'admin')) or email=lower(((select auth.jwt())->>'email')));
drop policy if exists invitations_admin_write on public.workspace_invitations;
create policy invitations_admin_write on public.workspace_invitations for insert to authenticated with check(invited_by=(select auth.uid()) and (select private.is_workspace_member(workspace_id,'admin')));
drop policy if exists invitations_admin_update on public.workspace_invitations;
create policy invitations_admin_update on public.workspace_invitations for update to authenticated using((select private.is_workspace_member(workspace_id,'admin'))) with check((select private.is_workspace_member(workspace_id,'admin')));


-- Collaboration and user-owned utility policies.
drop policy if exists notifications_self on public.notifications;
drop policy if exists notifications_self on public.notifications;
create policy notifications_self on public.notifications for select to authenticated
using(user_id=(select auth.uid()));
create policy notifications_update_self on public.notifications for update to authenticated
using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

drop policy if exists review_devices_self on public.review_devices;
create policy review_devices_self on public.review_devices for all to authenticated
using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

drop policy if exists sync_conflicts_self on public.sync_conflicts;
create policy sync_conflicts_self on public.sync_conflicts for all to authenticated
using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

drop policy if exists invitations_admin_delete on public.workspace_invitations;
create policy invitations_admin_delete on public.workspace_invitations for delete to authenticated
using(private.is_workspace_member(workspace_id,'admin'));

drop policy if exists deck_members_read on public.deck_members;
create policy deck_members_read on public.deck_members for select to authenticated
using (
  exists (
    select 1 from public.decks d
    where d.id=deck_members.deck_id
      and d.workspace_id=deck_members.workspace_id
      and private.is_workspace_member(d.workspace_id,'viewer')
  )
);
drop policy if exists deck_members_admin_write on public.deck_members;
create policy deck_members_admin_write on public.deck_members for insert to authenticated
with check (
  exists (
    select 1 from public.decks d
    where d.id=deck_members.deck_id
      and d.workspace_id=deck_members.workspace_id
      and private.is_workspace_member(d.workspace_id,'admin')
  )
);
create policy deck_members_admin_update on public.deck_members for update to authenticated
using (
  exists (
    select 1 from public.decks d
    where d.id=deck_members.deck_id
      and d.workspace_id=deck_members.workspace_id
      and private.is_workspace_member(d.workspace_id,'admin')
  )
)
with check (
  exists (
    select 1 from public.decks d
    where d.id=deck_members.deck_id
      and d.workspace_id=deck_members.workspace_id
      and private.is_workspace_member(d.workspace_id,'admin')
  )
);
create policy deck_members_admin_delete on public.deck_members for delete to authenticated
using (
  exists (
    select 1 from public.decks d
    where d.id=deck_members.deck_id
      and d.workspace_id=deck_members.workspace_id
      and private.is_workspace_member(d.workspace_id,'admin')
  )
);

drop policy if exists collection_members_read on public.collection_members;
create policy collection_members_read on public.collection_members for select to authenticated
using (
  exists (
    select 1 from public.collections c
    where c.id=collection_members.collection_id
      and c.workspace_id=collection_members.workspace_id
      and private.is_workspace_member(c.workspace_id,'viewer')
  )
);
drop policy if exists collection_members_admin_write on public.collection_members;
create policy collection_members_admin_write on public.collection_members for insert to authenticated
with check (
  exists (
    select 1 from public.collections c
    where c.id=collection_members.collection_id
      and c.workspace_id=collection_members.workspace_id
      and private.is_workspace_member(c.workspace_id,'admin')
  )
);
create policy collection_members_admin_update on public.collection_members for update to authenticated
using (
  exists (
    select 1 from public.collections c
    where c.id=collection_members.collection_id
      and c.workspace_id=collection_members.workspace_id
      and private.is_workspace_member(c.workspace_id,'admin')
  )
)
with check (
  exists (
    select 1 from public.collections c
    where c.id=collection_members.collection_id
      and c.workspace_id=collection_members.workspace_id
      and private.is_workspace_member(c.workspace_id,'admin')
  )
);
create policy collection_members_admin_delete on public.collection_members for delete to authenticated
using (
  exists (
    select 1 from public.collections c
    where c.id=collection_members.collection_id
      and c.workspace_id=collection_members.workspace_id
      and private.is_workspace_member(c.workspace_id,'admin')
  )
);

drop policy if exists comments_read on public.comments;
create policy comments_read on public.comments for select to authenticated
using (
  exists (
    select 1 from public.decks d
    where d.id=comments.deck_id
      and d.workspace_id=comments.workspace_id
      and private.is_workspace_member(d.workspace_id,'viewer')
  )
);
drop policy if exists comments_insert on public.comments;
create policy comments_insert on public.comments for insert to authenticated
with check (
  author_id=(select auth.uid())
  and exists (
    select 1 from public.decks d
    where d.id=comments.deck_id
      and d.workspace_id=comments.workspace_id
      and private.is_workspace_member(d.workspace_id,'editor')
  )
  and (
    comments.card_id is null
    or exists (
      select 1 from public.cards c
      where c.id=comments.card_id and c.deck_id=comments.deck_id
    )
  )
);
drop policy if exists comments_update on public.comments;
create policy comments_update on public.comments for update to authenticated
using (
  exists (
    select 1 from public.decks d
    where d.id=comments.deck_id
      and d.workspace_id=comments.workspace_id
      and private.is_workspace_member(d.workspace_id,'editor')
  )
)
with check (
  exists (
    select 1 from public.decks d
    where d.id=comments.deck_id
      and d.workspace_id=comments.workspace_id
      and private.is_workspace_member(d.workspace_id,'editor')
  )
  and (
    comments.card_id is null
    or exists (
      select 1 from public.cards c
      where c.id=comments.card_id and c.deck_id=comments.deck_id
    )
  )
);
drop policy if exists comments_delete on public.comments;
create policy comments_delete on public.comments for delete to authenticated
using (
  (
    comments.author_id=(select auth.uid())
    or exists (
      select 1 from public.decks d
      where d.id=comments.deck_id
        and d.workspace_id=comments.workspace_id
        and private.is_workspace_member(d.workspace_id,'admin')
    )
  )
  and exists (
    select 1 from public.decks d
    where d.id=comments.deck_id
      and d.workspace_id=comments.workspace_id
  )
);

drop policy if exists comment_mentions_read on public.comment_mentions;
create policy comment_mentions_read on public.comment_mentions for select to authenticated using(mentioned_user_id=(select auth.uid()) or exists(select 1 from public.comments c where c.id=comment_id and private.is_workspace_member(c.workspace_id,'viewer')));
drop policy if exists comment_mentions_insert on public.comment_mentions;
create policy comment_mentions_insert on public.comment_mentions for insert to authenticated with check(exists(select 1 from public.comments c where c.id=comment_id and c.author_id=(select auth.uid())));

drop policy if exists activity_feed_read on public.activity_feed;
create policy activity_feed_read on public.activity_feed for select to authenticated using(private.is_workspace_member(workspace_id,'viewer'));
drop policy if exists activity_feed_insert on public.activity_feed;
create policy activity_feed_insert on public.activity_feed for insert to authenticated with check(actor_id=(select auth.uid()) and private.is_workspace_member(workspace_id,'reviewer'));

drop policy if exists deck_versions_read on public.deck_versions;
create policy deck_versions_read on public.deck_versions for select to authenticated using(private.is_workspace_member(workspace_id,'viewer'));
drop policy if exists deck_versions_write on public.deck_versions;
create policy deck_versions_write on public.deck_versions for all to authenticated using(private.is_workspace_member(workspace_id,'editor')) with check(created_by=(select auth.uid()) and private.is_workspace_member(workspace_id,'editor'));

drop policy if exists workspace_audit_logs_read on public.workspace_audit_logs;
create policy workspace_audit_logs_read on public.workspace_audit_logs for select to authenticated using(private.is_workspace_member(workspace_id,'admin'));
drop policy if exists workspace_audit_logs_insert on public.workspace_audit_logs;
create policy workspace_audit_logs_insert on public.workspace_audit_logs for insert to authenticated with check(actor_id=(select auth.uid()) and private.is_workspace_member(workspace_id,'admin'));

drop policy if exists moderators_self_read on public.moderators;
create policy moderators_self_read on public.moderators for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists moderators_admin_write on public.moderators;
create policy moderators_admin_write on public.moderators for all to authenticated using(public.is_platform_moderator()) with check(public.is_platform_moderator());

drop policy if exists notification_preferences_self on public.notification_preferences;
create policy notification_preferences_self on public.notification_preferences for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

drop policy if exists saved_searches_self on public.saved_searches;
create policy saved_searches_self on public.saved_searches for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

drop policy if exists saved_filters_self on public.saved_filters;
create policy saved_filters_self on public.saved_filters for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

drop policy if exists public_user_media_read on storage.objects;
create policy public_user_media_read on storage.objects for select to authenticated using(bucket_id='user-media' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists public_user_media_insert on storage.objects;
create policy public_user_media_insert on storage.objects for insert to authenticated with check(bucket_id='user-media' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists public_user_media_update on storage.objects;
create policy public_user_media_update on storage.objects for update to authenticated using(bucket_id='user-media' and (storage.foldername(name))[1]=(select auth.uid())::text) with check(bucket_id='user-media' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists public_user_media_delete on storage.objects;
create policy public_user_media_delete on storage.objects for delete to authenticated using(bucket_id='user-media' and (storage.foldername(name))[1]=(select auth.uid())::text);

insert into storage.buckets(id,name,public) values('user-media','user-media',false) on conflict(id) do nothing;

revoke all on all tables in schema public from anon;
grant select,insert,update,delete on all tables in schema public to authenticated;
revoke all on public.workspace_invitations from anon;
grant select,insert,update on public.workspace_invitations to authenticated;


-- Shyraq collaboration realtime
do $shyraq$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='decks') then
    alter publication supabase_realtime add table public.decks;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='cards') then
    alter publication supabase_realtime add table public.cards;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='card_templates') then
    alter publication supabase_realtime add table public.card_templates;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='workspace_members') then
    alter publication supabase_realtime add table public.workspace_members;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='comments') then
    alter publication supabase_realtime add table public.comments;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='activity_feed') then
    alter publication supabase_realtime add table public.activity_feed;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='deck_versions') then
    alter publication supabase_realtime add table public.deck_versions;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='deck_members') then
    alter publication supabase_realtime add table public.deck_members;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='collection_members') then
    alter publication supabase_realtime add table public.collection_members;
  end if;
end $shyraq$;


-- Collaboration hardening: editors may update shared cards, ownership remains immutable.
create or replace function private.prevent_card_owner_change()
returns trigger
language plpgsql
set search_path = pg_catalog
as $shyraq$
begin
  if new.owner_id is distinct from old.owner_id then
    raise exception 'card owner cannot be changed';
  end if;
  return new;
end;
$shyraq$;

drop trigger if exists cards_owner_immutable on public.cards;
create trigger cards_owner_immutable
before update on public.cards
for each row execute function private.prevent_card_owner_change();

drop policy if exists cards_update on public.cards;
create policy cards_update
on public.cards
for update
to authenticated
using (
  exists (
    select 1 from public.decks d
    where d.id = cards.deck_id
      and private.is_workspace_member(d.workspace_id, 'editor'::workspace_role)
  )
)
with check (
  exists (
    select 1 from public.decks d
    where d.id = cards.deck_id
      and private.is_workspace_member(d.workspace_id, 'editor'::workspace_role)
  )
  and (
    cards.template_id is null
    or exists (
      select 1 from public.card_templates t
      where t.id = cards.template_id and t.deck_id = cards.deck_id
    )
  )
);

create or replace function private.prevent_deck_owner_change()
returns trigger
language plpgsql
set search_path = pg_catalog
as $shyraq$
begin
  if new.owner_id is distinct from old.owner_id then
    raise exception 'deck owner cannot be changed';
  end if;
  return new;
end;
$shyraq$;

drop trigger if exists decks_owner_immutable on public.decks;
create trigger decks_owner_immutable
before update on public.decks
for each row execute function private.prevent_deck_owner_change();


-- Harden collaboration trigger functions.
alter function private.prevent_card_owner_change() set search_path = pg_catalog;
alter function private.prevent_deck_owner_change() set search_path = pg_catalog;

-- Lock down legacy tables that are not part of Shyraq.
alter table public.flashcards enable row level security;
alter table public.card_states enable row level security;
alter table public.flashcard_reviews enable row level security;
alter table public.focus_sessions enable row level security;
alter table public.flashcard_decks enable row level security;
alter table public.projects enable row level security;
alter table public._prisma_migrations enable row level security;
