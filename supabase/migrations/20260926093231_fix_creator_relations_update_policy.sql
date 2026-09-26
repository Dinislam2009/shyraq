drop policy if exists creator_relations_update on public.creator_relations;
create policy creator_relations_update
on public.creator_relations
for update
to authenticated
using (user_id=(select auth.uid()))
with check (user_id=(select auth.uid()) and creator_id<>(select auth.uid()));
