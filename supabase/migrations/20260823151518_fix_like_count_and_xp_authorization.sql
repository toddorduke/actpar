-- increment_post_likes/decrement_post_likes had no ownership check at all --
-- callable directly via RPC (/rest/v1/rpc/increment_post_likes) by any
-- authenticated user with an arbitrary post_id, completely decoupled from
-- whether they'd actually liked the post via the real post_likes table.
-- Anyone could inflate or zero out any post's displayed like count.
-- Replacing the free-standing RPCs with a trigger on post_likes itself
-- (mirrors the existing update_post_comments_count trigger already used
-- for comment counts) so the count can only move in lockstep with a real,
-- RLS-guarded like/unlike row -- post_likes already enforces
-- user_id = auth.uid() on both insert and delete.
create or replace function update_post_likes_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (TG_OP = 'INSERT') then
    if NEW.post_type = 'tribe' then
      update tribe_posts set likes = coalesce(likes, 0) + 1 where id = NEW.post_id;
    elsif NEW.post_type = 'pact' then
      update pact_posts set likes = coalesce(likes, 0) + 1 where id = NEW.post_id;
    end if;
    return NEW;
  elsif (TG_OP = 'DELETE') then
    if OLD.post_type = 'tribe' then
      update tribe_posts set likes = greatest(coalesce(likes, 0) - 1, 0) where id = OLD.post_id;
    elsif OLD.post_type = 'pact' then
      update pact_posts set likes = greatest(coalesce(likes, 0) - 1, 0) where id = OLD.post_id;
    end if;
    return OLD;
  end if;
  return null;
end;
$$;

create trigger post_likes_count_trigger
after insert or delete on post_likes
for each row execute function update_post_likes_count();

-- Drop the now-unused, unsafe RPCs -- the trigger replaces them and the
-- client no longer calls them (see usePostLikes.js).
drop function if exists increment_post_likes(uuid, text);
drop function if exists decrement_post_likes(uuid, text);

-- add_xp had the same gap: no check that the caller was awarding XP to
-- themselves, so any authenticated user could call
-- /rest/v1/rpc/add_xp with an arbitrary uid and inflate anyone's total.
-- Every real call site (client/src/lib/xp.js -> awardXP) always passes the
-- caller's own id, so restrict to self.
create or replace function add_xp(uid uuid, xp_amount integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if uid <> auth.uid() then
    return;
  end if;
  update profiles set total_xp = coalesce(total_xp, 0) + xp_amount where id = uid;
end;
$$;
