-- increment_custom_category let a caller attribute a new category's
-- created_by to an arbitrary p_user_id. Both real call sites
-- (useCustomCategories.js) always pass the caller's own id. Milder than
-- the likes/XP issue (misattribution, not value manipulation) but same
-- fix.
create or replace function increment_custom_category(cat_name text, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare rec record;
begin
  if p_user_id <> auth.uid() then
    return;
  end if;

  select id, use_count, status into rec
  from custom_categories
  where lower(name) = lower(cat_name) and status != 'archived'
  limit 1;

  if rec.id is null then
    insert into custom_categories (name, use_count, status, created_by, last_used_at)
    values (cat_name, 1, 'pending', p_user_id, now());
  else
    update custom_categories set
      use_count    = rec.use_count + 1,
      last_used_at = now(),
      status       = case when rec.use_count + 1 >= 3 and rec.status = 'pending'
                     then 'active' else rec.status end
    where id = rec.id;
  end if;
end;
$function$
