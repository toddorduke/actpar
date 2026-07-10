-- profiles.working_on was referenced by Onboarding and Settings (write + filter)
-- but the column never existed, so every update() call that included it failed
-- outright (Postgres rejects the whole statement on an unknown column) -- silently
-- breaking the main Settings "Save Profile" button for every user.
alter table profiles add column if not exists working_on text[] not null default '{}';
