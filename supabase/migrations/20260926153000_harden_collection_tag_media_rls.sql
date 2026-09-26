-- Secondary RLS hardening: remove remaining helper-based collection/tag/media policies.
-- Direct membership checks match the working deck/card policies and avoid helper-policy failures.

drop policy if exists tags_member on public.tags;
create policy tags_member on public.tags for all to authenticated
using (exists (
  select 1 from public.workspace_members wm
  where wm.workspace_id=tags.workspace_id
    and wm.user_id=(select auth.uid())
    and wm.role in ('owner','admin','editor')
))
with check (exists (
  select 1 from public.workspace_members wm
  where wm.workspace_id=tags.workspace_id
    and wm.user_id=(select auth.uid())
    and wm.role in ('owner','admin','editor')
));

drop policy if exists card_tags_member on public.card_tags;
create policy card_tags_member on public.card_tags for all to authenticated
using (exists (
  select 1
  from public.cards c
  join public.decks d on d.id=c.deck_id
  join public.workspace_members wm on wm.workspace_id=d.workspace_id
  where c.id=card_tags.card_id
    and wm.user_id=(select auth.uid())
    and wm.role in ('owner','admin','editor')
))
with check (exists (
  select 1
  from public.cards c
  join public.decks d on d.id=c.deck_id
  join public.workspace_members wm on wm.workspace_id=d.workspace_id
  where c.id=card_tags.card_id
    and wm.user_id=(select auth.uid())
    and wm.role in ('owner','admin','editor')
));

drop policy if exists collections_read on public.collections;
create policy collections_read on public.collections for select to authenticated
using (
  is_public
  or exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id=collections.workspace_id
      and wm.user_id=(select auth.uid())
      and wm.role in ('owner','admin','editor','reviewer','viewer')
  )
  or exists (
    select 1 from public.collection_members cm
    where cm.collection_id=collections.id
      and cm.user_id=(select auth.uid())
      and cm.role in ('viewer','commenter','editor')
  )
);

drop policy if exists collections_write on public.collections;
create policy collections_write on public.collections for insert to authenticated
with check (
  owner_id=(select auth.uid())
  and exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id=collections.workspace_id
      and wm.user_id=(select auth.uid())
      and wm.role in ('owner','admin','editor')
  )
);

drop policy if exists collections_update on public.collections;
create policy collections_update on public.collections for update to authenticated
using (
  (owner_id=(select auth.uid()) and exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id=collections.workspace_id
      and wm.user_id=(select auth.uid())
      and wm.role in ('owner','admin','editor')
  ))
  or exists (
    select 1 from public.collection_members cm
    where cm.collection_id=collections.id
      and cm.user_id=(select auth.uid())
      and cm.role='editor'
  )
)
with check (
  (owner_id=(select auth.uid()) and exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id=collections.workspace_id
      and wm.user_id=(select auth.uid())
      and wm.role in ('owner','admin','editor')
  ))
  or exists (
    select 1 from public.collection_members cm
    where cm.collection_id=collections.id
      and cm.user_id=(select auth.uid())
      and cm.role='editor'
  )
);

drop policy if exists collections_delete on public.collections;
create policy collections_delete on public.collections for delete to authenticated
using (
  owner_id=(select auth.uid())
  and exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id=collections.workspace_id
      and wm.user_id=(select auth.uid())
      and wm.role in ('owner','admin','editor')
  )
);

drop policy if exists collection_cards_select on public.collection_cards;
create policy collection_cards_select on public.collection_cards for select to anon,authenticated
using (exists (
  select 1 from public.collections c
  where c.id=collection_cards.collection_id
    and (
      c.is_public
      or exists (
        select 1 from public.workspace_members wm
        where wm.workspace_id=c.workspace_id
          and wm.user_id=(select auth.uid())
          and wm.role in ('owner','admin','editor','reviewer','viewer')
      )
      or exists (
        select 1 from public.collection_members cm
        where cm.collection_id=c.id
          and cm.user_id=(select auth.uid())
          and cm.role in ('viewer','commenter','editor')
      )
    )
));

drop policy if exists collection_cards_write on public.collection_cards;
create policy collection_cards_write on public.collection_cards for insert to authenticated
with check (exists (
  select 1 from public.collections c
  where c.id=collection_cards.collection_id
    and (
      exists (
        select 1 from public.workspace_members wm
        where wm.workspace_id=c.workspace_id
          and wm.user_id=(select auth.uid())
          and wm.role in ('owner','admin','editor')
      )
      or exists (
        select 1 from public.collection_members cm
        where cm.collection_id=c.id
          and cm.user_id=(select auth.uid())
          and cm.role='editor'
      )
    )
));

drop policy if exists collection_cards_update on public.collection_cards;
create policy collection_cards_update on public.collection_cards for update to authenticated
using (exists (
  select 1 from public.collections c
  where c.id=collection_cards.collection_id
    and (
      exists (
        select 1 from public.workspace_members wm
        where wm.workspace_id=c.workspace_id
          and wm.user_id=(select auth.uid())
          and wm.role in ('owner','admin','editor')
      )
      or exists (
        select 1 from public.collection_members cm
        where cm.collection_id=c.id
          and cm.user_id=(select auth.uid())
          and cm.role='editor'
      )
    )
))
with check (exists (
  select 1 from public.collections c
  where c.id=collection_cards.collection_id
    and (
      exists (
        select 1 from public.workspace_members wm
        where wm.workspace_id=c.workspace_id
          and wm.user_id=(select auth.uid())
          and wm.role in ('owner','admin','editor')
      )
      or exists (
        select 1 from public.collection_members cm
        where cm.collection_id=c.id
          and cm.user_id=(select auth.uid())
          and cm.role='editor'
      )
    )
));

drop policy if exists collection_cards_delete on public.collection_cards;
create policy collection_cards_delete on public.collection_cards for delete to authenticated
using (exists (
  select 1 from public.collections c
  where c.id=collection_cards.collection_id
    and (
      exists (
        select 1 from public.workspace_members wm
        where wm.workspace_id=c.workspace_id
          and wm.user_id=(select auth.uid())
          and wm.role in ('owner','admin','editor')
      )
      or exists (
        select 1 from public.collection_members cm
        where cm.collection_id=c.id
          and cm.user_id=(select auth.uid())
          and cm.role='editor'
      )
    )
));

drop policy if exists media_read on public.media;
create policy media_read on public.media for select to authenticated
using (
  owner_id=(select auth.uid())
  or exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id=media.workspace_id
      and wm.user_id=(select auth.uid())
      and wm.role in ('owner','admin','editor','reviewer','viewer')
  )
);

drop policy if exists media_insert on public.media;
create policy media_insert on public.media for insert to authenticated
with check (
  owner_id=(select auth.uid())
  and exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id=media.workspace_id
      and wm.user_id=(select auth.uid())
      and wm.role in ('owner','admin','editor')
  )
);

drop policy if exists media_update on public.media;
create policy media_update on public.media for update to authenticated
using (
  owner_id=(select auth.uid())
  and exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id=media.workspace_id
      and wm.user_id=(select auth.uid())
      and wm.role in ('owner','admin','editor')
  )
)
with check (
  owner_id=(select auth.uid())
  and exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id=media.workspace_id
      and wm.user_id=(select auth.uid())
      and wm.role in ('owner','admin','editor')
  )
);

drop policy if exists media_delete on public.media;
create policy media_delete on public.media for delete to authenticated
using (
  owner_id=(select auth.uid())
  and exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id=media.workspace_id
      and wm.user_id=(select auth.uid())
      and wm.role in ('owner','admin','editor')
  )
);
