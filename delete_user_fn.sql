-- ============================================================
-- delete_user_account() — lets a user delete their own account
-- Must be SECURITY DEFINER so it can access auth.users
-- ============================================================

CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Deleting from auth.users cascades to profiles (which cascades to everything else)
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

-- Only the authenticated user can call this on themselves
REVOKE ALL ON FUNCTION delete_user_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_user_account() TO authenticated;
