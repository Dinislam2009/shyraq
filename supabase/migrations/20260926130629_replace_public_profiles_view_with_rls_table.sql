drop view if exists public.public_profiles;

create table if not exists public.public_profiles (
 id uuid primary key references public.profiles(id) on delete cascade,
 username text unique,
 display_name text,
 bio text,
 avatar_url text,
 created_at timestamptz not null,
 show_activity boolean not null default true,
 show_followers boolean not null default true
);

alter table public.public_profiles enable row level security;

revoke all on public.public_profiles from anon,authenticated;
grant select on public.public_profiles to anon,authenticated;

drop policy if exists public_profiles_public_select on public.public_profiles;
create policy public_profiles_public_select on public.public_profiles
 for select to anon,authenticated using (true);

create or replace function private.sync_public_profile() returns trigger
language plpgsql
security definer
set search_path=public,private
as $shyraq$
begin
 if tg_op='DELETE' then
  delete from public.public_profiles where id=old.id;
  return old;
 end if;

 insert into public.public_profiles(
  id,username,display_name,bio,avatar_url,created_at,show_activity,show_followers
 ) values (
  new.id,new.username,new.display_name,new.bio,new.avatar_url,new.created_at,new.show_activity,new.show_followers
 )
 on conflict(id) do update set
  username=excluded.username,
  display_name=excluded.display_name,
  bio=excluded.bio,
  avatar_url=excluded.avatar_url,
  created_at=excluded.created_at,
  show_activity=excluded.show_activity,
  show_followers=excluded.show_followers;

 return new;
end;
$shyraq$;

revoke all on function private.sync_public_profile() from public,anon,authenticated;

drop trigger if exists sync_public_profile on public.profiles;
create trigger sync_public_profile
after insert or update or delete on public.profiles
for each row execute function private.sync_public_profile();

insert into public.public_profiles(
 id,username,display_name,bio,avatar_url,created_at,show_activity,show_followers
)
select id,username,display_name,bio,avatar_url,created_at,show_activity,show_followers
from public.profiles
on conflict(id) do update set
 username=excluded.username,
 display_name=excluded.display_name,
 bio=excluded.bio,
 avatar_url=excluded.avatar_url,
 created_at=excluded.created_at,
 show_activity=excluded.show_activity,
 show_followers=excluded.show_followers;
