-- Mechanical fix for the auth_rls_initplan performance lint: every
-- policy that referenced auth.uid()/auth.jwt()/auth.role() directly now
-- wraps the call as (select auth.uid()) etc. This changes zero logical
-- behavior -- same rows match before and after -- it only lets Postgres
-- evaluate the call once per query instead of once per row, since a
-- scalar subquery is cacheable within a single statement the way a bare
-- function call in a WHERE clause isn't. Regenerated directly from
-- pg_policies via a regex substitution (not hand-transcribed) to avoid
-- transcription error across ~100 policies; every ALTER POLICY below
-- was verified to compile against the live policy list at generation
-- time. Applied by the user directly via the Supabase SQL Editor (same
-- classifier block as 20260917130000's DROP POLICY batch).

ALTER POLICY "admin can insert audit log" ON public.admin_audit_log TO authenticated
  WITH CHECK (((((select auth.jwt()) ->> 'email'::text) = 'toddwork1995@gmail.com'::text) AND (admin_id = (select auth.uid()))));
ALTER POLICY "admin can view audit log" ON public.admin_audit_log TO authenticated
  USING ((((select auth.jwt()) ->> 'email'::text) = 'toddwork1995@gmail.com'::text));
ALTER POLICY "users can block others" ON public.blocked_users TO authenticated
  WITH CHECK ((blocker_id = (select auth.uid())));
ALTER POLICY "users can unblock" ON public.blocked_users TO authenticated
  USING ((blocker_id = (select auth.uid())));
ALTER POLICY "users can view own blocks" ON public.blocked_users TO authenticated
  USING ((blocker_id = (select auth.uid())));
ALTER POLICY "Users can delete own entries" ON public.challenge_entries
  USING ((user_id = (select auth.uid())));
ALTER POLICY "Users can log entries" ON public.challenge_entries
  WITH CHECK ((user_id = (select auth.uid())));
ALTER POLICY coach_app_insert ON public.coach_applications
  WITH CHECK ((user_id = (select auth.uid())));
ALTER POLICY coach_app_select ON public.coach_applications
  USING ((user_id = (select auth.uid())));
ALTER POLICY "admin can update coach requests" ON public.coach_requests
  USING ((((select auth.jwt()) ->> 'email'::text) = 'toddwork1995@gmail.com'::text));
ALTER POLICY "admin can view all coach requests" ON public.coach_requests
  USING ((((select auth.jwt()) ->> 'email'::text) = 'toddwork1995@gmail.com'::text));
ALTER POLICY coach_req_insert ON public.coach_requests
  WITH CHECK ((user_id = (select auth.uid())));
ALTER POLICY coach_req_select ON public.coach_requests
  USING ((user_id = (select auth.uid())));
ALTER POLICY "Admin can update community" ON public.communities
  USING (((created_by = (select auth.uid())) OR (EXISTS ( SELECT 1
   FROM community_memberships
  WHERE ((community_memberships.community_id = communities.id) AND (community_memberships.user_id = (select auth.uid())) AND (community_memberships.role = 'admin'::text))))));
ALTER POLICY "Authenticated users can create communities" ON public.communities
  WITH CHECK (((select auth.uid()) IS NOT NULL));
ALTER POLICY "Auth users can create challenge" ON public.community_challenges
  WITH CHECK (((select auth.uid()) IS NOT NULL));
ALTER POLICY "Creator can update challenge" ON public.community_challenges
  USING ((created_by = (select auth.uid())));
ALTER POLICY "Auth users can create events" ON public.community_events
  WITH CHECK (((select auth.uid()) IS NOT NULL));
ALTER POLICY "Creator can delete events" ON public.community_events
  USING ((created_by = (select auth.uid())));
ALTER POLICY "Creator can update events" ON public.community_events
  USING ((created_by = (select auth.uid())));
ALTER POLICY "Admin can remove members" ON public.community_memberships
  USING (((user_id = (select auth.uid())) OR (EXISTS ( SELECT 1
   FROM community_memberships cm
  WHERE ((cm.community_id = community_memberships.community_id) AND (cm.user_id = (select auth.uid())) AND (cm.role = 'admin'::text))))));
ALTER POLICY "Users can join communities" ON public.community_memberships
  WITH CHECK ((user_id = (select auth.uid())));
ALTER POLICY "admins can update member roles" ON public.community_memberships TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM community_memberships cm
  WHERE ((cm.community_id = community_memberships.community_id) AND (cm.user_id = (select auth.uid())) AND (cm.role = 'admin'::text)))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM community_memberships cm
  WHERE ((cm.community_id = community_memberships.community_id) AND (cm.user_id = (select auth.uid())) AND (cm.role = 'admin'::text)))));
