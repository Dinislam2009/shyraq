create or replace view public.public_profiles with (security_barrier=true) as
select id,username,display_name,bio,avatar_url,created_at,show_activity,show_followers
from public.profiles;

revoke all on public.public_profiles from anon,authenticated;
grant select on public.public_profiles to anon,authenticated;
