-- Run in Supabase SQL Editor. Uses auth.uid() to isolate each user's data.
create table if not exists public.momentum_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{"days":{},"weeks":{}}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.momentum_data enable row level security;
revoke all on public.momentum_data from anon;
grant select, insert, update, delete on public.momentum_data to authenticated;
drop policy if exists "Read own momentum" on public.momentum_data;
drop policy if exists "Insert own momentum" on public.momentum_data;
drop policy if exists "Update own momentum" on public.momentum_data;
drop policy if exists "Delete own momentum" on public.momentum_data;
create policy "Read own momentum" on public.momentum_data for select to authenticated using ((select auth.uid()) = user_id);
create policy "Insert own momentum" on public.momentum_data for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own momentum" on public.momentum_data for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Delete own momentum" on public.momentum_data for delete to authenticated using ((select auth.uid()) = user_id);