-- Natio — Supabase schema (Phase 1)
-- Run this once in your project's SQL editor (Dashboard → SQL Editor → New query),
-- then optionally run `node supabase/seed.mjs` for demo data. See SETUP.md.

-- ============================================================================
-- profiles — one row per user, keyed to auth.users. Mirrors the shape of
-- `currentUser` in src/lib/store.js so the frontend rewrite is a near 1:1 map.
-- ============================================================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  username text unique not null,
  dob date,
  country text,
  city text,
  photo_url text,
  bio text default '',
  verified boolean not null default true,
  plan text check (plan in ('trip', 'subscription')),
  billing text check (billing in ('monthly', 'annual')),
  trip_start date,
  trip_end date,
  private boolean not null default false,
  language text not null default 'en',
  notification_prefs jsonb not null default '{"matches":true,"messages":true,"groupActivity":true,"meetupReminders":true,"marketing":false}',
  device_permissions jsonb not null default '{"location":true,"camera":true,"notifications":true}',
  ad_preferences jsonb not null default '{"personalized":true}',
  -- Unused now that billing runs on Paddle instead of Stripe — kept rather
  -- than dropped so no data is lost if any project still has values here.
  stripe_customer_id text,
  stripe_subscription_id text,
  paddle_customer_id text,
  paddle_subscription_id text,
  -- True only for rows created by supabase/seed.mjs. Lets you tell demo
  -- profiles apart from real signups, and bulk-delete them before a real
  -- launch — see supabase/cleanup-seed-data.sql.
  is_seed_data boolean not null default false,
  -- Fuzzed coordinates only (see src/lib/geocode.js) — never store exact GPS.
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now()
);

-- If `profiles` already existed from an earlier run of this script (before
-- is_seed_data was added), `create table if not exists` above silently skips
-- it — this backfills the column either way, safely, every time.
alter table profiles add column if not exists is_seed_data boolean not null default false;
alter table profiles add column if not exists paddle_customer_id text;
alter table profiles add column if not exists paddle_subscription_id text;

-- ============================================================================
-- Swiping / matching
-- ============================================================================
create table if not exists swipes (
  swiper_id uuid not null references profiles(id) on delete cascade,
  target_id uuid not null references profiles(id) on delete cascade,
  liked boolean not null,
  created_at timestamptz not null default now(),
  primary key (swiper_id, target_id)
);

-- Written by the app layer once both directions of a swipe are "liked".
-- user_a/user_b are stored with user_a < user_b so a pair only ever has one row.
create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references profiles(id) on delete cascade,
  user_b uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_a, user_b)
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references profiles(id) on delete cascade,
  user_b uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_a, user_b)
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

-- A message can now be an attachment with no caption, so `text` needs to be
-- allowed empty. Same "create table if not exists doesn't add columns"
-- situation as profiles.is_seed_data above — these run safely every time.
alter table messages alter column text drop not null;
alter table messages add column if not exists attachment_url text;
alter table messages add column if not exists attachment_type text check (attachment_type in ('image', 'file'));
alter table messages add column if not exists attachment_name text;

