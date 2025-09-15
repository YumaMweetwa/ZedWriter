-- ===========================
-- ZWRITE: FULL SCHEMA & RLS
-- Idempotent (safe to re-run)
-- ===========================

-- Extensions
create extension if not exists pgcrypto;

-- ========== PROFILES (Auth-linked) ==========
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  phone text,
  university text,
  avatar_url text,
  is_admin boolean default false,
  referral_code text unique,
  referred_by uuid references auth.users(id),
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;

-- Admin helper (create before policies that use it)
create or replace function public.is_admin()
returns boolean language sql stable as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

-- Auto-insert profile on new user
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Profile policies (after is_admin function is created)
do $$ begin
  begin
    create policy "profiles_select_own"
      on public.profiles for select to authenticated
      using (auth.uid() = id);
  exception when duplicate_object then null; end;

  begin
    create policy "profiles_update_own"
      on public.profiles for update to authenticated
      using (auth.uid() = id);
  exception when duplicate_object then null; end;

  -- Admin can read any profile (for admin tables)
  begin
    create policy "profiles_select_admin"
      on public.profiles for select to authenticated
      using (public.is_admin());
  exception when duplicate_object then null; end;
end $$;

-- ========== PROGRAMS (admin CRUD, users read) ==========
create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  name text not null,
  description text,
  is_active boolean default true,
  icon text,
  sort_order int,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);
alter table public.programs enable row level security;

do $$ begin
  begin
    create policy "programs_read_all"
      on public.programs for select to authenticated
      using (true);
  exception when duplicate_object then null; end;

  begin
    create policy "programs_admin_insert"
      on public.programs for insert to authenticated
      with check (public.is_admin());
  exception when duplicate_object then null; end;

  begin
    create policy "programs_admin_update"
      on public.programs for update to authenticated
      using (public.is_admin());
  exception when duplicate_object then null; end;

  begin
    create policy "programs_admin_delete"
      on public.programs for delete to authenticated
      using (public.is_admin());
  exception when duplicate_object then null; end;
end $$;

-- ========== MATERIALS (per program) with moderation ==========
create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users(id) on delete cascade,
  program_id uuid references public.programs(id),
  title text not null,
  description text,
  storage_path text unique,     -- e.g. '{userId}/filename.ext'
  mime text,
  size_bytes bigint,
  status text not null default 'pending' check (status in ('pending','approved','denied')),
  reviewed_by uuid references auth.users(id),
  review_note text,
  reviewed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.materials enable row level security;

create index if not exists idx_materials_program on public.materials(program_id);
create index if not exists idx_materials_status on public.materials(status);
create index if not exists idx_materials_owner on public.materials(owner);

do $$ begin
  begin
    create policy "materials_select_own_or_approved_or_admin"
      on public.materials for select to authenticated
      using (owner = auth.uid() or status = 'approved' or public.is_admin());
  exception when duplicate_object then null; end;

  begin
    create policy "materials_insert_owner"
      on public.materials for insert to authenticated
      with check (owner = auth.uid());
  exception when duplicate_object then null; end;

  begin
    create policy "materials_update_owner_pending_or_admin"
      on public.materials for update to authenticated
      using ((owner = auth.uid() and status = 'pending') or public.is_admin())
      with check ((owner = auth.uid() and status = 'pending') or public.is_admin());
  exception when duplicate_object then null; end;

  begin
    create policy "materials_delete_owner_pending_or_admin"
      on public.materials for delete to authenticated
      using ((owner = auth.uid() and status = 'pending') or public.is_admin());
  exception when duplicate_object then null; end;
end $$;

-- Storage bucket & RLS for materials
insert into storage.buckets (id, name, public)
values ('materials', 'materials', false)
on conflict (id) do nothing;

do $$
begin
  begin
    create policy "materials_objects_read_own"
      on storage.objects for select to authenticated
      using (bucket_id='materials' and substring(name from 1 for 36)=auth.uid()::text);
  exception when duplicate_object then null; end;

  begin
    create policy "materials_objects_write_own"
      on storage.objects for insert to authenticated
      with check (bucket_id='materials' and substring(name from 1 for 36)=auth.uid()::text);
  exception when duplicate_object then null; end;

  begin
    create policy "materials_objects_update_own"
      on storage.objects for update to authenticated
      using (bucket_id='materials' and substring(name from 1 for 36)=auth.uid()::text);
  exception when duplicate_object then null; end;

  begin
    create policy "materials_objects_delete_own"
      on storage.objects for delete to authenticated
      using (bucket_id='materials' and substring(name from 1 for 36)=auth.uid()::text);
  exception when duplicate_object then null; end;
