-- ============================================================
-- Circl Chat — Supabase schema (re-runnable, safe to re-execute)
-- Run this in your Supabase project SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. PROFILES table
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  created_at timestamptz default now(),
  last_seen_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Drop old policies first so re-running this is safe
drop policy if exists "Profiles are viewable by authenticated users" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

-- Any logged-in user can see all profiles (needed for user directory)
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

-- A user can only insert their own profile row
create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- A user can only update their own profile row
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);


-- 2. MESSAGES table
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references public.profiles (id) on delete cascade not null,
  receiver_id uuid references public.profiles (id) on delete cascade not null,
  content text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.messages enable row level security;

-- Drop old policies first
drop policy if exists "Users can read their own conversations" on public.messages;
drop policy if exists "Users can send messages as themselves" on public.messages;
drop policy if exists "Users can delete their own messages" on public.messages;
drop policy if exists "Users can update read status" on public.messages;

-- Read: sender or receiver
create policy "Users can read their own conversations"
  on public.messages for select
  to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Insert: only as yourself
create policy "Users can send messages as themselves"
  on public.messages for insert
  to authenticated
  with check (auth.uid() = sender_id);

-- Delete: sender OR receiver can delete (needed for "delete for everyone")
create policy "Users can delete their own messages"
  on public.messages for delete
  to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Update: receiver can mark messages as read
create policy "Users can update read status"
  on public.messages for update
  to authenticated
  using (auth.uid() = receiver_id or auth.uid() = sender_id);


-- 3. Enable Realtime (safe to re-run — ignores if already added)
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when others then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.profiles;
exception when others then null;
end $$;


-- 4. Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
