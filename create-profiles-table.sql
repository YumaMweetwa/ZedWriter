-- Create profiles table + RLS policies
-- Run this in your Supabase SQL Editor

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name  text,
  phone      text,
  school     text,
  student_id text,
  created_at timestamp default now()
);

alter table profiles enable row level security;

-- read own
create policy "read own profile"
on profiles for select
using (id = auth.uid());

-- insert own
create policy "insert own profile"
on profiles for insert
with check (id = auth.uid());

-- update own
create policy "update own profile"
on profiles for update
using (id = auth.uid());