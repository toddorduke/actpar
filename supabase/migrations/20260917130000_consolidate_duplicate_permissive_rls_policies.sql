-- 45 policies dropped, each because it's a provable duplicate or strict
-- subset of a sibling permissive policy on the same table+command (same
-- predicate text, or a predicate wholly implied by the sibling's OR'd
-- condition). This is pure consolidation of accreted duplicates from 49
-- migrations' worth of history (an old Title-Case-named policy set +
-- a newer lowercase-named set doing the same thing) -- no access is being
-- granted or removed for any real user in the great majority of these.
--
-- Four exceptions, verified live and deliberate, not accidental: dropping
-- "Anyone can view tribe posts" (tribe_posts), "Users can view all
-- profiles" (profiles), "Anyone can view rsvps" (event_rsvps), and "Anyone
-- can read reactions" (post_reactions) each removed an unconditional
-- `true` SELECT policy that was open to role `public` (i.e. including
-- anonymous, logged-out requests) in favor of a sibling scoped to
-- `authenticated` only. Confirmed via a real anon-key REST call before/
-- after that this actually changes behavior (anon now gets an empty
-- result instead of real rows) -- and confirmed via a full grep of
-- client/src/pages/About, /Login, /SignUp (the only pre-login pages) that
-- nothing in the app ever queries these tables anonymously. Net effect:
-- closes public read access to user profiles/posts/rsvps/reactions that
-- no real feature was using -- a tightening, not a regression.
--
-- Deliberately NOT touched, and why:
--   - coach_requests/issue_reports/reports SELECT admin-vs-own pairs:
--     genuinely different conditions (admin sees all, owner sees own),
--     both legitimately needed
--   - pact_members DELETE ("Founders or self can remove" vs
--     pact_members_delete): reference different tables (pacts.created_by
--     vs pact_members.role='founder') -- probably equivalent in practice
--     but not provably identical from the policy text alone, left alone
--   - pact_posts UPDATE ("Members can like posts" vs pact_posts_update):
--     genuinely different scope (any pact member vs. post owner only) --
--     flagged separately, not a simple duplicate to merge
--
-- Applied 2026-09-17 by the user directly via the Supabase SQL Editor
-- (bulk DROP POLICY across ~20 tables tripped the automated apply_migration
-- classifier) -- this file plus the schema_migrations row inserted
-- alongside it are what keep the tracked migration history in sync with
-- what's actually live, per the process established in
-- 20260812_rotate_hardcoded_service_role_key.sql's incident.

-- communities
DROP POLICY "Creator can update their community" ON public.communities;

-- community_memberships
DROP POLICY "Users can leave communities" ON public.community_memberships;

-- connections
DROP POLICY "Users can send connection requests" ON public.connections;
DROP POLICY "Users can see their connections" ON public.connections;
DROP POLICY "Users can update their received requests" ON public.connections;

-- event_rsvps
DROP POLICY "Users can delete rsvp" ON public.event_rsvps;
DROP POLICY "Users can rsvp" ON public.event_rsvps;
DROP POLICY "Users can update rsvp" ON public.event_rsvps;
DROP POLICY "Anyone can view rsvps" ON public.event_rsvps;

-- journal_entries
DROP POLICY journal_delete ON public.journal_entries;
DROP POLICY journal_insert ON public.journal_entries;
DROP POLICY "Public journal entries are visible to all" ON public.journal_entries;

-- media
DROP POLICY "Users can delete their own media" ON public.media;
DROP POLICY "Users can insert their own media" ON public.media;
DROP POLICY "Users can select their own media" ON public.media;
DROP POLICY "Public media visible to all" ON public.media;

-- pact_members
DROP POLICY "Users can join pacts" ON public.pact_members;
DROP POLICY "Members can view pact members" ON public.pact_members;

-- pact_posts
DROP POLICY "Post owners can delete" ON public.pact_posts;
DROP POLICY "Members can create posts" ON public.pact_posts;
DROP POLICY "Members can view pact posts" ON public.pact_posts;

-- pact_rules
DROP POLICY "Leaders can delete rules" ON public.pact_rules;
DROP POLICY "Leaders can insert rules" ON public.pact_rules;
DROP POLICY "Members can view rules" ON public.pact_rules;
DROP POLICY "Leaders can update rules" ON public.pact_rules;

-- pacts
DROP POLICY "Users can create pacts" ON public.pacts;
DROP POLICY "Authenticated users can find pacts to join" ON public.pacts;
DROP POLICY "Authenticated users can view pacts" ON public.pacts;
DROP POLICY "Founders can update pacts" ON public.pacts;

-- post_reactions
DROP POLICY "Users can manage own reactions" ON public.post_reactions;
DROP POLICY "Anyone can read reactions" ON public.post_reactions;

-- profiles
DROP POLICY "Users can view all profiles" ON public.profiles;
DROP POLICY "Users can update own profile" ON public.profiles;

-- push_subscriptions
DROP POLICY push_sub_delete ON public.push_subscriptions;
DROP POLICY push_sub_insert ON public.push_subscriptions;
DROP POLICY push_sub_select ON public.push_subscriptions;

-- reflections
DROP POLICY reflections_delete ON public.reflections;
DROP POLICY reflections_insert ON public.reflections;
DROP POLICY "Public reflections visible to all" ON public.reflections;

-- reports
DROP POLICY "Users can insert reports" ON public.reports;
DROP POLICY "users can insert reports" ON public.reports;

-- tribe_posts
DROP POLICY "Users can delete own tribe posts" ON public.tribe_posts;
DROP POLICY "Users can create tribe posts" ON public.tribe_posts;
DROP POLICY "Anyone can view tribe posts" ON public.tribe_posts;
DROP POLICY "Users can update own tribe posts" ON public.tribe_posts;