end $$;

-- ========== SUBMISSIONS (user CRUD, admin manage) ==========
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('proposal','dissertation','assignment','data_collection','data_analysis','other')),
  title text,
  status text not null default 'pending' check (status in ('pending','in_progress','under_review','completed')),
  amount numeric(12,2),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.submissions enable row level security;

create index if not exists idx_submissions_status_created_at on public.submissions(status, created_at desc);
create index if not exists idx_submissions_owner_created_at on public.submissions(owner, created_at desc);

do $$ begin
  begin
    create policy "submissions_select_own_or_admin"
      on public.submissions for select to authenticated
      using (owner = auth.uid() or public.is_admin());
  exception when duplicate_object then null; end;

  begin
    create policy "submissions_insert_owner"
      on public.submissions for insert to authenticated
      with check (owner = auth.uid());
  exception when duplicate_object then null; end;

  begin
    create policy "submissions_update_owner_or_admin"
      on public.submissions for update to authenticated
      using (owner = auth.uid() or public.is_admin())
      with check (owner = auth.uid() or public.is_admin());
  exception when duplicate_object then null; end;

  begin
    create policy "submissions_delete_owner_unprocessed_or_admin"
      on public.submissions for delete to authenticated
      using ((owner = auth.uid() and status in ('pending','in_progress')) or public.is_admin());
  exception when duplicate_object then null; end;
end $$;

-- ========== ANNOUNCEMENTS (admin writes, everyone authed reads) ==========
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  audience text not null default 'all',
  published_at timestamptz default now(),
  created_by uuid references auth.users(id) on delete set null
);
alter table public.announcements enable row level security;
create index if not exists idx_ann_published_at on public.announcements(published_at desc);
create index if not exists idx_ann_audience on public.announcements(audience);

do $$ begin
  begin
    create policy "ann_read_all_authed"
      on public.announcements for select to authenticated
      using (true);
  exception when duplicate_object then null; end;

  begin
    create policy "ann_admin_insert"
      on public.announcements for insert to authenticated
      with check (public.is_admin());
  exception when duplicate_object then null; end;

  begin
    create policy "ann_admin_update"
      on public.announcements for update to authenticated
      using (public.is_admin());
  exception when duplicate_object then null; end;

  begin
    create policy "ann_admin_delete"
      on public.announcements for delete to authenticated
      using (public.is_admin());
  exception when duplicate_object then null; end;
end $$;

-- ========== SITE SETTINGS (JSON) ==========
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null
);
alter table public.site_settings enable row level security;

do $$ begin
  begin
    create policy "settings_read_all"
      on public.site_settings for select to authenticated
      using (true);
  exception when duplicate_object then null; end;

  begin
    create policy "settings_admin_insert"
      on public.site_settings for insert to authenticated
      with check (public.is_admin());
  exception when duplicate_object then null; end;

  begin
    create policy "settings_admin_update"
      on public.site_settings for update to authenticated
      using (public.is_admin());
  exception when duplicate_object then null; end;

  begin
    create policy "settings_admin_delete"
      on public.site_settings for delete to authenticated
      using (public.is_admin());
  exception when duplicate_object then null; end;
end $$;

-- Seed defaults once
insert into public.site_settings(key, value) values
  ('pricing', jsonb_build_object('proposal',500,'dissertation',1000,'data_analysis',400,'data_collection',400,'assignment',null,'currency','ZMW')),
  ('contact', jsonb_build_object('email','support@zwrite.org','phone','+260000000','whatsapp',null,'address',null))
on conflict (key) do nothing;

-- ========== REFERRALS (codes, rules, rewards, withdrawals) ==========
-- Code generation & sync
create or replace function public.gen_referral_code(u uuid)
returns text language sql immutable as
$$ select substring(encode(digest(u::text, 'sha256'), 'hex') from 1 for 8) $$;