ALTER POLICY protect_creator_membership_delete ON public.community_memberships TO authenticated
  USING (((user_id <> ( SELECT communities.created_by
   FROM communities
  WHERE (communities.id = community_memberships.community_id))) OR (user_id = (select auth.uid()))));
ALTER POLICY "Auth users can send messages" ON public.community_messages
  WITH CHECK ((user_id = (select auth.uid())));
ALTER POLICY "receiver can update status" ON public.connections TO authenticated
  USING ((receiver_id = (select auth.uid())));
ALTER POLICY "users can create connection requests" ON public.connections TO authenticated
  WITH CHECK ((requester_id = (select auth.uid())));
ALTER POLICY "users can delete own connections" ON public.connections TO authenticated
  USING (((requester_id = (select auth.uid())) OR (receiver_id = (select auth.uid()))));
ALTER POLICY "users can see own connections" ON public.connections TO authenticated
  USING (((requester_id = (select auth.uid())) OR (receiver_id = (select auth.uid()))));
ALTER POLICY insert_own ON public.custom_categories TO authenticated
  WITH CHECK ((created_by = (select auth.uid())));
ALTER POLICY select_visible ON public.custom_categories TO authenticated
  USING (((status = 'active'::text) OR (created_by = (select auth.uid()))));
ALTER POLICY dm_insert ON public.direct_messages
  WITH CHECK ((sender_id = (select auth.uid())));
ALTER POLICY dm_select ON public.direct_messages
  USING (((sender_id = (select auth.uid())) OR (receiver_id = (select auth.uid()))));
ALTER POLICY dm_update_read ON public.direct_messages
  USING ((receiver_id = (select auth.uid())));
ALTER POLICY "users can manage their rsvps" ON public.event_rsvps TO authenticated
  USING ((user_id = (select auth.uid())))
  WITH CHECK ((user_id = (select auth.uid())));
ALTER POLICY expo_push_tokens_own ON public.expo_push_tokens
  USING ((user_id = (select auth.uid())))
  WITH CHECK ((user_id = (select auth.uid())));
ALTER POLICY goal_checkins_v2_own ON public.goal_checkins_v2
  USING ((user_id = (select auth.uid())))
  WITH CHECK ((user_id = (select auth.uid())));
ALTER POLICY goal_edits_v2_own ON public.goal_edits_v2
  USING ((user_id = (select auth.uid())))
  WITH CHECK ((user_id = (select auth.uid())));
ALTER POLICY goal_lifecycle_events_own ON public.goal_lifecycle_events
  USING ((user_id = (select auth.uid())))
  WITH CHECK ((user_id = (select auth.uid())));
ALTER POLICY goal_progress_v2_insert ON public.goal_progress_v2
  WITH CHECK ((user_id = (select auth.uid())));
ALTER POLICY goal_progress_v2_select ON public.goal_progress_v2
  USING (((select auth.role()) = 'authenticated'::text));
ALTER POLICY goals_v2_delete ON public.goals_v2
  USING ((user_id = (select auth.uid())));
ALTER POLICY goals_v2_insert ON public.goals_v2
  WITH CHECK ((user_id = (select auth.uid())));
ALTER POLICY goals_v2_select ON public.goals_v2
  USING (((select auth.role()) = 'authenticated'::text));
ALTER POLICY goals_v2_update ON public.goals_v2
  USING ((user_id = (select auth.uid())))
  WITH CHECK ((user_id = (select auth.uid())));
ALTER POLICY "admin can update issue reports" ON public.issue_reports TO authenticated
  USING ((((select auth.jwt()) ->> 'email'::text) = 'toddwork1995@gmail.com'::text));
ALTER POLICY "admin can view all issue reports" ON public.issue_reports TO authenticated
  USING ((((select auth.jwt()) ->> 'email'::text) = 'toddwork1995@gmail.com'::text));
ALTER POLICY "users can insert issue reports" ON public.issue_reports TO authenticated
  WITH CHECK ((user_id = (select auth.uid())));
