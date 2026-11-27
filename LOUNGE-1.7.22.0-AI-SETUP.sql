-- Luke & Beth's Household Lounge — Stage 2 AI migration
-- Run after the Stage 1 Lounge table has been created.
-- Adds character messages and a private server-side AI usage log.

alter table public.household_lounge_messages
  alter column sender_id drop not null;

alter table public.household_lounge_messages
  add column if not exists sender_type text not null default 'human',
  add column if not exists sender_name text;

update public.household_lounge_messages
set sender_type = 'human'
where sender_type is null;

alter table public.household_lounge_messages
  drop constraint if exists household_lounge_messages_sender_type_check;

alter table public.household_lounge_messages
  add constraint household_lounge_messages_sender_type_check
  check (sender_type in ('human', 'character'));

-- Keep human inserts restricted to the signed-in household member.
-- Character rows are inserted only by the Edge Function using the server secret key.
drop policy if exists "Household members can send Lounge messages"
  on public.household_lounge_messages;
create policy "Household members can send Lounge messages"
  on public.household_lounge_messages
  for insert to authenticated
  with check (
    sender_type = 'human'
    and sender_id = auth.uid()
    and sender_name is null
    and exists (
      select 1 from public.household_members hm
      where hm.household_id = household_lounge_messages.household_id
        and hm.user_id = auth.uid()
    )
  );

create table if not exists public.household_lounge_ai_usage (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists household_lounge_ai_usage_household_created_idx
  on public.household_lounge_ai_usage (household_id, created_at desc);

alter table public.household_lounge_ai_usage enable row level security;
revoke all on public.household_lounge_ai_usage from anon, authenticated;
grant all on public.household_lounge_ai_usage to service_role;
grant select, insert on public.household_lounge_messages to authenticated;
grant all on public.household_lounge_messages to service_role;
