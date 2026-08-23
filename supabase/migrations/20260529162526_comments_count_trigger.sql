-- Add comments_count to tribe_posts and keep it in sync via trigger

alter table tribe_posts add column if not exists comments_count int not null default 0;

-- Backfill existing counts
update tribe_posts tp
set comments_count = (
  select count(*) from post_comments pc where pc.post_id = tp.id
);

-- Trigger function
create or replace function update_post_comments_count()
returns trigger language plpgsql as $$
begin
  if (TG_OP = 'INSERT') then
    update tribe_posts set comments_count = comments_count + 1 where id = NEW.post_id;
  elsif (TG_OP = 'DELETE') then
    update tribe_posts set comments_count = greatest(comments_count - 1, 0) where id = OLD.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_post_comments_count on post_comments;
create trigger trg_post_comments_count
after insert or delete on post_comments
for each row execute function update_post_comments_count();
