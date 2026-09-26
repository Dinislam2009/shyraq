begin;

do $shyraq$
declare
  table_name text;
  policy_name text;
begin
  foreach table_name in array[
    '_prisma_migrations',
    'card_states',
    'flashcard_decks',
    'flashcard_reviews',
    'flashcards',
    'focus_sessions',
    'projects',
    'habits',
    'habit_completions',
    'tasks',
    'users',
    'sync_operations'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    for policy_name in
      select policyname
      from pg_policies
      where schemaname='public' and tablename=table_name
    loop
      execute format('drop policy if exists %I on public.%I', policy_name, table_name);
    end loop;
    execute format('drop policy if exists %I on public.%I', 'shyraq_legacy_deny_all', table_name);
    execute format(
      'create policy %I on public.%I for all to public using (false) with check (false)',
      'shyraq_legacy_deny_all',
      table_name
    );
  end loop;
end
$shyraq$;

commit;