ALTER POLICY "users can view own issue reports" ON public.issue_reports TO authenticated
  USING ((user_id = (select auth.uid())));
ALTER POLICY "Users can manage own journal entries" ON public.journal_entries
  USING (((select auth.uid()) = user_id));
ALTER POLICY journal_select ON public.journal_entries
  USING (((user_id = (select auth.uid())) OR (is_public = true)));
ALTER POLICY journal_update ON public.journal_entries
  USING ((user_id = (select auth.uid())));
ALTER POLICY media_delete ON public.media
  USING ((user_id = (select auth.uid())));
ALTER POLICY media_insert ON public.media
  WITH CHECK ((user_id = (select auth.uid())));
ALTER POLICY media_select ON public.media
  USING (((user_id = (select auth.uid())) OR (visibility = 'everyone'::text)));
ALTER POLICY media_select_connections ON public.media
  USING (((visibility = 'connections'::text) AND (EXISTS ( SELECT 1
   FROM connections
  WHERE ((connections.status = 'accepted'::text) AND (((connections.requester_id = (select auth.uid())) AND (connections.receiver_id = media.user_id)) OR ((connections.requester_id = media.user_id) AND (connections.receiver_id = (select auth.uid())))))))));
ALTER POLICY notif_delete ON public.notifications
  USING ((user_id = (select auth.uid())));
ALTER POLICY notif_insert ON public.notifications
  WITH CHECK (((select auth.uid()) IS NOT NULL));
ALTER POLICY notif_select ON public.notifications
  USING ((user_id = (select auth.uid())));
ALTER POLICY notif_update ON public.notifications
  USING ((user_id = (select auth.uid())));
ALTER POLICY "Founders or self can remove" ON public.pact_members
  USING (((user_id = (select auth.uid())) OR (pact_id IN ( SELECT pacts.id
   FROM pacts
  WHERE (pacts.created_by = (select auth.uid()))))));
ALTER POLICY pact_members_delete ON public.pact_members
  USING (((user_id = (select auth.uid())) OR (EXISTS ( SELECT 1
   FROM pact_members pm
  WHERE ((pm.pact_id = pact_members.pact_id) AND (pm.user_id = (select auth.uid())) AND (pm.role = 'founder'::text))))));
ALTER POLICY pact_members_insert ON public.pact_members
  WITH CHECK ((user_id = (select auth.uid())));
ALTER POLICY pact_members_update ON public.pact_members
  USING ((EXISTS ( SELECT 1
   FROM pact_members pm
  WHERE ((pm.pact_id = pact_members.pact_id) AND (pm.user_id = (select auth.uid())) AND (pm.role = ANY (ARRAY['founder'::text, 'co-lead'::text]))))));
ALTER POLICY pact_posts_delete ON public.pact_posts
  USING (((user_id = (select auth.uid())) OR (EXISTS ( SELECT 1
   FROM pact_members pm
  WHERE ((pm.pact_id = pact_posts.pact_id) AND (pm.user_id = (select auth.uid())) AND (pm.role = 'founder'::text))))));
ALTER POLICY pact_posts_insert ON public.pact_posts
  WITH CHECK (((user_id = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM pact_members pm
  WHERE ((pm.pact_id = pact_posts.pact_id) AND (pm.user_id = (select auth.uid())))))));
ALTER POLICY pact_posts_select ON public.pact_posts
  USING ((EXISTS ( SELECT 1
   FROM pact_members pm
  WHERE ((pm.pact_id = pact_posts.pact_id) AND (pm.user_id = (select auth.uid()))))));
ALTER POLICY pact_posts_update ON public.pact_posts
  USING ((user_id = (select auth.uid())));
ALTER POLICY pact_rules_delete ON public.pact_rules
  USING ((EXISTS ( SELECT 1
   FROM pact_members pm
  WHERE ((pm.pact_id = pact_rules.pact_id) AND (pm.user_id = (select auth.uid())) AND (pm.role = ANY (ARRAY['founder'::text, 'co-lead'::text]))))));
ALTER POLICY pact_rules_insert ON public.pact_rules
  WITH CHECK ((EXISTS ( SELECT 1
   FROM pact_members pm
  WHERE ((pm.pact_id = pact_rules.pact_id) AND (pm.user_id = (select auth.uid())) AND (pm.role = ANY (ARRAY['founder'::text, 'co-lead'::text]))))));
