create extension if not exists pgcrypto;

create type public.workspace_kind as enum ('personal','team');
create type public.workspace_role as enum ('owner','admin','editor','reviewer','viewer');
create type public.deck_visibility as enum ('private','workspace','public');
create type public.card_kind as enum ('basic','reverse','cloze','multiple_choice','image','custom');
create type public.review_rating as enum ('again','hard','good','easy');
create type public.card_queue as enum ('learning','review','relearning','suspended');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  bio text,
  timezone text not null default 'Asia/Almaty',
  locale text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  kind public.workspace_kind not null default 'personal',
  name text not null,
  slug text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id,slug)
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.workspace_role not null default 'viewer',
  created_at timestamptz not null default now(),
  primary key(workspace_id,user_id)
);

create table public.decks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  visibility public.deck_visibility not null default 'private',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.decks(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  kind public.card_kind not null default 'basic',
  content jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  is_suspended boolean not null default false,
  is_marked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  unique(workspace_id,name)
);

create table public.card_tags (
  card_id uuid not null references public.cards(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key(card_id,tag_id)
);

create table public.review_states (
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  queue public.card_queue not null default 'learning',
  state_data jsonb not null default '{}'::jsonb,
  due_at timestamptz,
  last_reviewed_at timestamptz,
  reps integer not null default 0,
  lapses integer not null default 0,
  stability double precision,
  difficulty double precision,
  scheduled_days integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key(user_id,card_id)
);

create table public.review_events (
  id uuid primary key default gen_random_uuid(),
  event_key uuid not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  device_id uuid not null,
  client_sequence bigint,
  reviewed_at timestamptz not null,
  rating public.review_rating not null,
  elapsed_ms integer,
  previous_state jsonb not null default '{}'::jsonb,
  next_state jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(device_id,client_sequence)
);

create table public.sync_changes (
  cursor bigint generated always as identity primary key,
  event_key uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  operation text not null check(operation in ('upsert','delete')),
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  unique(user_id,event_key)
);

create index cards_deck_idx on public.cards(deck_id);
create index review_states_due_idx on public.review_states(user_id,due_at);
create index review_events_user_idx on public.review_events(user_id,reviewed_at desc);
create index sync_changes_user_cursor_idx on public.sync_changes(user_id,cursor);

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.decks enable row level security;
alter table public.cards enable row level security;
alter table public.tags enable row level security;
alter table public.card_tags enable row level security;
alter table public.review_states enable row level security;
alter table public.review_events enable row level security;
alter table public.sync_changes enable row level security;

create or replace function public.is_workspace_member(target_workspace uuid, minimum_role public.workspace_role default 'viewer')
returns boolean language sql security definer set search_path=public as $
  select exists(
    select 1 from public.workspace_members m
    where m.workspace_id=target_workspace
      and m.user_id=(select auth.uid())
      and case minimum_role
        when 'viewer' then m.role in ('viewer','reviewer','editor','admin','owner')
        when 'reviewer' then m.role in ('reviewer','editor','admin','owner')
        when 'editor' then m.role in ('editor','admin','owner')
        when 'admin' then m.role in ('admin','owner')
        when 'owner' then m.role='owner'
      end
  );
$;

create or replace function public.is_workspace_owner(target_workspace uuid)
returns boolean language sql security definer set search_path=public as $
  select exists(select 1 from public.workspaces w where w.id=target_workspace and w.owner_id=(select auth.uid()));
$;

create policy profiles_self on public.profiles for all to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));

create policy workspace_member_read on public.workspaces for select to authenticated using(owner_id=(select auth.uid()) or public.is_workspace_member(id,'viewer'));
create policy workspace_owner_write on public.workspaces for all to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));

create policy members_read on public.workspace_members for select to authenticated using(user_id=(select auth.uid()) or public.is_workspace_member(workspace_id,'admin'));
create policy members_admin_write on public.workspace_members for all to authenticated using(public.is_workspace_member(workspace_id,'admin')) with check(public.is_workspace_member(workspace_id,'admin'));

create policy decks_read on public.decks for select to authenticated using(visibility='public' or public.is_workspace_member(decks.workspace_id,'viewer'));
create policy decks_write on public.decks for insert to authenticated with check(owner_id=(select auth.uid()) and public.is_workspace_member(workspace_id,'editor'));
create policy decks_update on public.decks for update to authenticated using(exists(select 1 from public.workspace_members m where m.workspace_id=workspace_id and m.user_id=(select auth.uid()) and m.role in ('owner','admin','editor'))) with check(exists(select 1 from public.workspace_members m where m.workspace_id=workspace_id and m.user_id=(select auth.uid()) and m.role in ('owner','admin','editor')));
create policy decks_delete on public.decks for delete to authenticated using(owner_id=(select auth.uid()) or public.is_workspace_member(workspace_id,'admin'));

create policy cards_read on public.cards for select to authenticated using(exists(select 1 from public.decks d where d.id=deck_id and (d.visibility='public' or public.is_workspace_member(d.workspace_id,'viewer'))));
create policy cards_write on public.cards for insert to authenticated with check(owner_id=(select auth.uid()) and exists(select 1 from public.decks d join public.workspace_members m on m.workspace_id=d.workspace_id where d.id=deck_id and m.user_id=(select auth.uid()) and m.role in ('owner','admin','editor')));
create policy cards_update on public.cards for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
create policy cards_delete on public.cards for delete to authenticated using(owner_id=(select auth.uid()));

create policy tags_member on public.tags for all to authenticated using(public.is_workspace_member(workspace_id,'viewer')) with check(exists(select 1 from public.workspace_members m where m.workspace_id=workspace_id and m.user_id=(select auth.uid())));

create policy card_tags_member on public.card_tags for all to authenticated using(exists(select 1 from public.cards c join public.decks d on d.id=c.deck_id join public.workspace_members m on m.workspace_id=d.workspace_id where c.id=card_id and m.user_id=(select auth.uid()))) with check(exists(select 1 from public.cards c join public.decks d on d.id=c.deck_id join public.workspace_members m on m.workspace_id=d.workspace_id where c.id=card_id and m.user_id=(select auth.uid())));

create policy review_state_self on public.review_states for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy review_event_self on public.review_events for select to authenticated using(user_id=(select auth.uid()));
create policy review_event_insert on public.review_events for insert to authenticated with check(user_id=(select auth.uid()));
create policy sync_change_self on public.sync_changes for select to authenticated using(user_id=(select auth.uid()));

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path=public as $$
declare w uuid;
begin
  insert into public.profiles(id,display_name) values(new.id,coalesce(new.raw_user_meta_data->>'display_name',split_part(coalesce(new.email,'student'),'@',1)));
  insert into public.workspaces(owner_id,name,slug) values(new.id,'Personal workspace','personal') returning id into w;
  insert into public.workspace_members(workspace_id,user_id,role) values(w,new.id,'owner');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

revoke all on all tables in schema public from anon;
grant select,insert,update,delete on all tables in schema public to authenticated;
