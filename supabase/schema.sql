create extension if not exists pgcrypto;
create schema if not exists private;

do $$ begin create type public.workspace_kind as enum ('personal','team'); exception when duplicate_object then null; end $$;
do $$ begin create type public.workspace_role as enum ('owner','admin','editor','reviewer','viewer'); exception when duplicate_object then null; end $$;
do $$ begin create type public.deck_visibility as enum ('private','workspace','public'); exception when duplicate_object then null; end $$;
do $$ begin create type public.card_kind as enum ('basic','reverse','cloze','multiple_choice','image','custom'); exception when duplicate_object then null; end $$;
do $$ begin create type public.review_rating as enum ('again','hard','good','easy'); exception when duplicate_object then null; end $$;
do $$ begin create type public.card_queue as enum ('learning','review','relearning','suspended'); exception when duplicate_object then null; end $$;
do $$ begin create type public.collection_kind as enum ('favorites','custom'); exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 username text unique, display_name text, avatar_url text, bio text,
 timezone text not null default 'Asia/Almaty', locale text not null default 'en',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.workspaces (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
 kind public.workspace_kind not null default 'personal', name text not null, slug text not null, description text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(owner_id,slug)
);
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
 settings jsonb not null default '{}'::jsonb, source_deck_id uuid references public.decks(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
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
 kind public.collection_kind not null default 'custom', created_at timestamptz not null default now()
);
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
 updated_at timestamptz not null default now()
);

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
 event_key uuid not null unique references public.review_events(event_key) on delete cascade,
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
create index if not exists media_owner_id_idx on public.media(owner_id);
create index if not exists media_workspace_id_idx on public.media(workspace_id);
create index if not exists public_deck_follows_deck_id_idx on public.public_deck_follows(deck_id);
create index if not exists deck_reports_deck_idx on public.deck_reports(deck_id,status,created_at desc);
create index if not exists deck_reports_reporter_idx on public.deck_reports(reporter_id);
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

create or replace function private.touch_deck_updated_at() returns trigger language plpgsql set search_path=public,private as $ begin update public.decks set updated_at=now() where id=coalesce(new.deck_id,old.deck_id); return coalesce(new,old); end $;

create or replace function private.touch_updated_at() returns trigger language plpgsql set search_path=public,private as $ begin new.updated_at=now(); return new; end $;
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
revoke all on function private.handle_new_user() from public,anon,authenticated;
revoke all on function private.touch_updated_at() from public,anon,authenticated;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.handle_new_user();

create or replace function private.record_sync_change() returns trigger language plpgsql security definer set search_path=public,private as $$
declare
 payload jsonb;
 eid uuid;
 uid uuid;
 deck_id_value uuid;
begin
 payload:=case when tg_op='DELETE' then to_jsonb(old) else to_jsonb(new) end;
 eid:=nullif(payload->>'id','')::uuid;
 if tg_table_name='review_states' or tg_table_name='card_tags' then eid:=nullif(payload->>'card_id','')::uuid; end if;
 if payload ? 'user_id' then uid:=nullif(payload->>'user_id','')::uuid;
 elsif payload ? 'owner_id' then uid:=nullif(payload->>'owner_id','')::uuid;
 end if;
 if payload ? 'deck_id' then deck_id_value:=nullif(payload->>'deck_id','')::uuid;
 elsif tg_table_name='card_tags' then
   select c.deck_id into deck_id_value from public.cards c where c.id=eid;
 elsif tg_table_name='review_states' then
   select c.deck_id into deck_id_value from public.cards c where c.id=eid;
 end if;
 if uid is null and deck_id_value is not null then
   select d.owner_id into uid from public.decks d where d.id=deck_id_value;
 end if;
 if uid is not null and eid is not null then
   insert into public.sync_changes(event_key,user_id,entity_type,entity_id,operation,payload)
   values(gen_random_uuid(),uid,tg_table_name,eid,case when tg_op='DELETE' then 'delete' else 'upsert' end,payload);
 end if;
 return coalesce(new,old);
end $$;
revoke all on function private.record_sync_change() from public,anon,authenticated;

do $$ declare t text; begin
 foreach t in array array['decks','card_templates','cards','tags','collections','review_states','review_events','media'] loop
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
alter table public.deck_reports enable row level security;
alter table public.public_deck_follows enable row level security;
alter table public.deck_copies enable row level security;
alter table public.workspace_invitations enable row level security;

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
create policy members_admin_update on public.workspace_members for update to authenticated using(private.is_workspace_member(workspace_id,'admin') or private.is_workspace_owner(workspace_id)) with check(private.is_workspace_member(workspace_id,'admin') or private.is_workspace_owner(workspace_id));
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
create policy collections_read on public.collections for select to authenticated using(private.is_workspace_member(workspace_id,'viewer'));
drop policy if exists collections_write on public.collections;
create policy collections_write on public.collections for insert to authenticated with check(owner_id=(select auth.uid()) and private.is_workspace_member(workspace_id,'editor'));
drop policy if exists collections_update on public.collections;
create policy collections_update on public.collections for update to authenticated using(owner_id=(select auth.uid()) and private.is_workspace_member(workspace_id,'editor')) with check(owner_id=(select auth.uid()) and private.is_workspace_member(workspace_id,'editor'));
drop policy if exists collections_delete on public.collections;
create policy collections_delete on public.collections for delete to authenticated using(owner_id=(select auth.uid()) and private.is_workspace_member(workspace_id,'editor'));
drop policy if exists collection_cards_member on public.collection_cards;
create policy collection_cards_member on public.collection_cards for all to authenticated using(exists(select 1 from public.collections c where c.id=collection_id and private.is_workspace_member(c.workspace_id,'editor'))) with check(exists(select 1 from public.collections c where c.id=collection_id and private.is_workspace_member(c.workspace_id,'editor')));

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

drop policy if not exists deck_reports_insert on public.deck_reports;
create policy deck_reports_insert on public.deck_reports for insert to authenticated with check(reporter_id=(select auth.uid()) and exists(select 1 from public.decks d where d.id=deck_id and d.visibility='public'));
drop policy if not exists deck_reports_read on public.deck_reports;
create policy deck_reports_read on public.deck_reports for select to authenticated using(reporter_id=(select auth.uid()) or exists(select 1 from public.decks d where d.id=deck_id and d.owner_id=(select auth.uid())));
drop policy if not exists deck_reports_update on public.deck_reports;
create policy deck_reports_update on public.deck_reports for update to authenticated using(exists(select 1 from public.decks d where d.id=deck_id and d.owner_id=(select auth.uid()))) with check(exists(select 1 from public.decks d where d.id=deck_id and d.owner_id=(select auth.uid())));

drop policy if exists follows_self on public.public_deck_follows;
create policy follows_self on public.public_deck_follows for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
drop policy if exists copies_self on public.deck_copies;
create policy copies_self on public.deck_copies for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

drop policy if exists invitations_admin_read on public.workspace_invitations;
create policy invitations_admin_read on public.workspace_invitations for select to authenticated using(private.is_workspace_member(workspace_id,'admin') or email=lower((select auth.jwt()->>'email')));
drop policy if exists invitations_admin_write on public.workspace_invitations;
create policy invitations_admin_write on public.workspace_invitations for insert to authenticated with check(invited_by=(select auth.uid()) and private.is_workspace_member(workspace_id,'admin'));
drop policy if exists invitations_admin_update on public.workspace_invitations;
create policy invitations_admin_update on public.workspace_invitations for update to authenticated using(private.is_workspace_member(workspace_id,'admin')) with check(private.is_workspace_member(workspace_id,'admin'));

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
