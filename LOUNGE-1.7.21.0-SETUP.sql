-- Luke & Beth's Household Lounge — Stage 1.0
-- Creates an isolated household chat table. Existing shopping, menu and calendar tables are untouched.

create table if not exists public.household_lounge_messages (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  message text not null check (char_length(message) between 1 and 1200),
  created_at timestamptz not null default now()
);

create index if not exists household_lounge_messages_household_created_idx
  on public.household_lounge_messages (household_id, created_at asc);

alter table public.household_lounge_messages enable row level security;

grant select, insert on public.household_lounge_messages to authenticated;

-- Members can read messages belonging to their own household.
drop policy if exists "Household members can read Lounge messages" on public.household_lounge_messages;
create policy "Household members can read Lounge messages"
  on public.household_lounge_messages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.household_members hm
      where hm.household_id = household_lounge_messages.household_id
        and hm.user_id = auth.uid()
    )
  );

-- A member can only send messages as themselves into their own household.
drop policy if exists "Household members can send Lounge messages" on public.household_lounge_messages;
create policy "Household members can send Lounge messages"
  on public.household_lounge_messages
  for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1
      from public.household_members hm
      where hm.household_id = household_lounge_messages.household_id
        and hm.user_id = auth.uid()
    )
  );

-- Enable Supabase Realtime for live messages (safe to run more than once).
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'household_lounge_messages'
  ) then
    alter publication supabase_realtime add table public.household_lounge_messages;
  end if;
end $$;