create or replace function public.profile_set_referral_code()
returns trigger language plpgsql as $$
begin
  if new.referral_code is null then
    new.referral_code := public.gen_referral_code(new.id);
  end if;
  return new;
end $$;

drop trigger if exists trg_profiles_refcode on public.profiles;
create trigger trg_profiles_refcode
before insert on public.profiles
for each row execute function public.profile_set_referral_code();

create table if not exists public.ref_codes (
  code text primary key,
  owner uuid not null references auth.users(id) on delete cascade
);
alter table public.ref_codes enable row level security;

create or replace function public.sync_ref_code()
returns trigger language plpgsql as $$
begin
  insert into public.ref_codes(code, owner)
  values (new.referral_code, new.id)
  on conflict (code) do update set owner = excluded.owner;
  return new;
end $$;

drop trigger if exists trg_profiles_sync_refcode on public.profiles;
create trigger trg_profiles_sync_refcode
after insert or update of referral_code on public.profiles
for each row execute function public.sync_ref_code();

do $$ begin
  begin
    create policy "ref_codes_public_read"
      on public.ref_codes for select to anon, authenticated
      using (true);
  exception when duplicate_object then null; end;
end $$;

-- Rules & rewards
create table if not exists public.referral_point_rules (
  kind text primary key,
  points int not null
);
alter table public.referral_point_rules enable row level security;

do $$ begin
  begin
    create policy "rules_read_all_authed"
      on public.referral_point_rules for select to authenticated
      using (true);
  exception when duplicate_object then null; end;

  begin
    create policy "rules_admin_write"
      on public.referral_point_rules for insert to authenticated
      with check (public.is_admin());
  exception when duplicate_object then null; end;

  begin
    create policy "rules_admin_update"
      on public.referral_point_rules for update to authenticated
      using (public.is_admin());
  exception when duplicate_object then null; end;

  begin
    create policy "rules_admin_delete"
      on public.referral_point_rules for delete to authenticated
      using (public.is_admin());
  exception when duplicate_object then null; end;
end $$;

insert into public.referral_point_rules(kind, points) values
  ('signup', 2),
  ('proposal', 25),
  ('dissertation', 50),
  ('other', 0)
on conflict (kind) do nothing;

create table if not exists public.referral_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_user uuid references auth.users(id),
  event text not null check (event in ('signup','proposal','dissertation','other')),
  points int not null default 0,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
alter table public.referral_rewards enable row level security;

do $$ begin
  begin
    create policy "rewards_read_own"
      on public.referral_rewards for select to authenticated
      using (user_id = auth.uid());
  exception when duplicate_object then null; end;
end $$;

-- set referred_by once + award signup points
create or replace function public.set_referred_by_once(p_code text)
returns void language plpgsql security definer set search_path=public as $$
declare
  ref_owner uuid;
  pts int;
begin
  select owner into ref_owner from public.ref_codes where code = p_code;
  if ref_owner is null then raise exception 'Invalid referral code'; end if;
  if ref_owner = auth.uid() then raise exception 'Cannot refer yourself'; end if;

  update public.profiles
     set referred_by = ref_owner
   where id = auth.uid()
     and referred_by is null;
  if not found then raise exception 'Referral already set or user not found'; end if;

  select points into pts from public.referral_point_rules where kind='signup';
  insert into public.referral_rewards(user_id, source_user, event, points, meta)
  values (ref_owner, auth.uid(), 'signup', coalesce(pts,2), jsonb_build_object('note','signup bonus'));
end $$;

-- award points when submission is completed
create or replace function public.award_points_for_submission()
returns trigger language plpgsql security definer set search_path=public as $$
declare
  ref_owner uuid;
  pts int;
  kind_key text;
begin
  if new.status <> 'completed' or old.status = 'completed' then
    return new;
  end if;

  select referred_by into ref_owner from public.profiles where id = new.owner;
  if ref_owner is null then return new; end if;

  kind_key := case when new.kind in ('proposal','dissertation') then new.kind else 'other' end;
  select points into pts from public.referral_point_rules where kind = kind_key;
  pts := coalesce(pts,0);

  insert into public.referral_rewards(user_id, source_user, event, points, meta)
  values (ref_owner, new.owner, kind_key, pts, jsonb_build_object('submission_id', new.id));
  return new;