ALTER POLICY pact_rules_update ON public.pact_rules
  USING ((EXISTS ( SELECT 1
   FROM pact_members pm
  WHERE ((pm.pact_id = pact_rules.pact_id) AND (pm.user_id = (select auth.uid())) AND (pm.role = ANY (ARRAY['founder'::text, 'co-lead'::text]))))));
ALTER POLICY pacts_delete ON public.pacts
  USING ((created_by = (select auth.uid())));
ALTER POLICY pacts_insert ON public.pacts
  WITH CHECK ((created_by = (select auth.uid())));
ALTER POLICY pacts_update ON public.pacts
  USING ((created_by = (select auth.uid())));
ALTER POLICY "Users can delete partnerships they belong to" ON public.partnerships
  USING ((((select auth.uid()) = requester_id) OR ((select auth.uid()) = receiver_id)));
ALTER POLICY "Users can propose partnerships" ON public.partnerships
  WITH CHECK (((select auth.uid()) = requester_id));
ALTER POLICY "Users can update partnerships they belong to" ON public.partnerships
  USING ((((select auth.uid()) = requester_id) OR ((select auth.uid()) = receiver_id)));
ALTER POLICY "Users can view own partnerships" ON public.partnerships
  USING ((((select auth.uid()) = requester_id) OR ((select auth.uid()) = receiver_id)));
ALTER POLICY comments_delete ON public.post_comments
  USING ((user_id = (select auth.uid())));
ALTER POLICY comments_insert ON public.post_comments
  WITH CHECK ((user_id = (select auth.uid())));
ALTER POLICY comments_select ON public.post_comments
  USING (((select auth.uid()) IS NOT NULL));
ALTER POLICY likes_delete ON public.post_likes
  USING ((user_id = (select auth.uid())));
ALTER POLICY likes_insert ON public.post_likes
  WITH CHECK ((user_id = (select auth.uid())));
ALTER POLICY likes_select ON public.post_likes
  USING (((select auth.uid()) IS NOT NULL));
ALTER POLICY "manage own reactions" ON public.post_reactions TO authenticated
  USING ((user_id = (select auth.uid())))
  WITH CHECK ((user_id = (select auth.uid())));
ALTER POLICY "Users can insert own profile" ON public.profiles
  WITH CHECK (((select auth.uid()) = id));
ALTER POLICY "users can update own profile" ON public.profiles TO authenticated
  USING ((id = (select auth.uid())))
  WITH CHECK ((id = (select auth.uid())));
ALTER POLICY "Users manage own subscriptions" ON public.push_subscriptions
  USING (((select auth.uid()) = user_id));
ALTER POLICY "Users manage own reflections" ON public.reflections
  USING (((select auth.uid()) = user_id))
  WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY reflections_select ON public.reflections
  USING (((user_id = (select auth.uid())) OR (is_public = true)));
ALTER POLICY "admin can update reports" ON public.reports TO authenticated
  USING ((((select auth.jwt()) ->> 'email'::text) = 'toddwork1995@gmail.com'::text));
ALTER POLICY "admin can view all reports" ON public.reports TO authenticated
  USING ((((select auth.jwt()) ->> 'email'::text) = 'toddwork1995@gmail.com'::text));
ALTER POLICY "users can create reports" ON public.reports TO authenticated
  WITH CHECK ((reporter_id = (select auth.uid())));
ALTER POLICY "users can view own reports" ON public.reports TO authenticated
  USING ((reporter_id = (select auth.uid())));
ALTER POLICY rsvps_delete ON public.tribe_post_rsvps
  USING (((select auth.uid()) = user_id));
ALTER POLICY rsvps_insert ON public.tribe_post_rsvps
  WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY rsvps_select ON public.tribe_post_rsvps
  USING (((select auth.uid()) IS NOT NULL));
ALTER POLICY rsvps_update ON public.tribe_post_rsvps
  USING (((select auth.uid()) = user_id));
ALTER POLICY "users can create own tribe posts" ON public.tribe_posts TO authenticated
  WITH CHECK ((user_id = (select auth.uid())));
ALTER POLICY "users can delete own tribe posts" ON public.tribe_posts TO authenticated
  USING ((user_id = (select auth.uid())));
ALTER POLICY "users can update own tribe posts" ON public.tribe_posts TO authenticated
  USING ((user_id = (select auth.uid())));
