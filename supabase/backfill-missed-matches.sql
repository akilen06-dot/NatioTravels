-- Natio — one-time backfill for matches missed by the swipes RLS bug
--
-- Before this fix, a user could never see whether someone else had already
-- swiped right on them (RLS silently filtered those rows to nothing), so a
-- real mutual match could never be detected — even though both people's
-- individual "liked" swipe rows were saved correctly. This finds every pair
-- that already has reciprocal liked=true swipes and creates the match (and
-- conversation) they should have gotten at the time.
--
-- Run this ONCE in the SQL Editor, after applying the updated schema.sql.
-- Safe to run more than once — every insert here is a no-op for pairs that
-- already have a match.

insert into matches (user_a, user_b)
select least(a.swiper_id, a.target_id), greatest(a.swiper_id, a.target_id)
from swipes a
join swipes b on b.swiper_id = a.target_id and b.target_id = a.swiper_id
where a.liked = true and b.liked = true
on conflict (user_a, user_b) do nothing;

insert into conversations (user_a, user_b)
select m.user_a, m.user_b
from matches m
on conflict (user_a, user_b) do nothing;
