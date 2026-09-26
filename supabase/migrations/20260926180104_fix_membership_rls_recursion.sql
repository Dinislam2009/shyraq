begin;

drop policy if exists deck_members_read on public.deck_members;
create policy deck_members_read on public.deck_members
for select to authenticated
using (private.is_workspace_member(workspace_id, 'viewer'));

drop policy if exists deck_members_admin_write on public.deck_members;
create policy deck_members_admin_write on public.deck_members
for insert to authenticated
with check (private.is_workspace_member(workspace_id, 'admin'));

drop policy if exists deck_members_admin_update on public.deck_members;
create policy deck_members_admin_update on public.deck_members
for update to authenticated
using (private.is_workspace_member(workspace_id, 'admin'))
with check (private.is_workspace_member(workspace_id, 'admin'));

drop policy if exists deck_members_admin_delete on public.deck_members;
create policy deck_members_admin_delete on public.deck_members
for delete to authenticated
using (private.is_workspace_member(workspace_id, 'admin'));

drop policy if exists collection_members_read on public.collection_members;
create policy collection_members_read on public.collection_members
for select to authenticated
using (private.is_workspace_member(workspace_id, 'viewer'));

drop policy if exists collection_members_admin_write on public.collection_members;
create policy collection_members_admin_write on public.collection_members
for insert to authenticated
with check (private.is_workspace_member(workspace_id, 'admin'));

drop policy if exists collection_members_admin_update on public.collection_members;
create policy collection_members_admin_update on public.collection_members
for update to authenticated
using (private.is_workspace_member(workspace_id, 'admin'))
with check (private.is_workspace_member(workspace_id, 'admin'));

drop policy if exists collection_members_admin_delete on public.collection_members;
create policy collection_members_admin_delete on public.collection_members
for delete to authenticated
using (private.is_workspace_member(workspace_id, 'admin'));

commit;
