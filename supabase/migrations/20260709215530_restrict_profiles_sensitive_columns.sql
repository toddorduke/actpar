-- profiles RLS granted SELECT qual:true to anon/authenticated, but table-wide
-- grants meant that also covered every column, including stripe_customer_id
-- (Stripe billing identifier, server-only in stripe-webhook) and phone (dead,
-- unused anywhere in the client). A column-only REVOKE has no effect on top
-- of a table-wide GRANT in Postgres, so the table-wide SELECT must be revoked
-- and re-granted on the explicit safe column list instead.
revoke select on profiles from anon, authenticated;
grant select (
  id, first_name, last_name, alter_ego_name, city, account_type, gender, age,
  avatar_url, bio, created_at, tagline, onboarding_complete, reflection_questions,
  looking_for, working_on, affirmation_start_date, notification_prefs,
  coach_specialty, coach_tagline, coach_rate, coach_rate_num, coach_experience,
  coach_clients_helped, coach_session_types, coach_tags, coach_bio, coach_verified,
  coach_credentials, coach_links, coach_philosophy, coach_values, coach_testimonials,
  coach_sessions, coach_programs, state, profile_setup_complete,
  alter_ego_change_count, alter_ego_last_changed, is_premium, total_xp,
  milestones_count, referred_by
) on profiles to anon, authenticated;

select pg_notify('pgrst', 'reload schema');