end $$;

drop trigger if exists trg_award_submission on public.submissions;
create trigger trg_award_submission
after update on public.submissions
for each row execute function public.award_points_for_submission();

-- withdrawals
create table if not exists public.referral_withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  points int not null,
  status text not null default 'requested' check (status in ('requested','approved','paid','rejected')),
  created_at timestamptz default now(),
  processed_at timestamptz
);
alter table public.referral_withdrawals enable row level security;

do $$ begin
  begin
    create policy "wd_read_own"
      on public.referral_withdrawals for select to authenticated
      using (user_id = auth.uid());
  exception when duplicate_object then null; end;

  begin
    create policy "wd_user_insert"
      on public.referral_withdrawals for insert to authenticated
      with check (user_id = auth.uid());
  exception when duplicate_object then null; end;

  begin
    create policy "wd_admin_update"
      on public.referral_withdrawals for update to authenticated
      using (public.is_admin());
  exception when duplicate_object then null; end;
end $$;

create or replace function public.available_points(u uuid)
returns int language sql stable as $$
  with r as (select coalesce(sum(points),0) as p from public.referral_rewards where user_id = u),
       w as (select coalesce(sum(points),0) as p from public.referral_withdrawals where user_id = u and status <> 'rejected')
  select (select p from r) - (select p from w)
$$;

create or replace function public.request_withdrawal(p_points int)
returns void language plpgsql security definer set search_path=public as $$
declare
  avail int;
begin
  if p_points is null or p_points < 200 then
    raise exception 'Minimum withdrawal is 200 points';
  end if;
  select public.available_points(auth.uid()) into avail;
  if avail < p_points then
    raise exception 'Insufficient points: available %', avail;
  end if;
  insert into public.referral_withdrawals(user_id, points) values (auth.uid(), p_points);
end $$;

-- ========== PAYMENTS (user logs, admin confirms) ==========
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null,
  currency text not null default 'ZMW',
  method text,
  reference text,
  status text not null default 'pending' check (status in ('pending','confirmed','failed')),
  meta jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.payments enable row level security;

do $$ begin
  begin
    create policy "payments_read_own_or_admin"
      on public.payments for select to authenticated
      using (user_id = auth.uid() or public.is_admin());
  exception when duplicate_object then null; end;

  begin
    create policy "payments_user_insert"
      on public.payments for insert to authenticated
      with check (user_id = auth.uid());
  exception when duplicate_object then null; end;

  begin
    create policy "payments_user_update_own_pending"
      on public.payments for update to authenticated
      using (user_id = auth.uid() and status='pending')
      with check (user_id = auth.uid() and status='pending');
  exception when duplicate_object then null; end;

  begin
    create policy "payments_admin_update_any"
      on public.payments for update to authenticated
      using (public.is_admin());
  exception when duplicate_object then null; end;
end $$;

-- ========== ADMIN RPCs ==========
create or replace function public.admin_review_material(p_material uuid, p_approve boolean, p_note text default null)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not public.is_admin() then raise exception 'Admin only'; end if;
  update public.materials
     set status = case when p_approve then 'approved' else 'denied' end,
         reviewed_by = auth.uid(),
         review_note = p_note,
         reviewed_at = now(),
         updated_at = now()
   where id = p_material;
  if not found then raise exception 'Material not found'; end if;
end $$;

create or replace function public.admin_update_setting(p_key text, p_value jsonb)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not public.is_admin() then raise exception 'Admin only'; end if;
  insert into public.site_settings(key, value) values (p_key, p_value)
  on conflict (key) do update set value = excluded.value;
end $$;

create or replace function public.admin_grant_custom_referral(p_user uuid, p_points int, p_reason text)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not public.is_admin() then raise exception 'Admin only'; end if;
  if p_points is null or p_points = 0 then raise exception 'Points must be non-zero'; end if;
  insert into public.referral_rewards(user_id, source_user, event, points, meta)
  values (p_user, auth.uid(), 'other', p_points, jsonb_build_object('reason', p_reason));
end $$;
