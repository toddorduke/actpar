-- Supabase's security advisor flagged 5 functions with a mutable search_path
-- -- a known privilege-escalation vector for SECURITY DEFINER functions
-- (a caller can manipulate search_path so the function resolves to an
-- attacker-controlled object instead of the intended one). Pinning it does
-- not change behavior, only how unqualified names resolve.
alter function public.add_xp(uid uuid, xp_amount integer) set search_path = public;
alter function public.decrement_post_likes(p_post_id uuid, p_post_type text) set search_path = public;
alter function public.increment_post_likes(p_post_id uuid, p_post_type text) set search_path = public;
alter function public.is_pact_member(p_pact_id uuid) set search_path = public;
alter function public.update_post_comments_count() set search_path = public;
