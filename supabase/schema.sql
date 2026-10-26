-- ============================================================
-- Seva Parivartan – Simple Schema (Teaching Only)
-- Run this once in your Supabase SQL Editor
-- ============================================================

-- ── 1. PROFILES ──────────────────────────────────────────────
-- One row per user. Stores all transfer info.
create table if not exists profiles (
  id            uuid primary key references auth.users on delete cascade,
  full_name     text not null default '',
  mobile        text default '',
  designation   text check (designation in ('PGT', 'TGT', 'PRT', 'Lecturer')),
  current_dist  text default '',   -- where they are posted now
  desired_dist  text default '',   -- where they want to go
  is_active     boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Row Level Security
alter table profiles enable row level security;

create policy "Anyone logged in can read all active profiles"
  on profiles for select
  using (auth.role() = 'authenticated' and is_active = true);

create policy "User can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "User can update their own profile"
  on profiles for update
  using (auth.uid() = id);


-- ── 2. CONNECTIONS ─────────────────────────────────────────
-- A transfer request from one teacher to another matched teacher.
create table if not exists connections (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references profiles(id) on delete cascade,
  target_id     uuid not null references profiles(id) on delete cascade,
  message       text default '',
  status        text not null default 'pending'
                  check (status in ('pending', 'accepted', 'rejected')),
  created_at    timestamptz default now(),
  unique(requester_id, target_id)
);

alter table connections enable row level security;

create policy "Users see their own connections"
  on connections for select
  using (auth.uid() = requester_id or auth.uid() = target_id);

create policy "User can send a connection"
  on connections for insert
  with check (auth.uid() = requester_id);

create policy "Target can accept or reject"
  on connections for update
  using (auth.uid() = target_id or auth.uid() = requester_id);
