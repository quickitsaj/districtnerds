-- RSVP table for AJ's Annual Quest.
-- Run this in the Supabase SQL editor (or `supabase db push`) for whichever
-- project will hold the responses, then put the project's URL and anon key in
-- js/config.js under rsvp.supabase.

create table if not exists public.rsvps (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null check (char_length(name) between 1 and 120),
  email       text not null check (char_length(email) between 3 and 200),
  attendance  text not null check (attendance in ('in_person', 'online', 'watching')),
  guests      smallint not null default 0 check (guests between 0 and 10),
  events      text[] not null default '{}' check (cardinality(events) <= 10),
  friend_code text check (char_length(friend_code) <= 20),
  discord     text check (char_length(discord) <= 60),
  dietary     text check (char_length(dietary) <= 200),
  camera_ok   text check (camera_ok in ('yes', 'no')),
  note        text check (char_length(note) <= 1000),
  user_agent  text check (char_length(user_agent) <= 200)
);

comment on table public.rsvps is 'Public RSVP submissions from districtnerds.com';

-- The website only ever INSERTS with the anon key. Nobody can read, update or
-- delete through the API without the service role, so responses are only
-- visible in the Supabase dashboard (Table Editor → rsvps → Export CSV).
alter table public.rsvps enable row level security;

drop policy if exists "anyone can rsvp" on public.rsvps;
create policy "anyone can rsvp"
  on public.rsvps for insert
  to anon
  with check (true);

-- Belt and braces: anon can insert and nothing else.
revoke all on public.rsvps from anon;
grant insert on public.rsvps to anon;

-- Handy view for the host: newest first, events as a readable list.
create or replace view public.rsvp_summary
  with (security_invoker = true) as
  select created_at, name, email, attendance, guests, array_to_string(events, ', ') as events,
         friend_code, discord, dietary, camera_ok, note
  from public.rsvps
  order by created_at desc;
