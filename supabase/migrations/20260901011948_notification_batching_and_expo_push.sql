-- Supports the designed notification set: type-aware push copy, light
-- batching for high-volume social types (post_like, cheer, pact activity),
-- and mobile push via Expo (separate from the existing VAPID web push
-- pipeline, which uses a completely different token format).

alter table notifications add column count int not null default 1;

create table expo_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  token text not null,
  created_at timestamptz not null default now(),
  unique (user_id, token)
);
alter table expo_push_tokens enable row level security;
create policy expo_push_tokens_own on expo_push_tokens
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Batches post_like/cheer/pact_joined/pact_post into one row instead of
-- one notification per event: if an unread notification of the same
-- type for the same recipient exists from the last 30 minutes, bump its
-- count and refresh its body/timestamp instead of inserting a new row
-- (which would also fire a duplicate push via the notify-push webhook).
create or replace function batch_notifications()
returns trigger as $$
declare
  existing record;
begin
  if new.type not in ('post_like', 'cheer', 'pact_joined', 'pact_post') then
    return new;
  end if;

  select * into existing
  from notifications
  where user_id = new.user_id
    and type = new.type
    and read = false
    and created_at > now() - interval '30 minutes'
  order by created_at desc
  limit 1;

  if existing.id is not null then
    update notifications
    set count = existing.count + 1,
        body = new.body,
        actor_id = new.actor_id,
        created_at = now()
    where id = existing.id;
    return null; -- cancel the new insert; the update above stands in for it
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger notifications_batch_check
before insert on notifications
for each row execute function batch_notifications();