-- ============================================================================
-- Groups
-- ============================================================================
create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  nationality text not null,
  city text,
  date date,
  description text default '',
  owner_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists group_members (
  group_id uuid not null references groups(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists group_join_requests (
  group_id uuid not null references groups(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  requested_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists group_ratings (
  group_id uuid not null references groups(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text default '',
  created_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- ============================================================================
-- Posts (profile photo grid)
-- ============================================================================
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id) on delete cascade,
  photo_url text not null,
  caption text default '',
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists post_likes (
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  primary key (post_id, user_id)
);

create table if not exists post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Safety: blocking & reporting
-- ============================================================================
create table if not exists blocks (
  blocker_id uuid not null references profiles(id) on delete cascade,
  blocked_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles(id) on delete cascade,
  target_id uuid not null references profiles(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now()
);

-- Free-text detail the reporter can optionally add alongside the reason
-- category. `create table if not exists` above won't add this to a table
-- that already existed from an earlier run — same situation as
-- profiles.is_seed_data, so backfilled explicitly here.
alter table reports add column if not exists details text;

-- ============================================================================
-- Notifications — "X liked your post", "X swiped right on you", "X sent you
-- a message". Written by the app layer at the same time as the action that
-- causes it (a post like, a right-swipe, a message) rather than a trigger,
-- same "service-role-free" pattern as matches/conversations above.
-- ============================================================================
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade, -- recipient
  actor_id uuid not null references profiles(id) on delete cascade, -- who did it
  type text not null check (type in ('post_like', 'swipe_like', 'message')),
  post_id uuid references posts(id) on delete cascade,
  conversation_id uuid references conversations(id) on delete cascade,
  preview text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Lets the signup form check username availability before an account exists
-- (RLS below requires auth, so an anonymous visitor can't query `profiles`
-- directly). SECURITY DEFINER exposes only this yes/no answer, nothing else.
create or replace function is_username_taken(check_username text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles where lower(username) = lower(check_username)
  );
$$;

grant execute on function is_username_taken(text) to anon, authenticated;

-- Lets sign-in accept a username instead of an email: resolves it to the
-- account's email first, then that email is used with the normal password
-- sign-in. Same reasoning as is_username_taken above — an anonymous visitor
-- can't query `profiles` directly, and usernames are already shown publicly
-- as @handles throughout the app, so revealing this mapping isn't new exposure.
create or replace function email_for_username(check_username text)
returns text
language sql
security definer
set search_path = public
as $$
  select email from profiles where lower(username) = lower(check_username) limit 1;
$$;

grant execute on function email_for_username(text) to anon, authenticated;

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table profiles enable row level security;
alter table swipes enable row level security;
alter table matches enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table group_join_requests enable row level security;
alter table group_ratings enable row level security;
alter table posts enable row level security;
alter table post_likes enable row level security;
alter table post_comments enable row level security;
alter table blocks enable row level security;
alter table reports enable row level security;
alter table notifications enable row level security;

-- Every policy below is preceded by a `drop policy if exists` so this whole
-- script can be re-run safely (e.g. after pulling a schema update) without
-- the "policy already exists" error Postgres otherwise throws.

-- profiles: anyone signed in can read public profile fields; you can only write your own row.
drop policy if exists "profiles are readable by any signed-in user" on profiles;
create policy "profiles are readable by any signed-in user" on profiles
  for select using (auth.role() = 'authenticated');
drop policy if exists "users can insert their own profile" on profiles;
create policy "users can insert their own profile" on profiles
  for insert with check (auth.uid() = id);
drop policy if exists "users can update their own profile" on profiles;
create policy "users can update their own profile" on profiles
  for update using (auth.uid() = id);
drop policy if exists "users can delete their own profile" on profiles;
create policy "users can delete their own profile" on profiles
  for delete using (auth.uid() = id);

-- swipes: you can only ever create/change your own swipe, but you can READ
-- any row where you're the target too — the app needs that to detect a
-- mutual match ("did this person already swipe right on me"). Without this,
-- a match could never be detected: the second swiper's reciprocity check
-- would be silently filtered to zero rows by RLS.
drop policy if exists "users manage their own swipes" on swipes;
drop policy if exists "users can read swipes involving them" on swipes;
create policy "users can read swipes involving them" on swipes
  for select using (auth.uid() = swiper_id or auth.uid() = target_id);
drop policy if exists "users can create their own swipes" on swipes;
create policy "users can create their own swipes" on swipes
  for insert with check (auth.uid() = swiper_id);
drop policy if exists "users can update their own swipes" on swipes;
create policy "users can update their own swipes" on swipes
  for update using (auth.uid() = swiper_id) with check (auth.uid() = swiper_id);
drop policy if exists "users can delete their own swipes" on swipes;
create policy "users can delete their own swipes" on swipes
  for delete using (auth.uid() = swiper_id);

-- matches: visible to either participant; created by the app layer (service-role-free,
-- both rows already validated via the swipes policy above).
drop policy if exists "participants can read their matches" on matches;
create policy "participants can read their matches" on matches
  for select using (auth.uid() = user_a or auth.uid() = user_b);
drop policy if exists "participants can create a match" on matches;
create policy "participants can create a match" on matches
  for insert with check (auth.uid() = user_a or auth.uid() = user_b);

-- conversations & messages: only the two participants.
drop policy if exists "participants can read their conversations" on conversations;
create policy "participants can read their conversations" on conversations
  for select using (auth.uid() = user_a or auth.uid() = user_b);
drop policy if exists "participants can create a conversation" on conversations;
create policy "participants can create a conversation" on conversations
  for insert with check (auth.uid() = user_a or auth.uid() = user_b);
drop policy if exists "participants can read messages" on messages;
create policy "participants can read messages" on messages
  for select using (
    exists (
      select 1 from conversations c
      where c.id = conversation_id and (auth.uid() = c.user_a or auth.uid() = c.user_b)
    )
  );
drop policy if exists "participants can send messages" on messages;
create policy "participants can send messages" on messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from conversations c
      where c.id = conversation_id and (auth.uid() = c.user_a or auth.uid() = c.user_b)
    )
  );

-- groups: readable by anyone signed in; only the owner can edit/delete.
drop policy if exists "groups are readable by any signed-in user" on groups;
create policy "groups are readable by any signed-in user" on groups
  for select using (auth.role() = 'authenticated');
drop policy if exists "owner can create a group" on groups;
create policy "owner can create a group" on groups
  for insert with check (auth.uid() = owner_id);
drop policy if exists "owner can update or delete their group" on groups;
create policy "owner can update or delete their group" on groups
  for update using (auth.uid() = owner_id);
drop policy if exists "owner can delete their group" on groups;
create policy "owner can delete their group" on groups
  for delete using (auth.uid() = owner_id);

-- group_members: readable by anyone signed in; the owner can remove members,
-- members can remove themselves (leave), owner-driven inserts happen via accept-request.
drop policy if exists "group members are readable by any signed-in user" on group_members;
create policy "group members are readable by any signed-in user" on group_members
  for select using (auth.role() = 'authenticated');
drop policy if exists "owner can add members" on group_members;
create policy "owner can add members" on group_members
  for insert with check (
    exists (select 1 from groups g where g.id = group_id and g.owner_id = auth.uid())
  );
drop policy if exists "owner or the member themselves can remove a membership" on group_members;
create policy "owner or the member themselves can remove a membership" on group_members
  for delete using (
    auth.uid() = user_id
    or exists (select 1 from groups g where g.id = group_id and g.owner_id = auth.uid())
  );

-- group_join_requests: readable by anyone signed in (so the requester list renders);
-- a user can request to join for themselves; owner or requester can remove the request.
drop policy if exists "join requests are readable by any signed-in user" on group_join_requests;
create policy "join requests are readable by any signed-in user" on group_join_requests
  for select using (auth.role() = 'authenticated');
drop policy if exists "users can request to join for themselves" on group_join_requests;
create policy "users can request to join for themselves" on group_join_requests
  for insert with check (auth.uid() = user_id);
drop policy if exists "owner or requester can remove a join request" on group_join_requests;
create policy "owner or requester can remove a join request" on group_join_requests
  for delete using (
    auth.uid() = user_id
    or exists (select 1 from groups g where g.id = group_id and g.owner_id = auth.uid())
  );

-- group_ratings: readable by anyone signed in; a user can only write their own rating.
drop policy if exists "ratings are readable by any signed-in user" on group_ratings;
create policy "ratings are readable by any signed-in user" on group_ratings
  for select using (auth.role() = 'authenticated');
drop policy if exists "users can rate for themselves" on group_ratings;
create policy "users can rate for themselves" on group_ratings
  for insert with check (auth.uid() = user_id);
drop policy if exists "users can update their own rating" on group_ratings;
create policy "users can update their own rating" on group_ratings
  for update using (auth.uid() = user_id);

-- posts: readable by anyone signed in; only the author can write/delete.
drop policy if exists "posts are readable by any signed-in user" on posts;
create policy "posts are readable by any signed-in user" on posts
  for select using (auth.role() = 'authenticated');
drop policy if exists "author can create a post" on posts;
create policy "author can create a post" on posts
  for insert with check (auth.uid() = author_id);
drop policy if exists "author can update their post" on posts;
create policy "author can update their post" on posts
  for update using (auth.uid() = author_id);
drop policy if exists "author can delete their post" on posts;
create policy "author can delete their post" on posts
  for delete using (auth.uid() = author_id);

-- post_likes: readable by anyone signed in; a user can only like/unlike for themselves.
drop policy if exists "likes are readable by any signed-in user" on post_likes;
create policy "likes are readable by any signed-in user" on post_likes
  for select using (auth.role() = 'authenticated');
drop policy if exists "users can like for themselves" on post_likes;
create policy "users can like for themselves" on post_likes
  for insert with check (auth.uid() = user_id);
drop policy if exists "users can remove their own like" on post_likes;
create policy "users can remove their own like" on post_likes
  for delete using (auth.uid() = user_id);

-- post_comments: readable by anyone signed in; a user can only write their own comment.
drop policy if exists "comments are readable by any signed-in user" on post_comments;
create policy "comments are readable by any signed-in user" on post_comments
  for select using (auth.role() = 'authenticated');
drop policy if exists "users can comment for themselves" on post_comments;
create policy "users can comment for themselves" on post_comments
  for insert with check (auth.uid() = author_id);

-- blocks & reports: fully private to the user who created them.
drop policy if exists "users manage their own blocks" on blocks;
create policy "users manage their own blocks" on blocks
  for all using (auth.uid() = blocker_id) with check (auth.uid() = blocker_id);
drop policy if exists "users manage their own reports" on reports;
create policy "users manage their own reports" on reports
  for all using (auth.uid() = reporter_id) with check (auth.uid() = reporter_id);

-- notifications: you can only read/update(mark read)/delete your own; anyone
-- signed in can create one addressed to someone else (as themselves), same
-- as how matches/conversations get created client-side.
drop policy if exists "users can read their own notifications" on notifications;
create policy "users can read their own notifications" on notifications
  for select using (auth.uid() = user_id);
drop policy if exists "users can create notifications for others" on notifications;
create policy "users can create notifications for others" on notifications
  for insert with check (auth.uid() = actor_id);
drop policy if exists "users can update their own notifications" on notifications;
create policy "users can update their own notifications" on notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "users can delete their own notifications" on notifications;
create policy "users can delete their own notifications" on notifications
  for delete using (auth.uid() = user_id);

-- Realtime: lets the app get a live push the moment a notification row is
-- inserted (so a "someone messaged you" toast can pop up without polling).
-- Idempotent — ALTER PUBLICATION has no "ADD TABLE IF NOT EXISTS", so check first.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table notifications;
  end if;
end $$;

-- ============================================================================
-- Rate limiting — enforced here rather than in the app, so it can't be
-- bypassed by calling the API directly instead of going through the UI.
-- Thresholds are deliberately generous: no real person doing normal things
-- should ever hit these, they're aimed at scripted spam/abuse. Sign-up rate
-- limiting is separate — see Authentication -> Rate Limits in the dashboard.
-- ============================================================================
create or replace function limit_messages_rate()
returns trigger
language plpgsql
as $$
begin
  if (
    select count(*) from messages
    where sender_id = new.sender_id and created_at > now() - interval '1 minute'
  ) >= 30 then
    raise exception 'Too many messages sent. Please wait a moment and try again.';
  end if;
  return new;
end;
$$;

drop trigger if exists messages_rate_limit on messages;
create trigger messages_rate_limit
  before insert on messages
  for each row execute function limit_messages_rate();

create or replace function limit_swipes_rate()
returns trigger
language plpgsql
as $$
begin
  if (
    select count(*) from swipes
    where swiper_id = new.swiper_id and created_at > now() - interval '1 minute'
  ) >= 100 then
    raise exception 'Too many swipes. Please wait a moment and try again.';
  end if;
  return new;
end;
$$;

drop trigger if exists swipes_rate_limit on swipes;
create trigger swipes_rate_limit
  before insert on swipes
  for each row execute function limit_swipes_rate();

create or replace function limit_reports_rate()
returns trigger
language plpgsql
as $$
begin
  if (
    select count(*) from reports
    where reporter_id = new.reporter_id and created_at > now() - interval '1 hour'
  ) >= 10 then
    raise exception 'Too many reports submitted. Please wait before submitting more.';
  end if;
  return new;
end;
$$;

drop trigger if exists reports_rate_limit on reports;
create trigger reports_rate_limit
  before insert on reports
  for each row execute function limit_reports_rate();

create or replace function limit_post_comments_rate()
returns trigger
language plpgsql
as $$
begin
  if (
    select count(*) from post_comments
    where author_id = new.author_id and created_at > now() - interval '1 minute'
  ) >= 20 then
    raise exception 'Too many comments. Please wait a moment and try again.';
  end if;
  return new;
end;
$$;

drop trigger if exists post_comments_rate_limit on post_comments;
create trigger post_comments_rate_limit
  before insert on post_comments
  for each row execute function limit_post_comments_rate();

create or replace function limit_posts_rate()
returns trigger
language plpgsql
as $$
begin
  if (
    select count(*) from posts
    where author_id = new.author_id and created_at > now() - interval '1 hour'
  ) >= 10 then
    raise exception 'Too many posts created. Please wait before posting again.';
  end if;
  return new;
end;
$$;

drop trigger if exists posts_rate_limit on posts;
create trigger posts_rate_limit
  before insert on posts
  for each row execute function limit_posts_rate();
