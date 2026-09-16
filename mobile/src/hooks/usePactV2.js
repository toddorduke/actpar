import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { checkText } from '../lib/contentModeration';
import { getDisplayName } from '../lib/displayName';
import { createNotificationV2 } from './useNotificationsV2';

// Mirrors client/src/hooks/usePact.js, trimmed to what mobile's Pact tab
// actually surfaces: viewing/creating pacts, posting, joining. Rule editing
// and member-role management stay web-only for now (settings-heavy, not a
// fit for a small mobile card yet).
export function usePactV2(userId) {
  const [myPacts, setMyPacts] = useState([]);
  const [pact, setPact] = useState(null);
  const [members, setMembers] = useState([]);
  const [rules, setRules] = useState([]);
  const [posts, setPosts] = useState([]);
  const [myRole, setMyRole] = useState(null);
  const [openPacts, setOpenPacts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyPacts = useCallback(async () => {
    if (!userId) return [];
    const { data } = await supabase
      .from('pact_members')
      .select('pact_id, role, pacts(id, name, description, is_open, invite_code, created_at)')
      .eq('user_id', userId);
    return data ?? [];
  }, [userId]);

  const fetchPactData = useCallback(async (pactId) => {
    const [{ data: pactData }, { data: membersData }, { data: rulesData }, { data: postsData }] =
      await Promise.all([
        supabase.from('pacts').select('*').eq('id', pactId).single(),
        supabase.from('pact_members').select('*, profiles(id, first_name, last_name, avatar_url, alter_ego_name)').eq('pact_id', pactId),
        supabase.from('pact_rules').select('*').eq('pact_id', pactId).order('position'),
        supabase.from('pact_posts').select('*, profiles(id, first_name, last_name, avatar_url)').eq('pact_id', pactId).order('created_at', { ascending: false }).limit(50),
      ]);
    return { pactData, membersData, rulesData, postsData };
  }, []);

  const fetchAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const memberRows = await fetchMyPacts();

    if (memberRows.length === 0) {
      const { data: open } = await supabase
        .from('pacts')
        .select('id, name, description, created_at')
        .eq('is_open', true)
        .order('created_at', { ascending: false });
      setOpenPacts(open ?? []);
      setMyPacts([]);
      setPact(null);
      setLoading(false);
      return;
    }

    const pacts = memberRows.map((r) => ({ ...r.pacts, myRole: r.role }));
    setMyPacts(pacts);

    const targetId = pacts[0].id;
    const targetRole = memberRows.find((r) => r.pact_id === targetId)?.role ?? 'member';
    const { pactData, membersData, rulesData, postsData } = await fetchPactData(targetId);

    setMyRole(targetRole);
    setPact(pactData ?? null);
    setMembers(membersData ?? []);
    setRules(rulesData ?? []);
    setPosts(postsData ?? []);
    setLoading(false);
  }, [userId, fetchMyPacts, fetchPactData]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const switchPact = useCallback(async (pactId) => {
    setLoading(true);
    const memberRows = await fetchMyPacts();
    const targetRole = memberRows.find((r) => r.pact_id === pactId)?.role ?? 'member';
    const { pactData, membersData, rulesData, postsData } = await fetchPactData(pactId);
    setMyRole(targetRole);
    setPact(pactData ?? null);
    setMembers(membersData ?? []);
    setRules(rulesData ?? []);
    setPosts(postsData ?? []);
    setLoading(false);
  }, [fetchMyPacts, fetchPactData]);

  const createPact = useCallback(async ({ name, description, is_open }) => {
    if (!userId) return { error: new Error('Not authenticated') };
    const nameCheck = checkText(name);
    if (!nameCheck.ok) return { error: null, moderation: nameCheck };
    if (description) {
      const descCheck = checkText(description);
      if (!descCheck.ok) return { error: null, moderation: descCheck };
    }
    const { data: newPact, error: pactError } = await supabase
      .from('pacts')
      .insert({ name, description, created_by: userId, is_open: is_open ?? true })
      .select()
      .single();
    if (pactError) return { error: pactError };

    const { error: memberError } = await supabase
      .from('pact_members')
      .insert({ pact_id: newPact.id, user_id: userId, role: 'founder' });
    if (memberError) return { error: memberError };

    await fetchAll();
    return { error: null, pactId: newPact.id };
  }, [userId, fetchAll]);

  const joinPactOpen = useCallback(async (pactId) => {
    if (!userId) return { error: new Error('Not authenticated') };
    const { error } = await supabase
      .from('pact_members')
      .insert({ pact_id: pactId, user_id: userId, role: 'member' });
    if (error) return { error };

    const { data: pactInfo } = await supabase.from('pacts').select('name, created_by').eq('id', pactId).single();
    if (pactInfo?.created_by) {
      const { data: joiner } = await supabase.from('profiles').select('first_name, last_name').eq('id', userId).single();
      const name = getDisplayName(joiner, 'Someone');
      createNotificationV2({ userId: pactInfo.created_by, actorId: userId, type: 'pact_joined', refId: pactId, body: `${name} joined your pact "${pactInfo.name}"` });
    }

    await fetchAll();
    return { error: null };
  }, [userId, fetchAll]);

  const joinPactByCode = useCallback(async (inviteCode) => {
    if (!userId) return { error: new Error('Not authenticated') };
    const { data: pactData, error: findError } = await supabase
      .from('pacts')
      .select('id, name')
      .eq('invite_code', inviteCode.trim())
      .maybeSingle();
    if (findError || !pactData) return { error: findError || new Error('Invite code not found.') };

    const { error: joinError } = await supabase
      .from('pact_members')
      .insert({ pact_id: pactData.id, user_id: userId, role: 'member' });
    if (joinError) return { error: joinError };

    await fetchAll();
    return { error: null, pactName: pactData.name };
  }, [userId, fetchAll]);

  const createPost = useCallback(async ({ content, post_type, milestone }) => {
    if (!pact || !userId) return { data: null, error: new Error('No pact selected') };
    const modCheck = checkText(content);
    if (!modCheck.ok) return { data: null, error: null, moderation: modCheck };
    if (milestone) {
      const msCheck = checkText(milestone);
      if (!msCheck.ok) return { data: null, error: null, moderation: msCheck };
    }
    const { data, error } = await supabase
      .from('pact_posts')
      .insert({ pact_id: pact.id, user_id: userId, content, post_type, milestone: milestone || null })
      .select('*, profiles(first_name, last_name)').single();
    if (!error) {
      setPosts((prev) => [data, ...prev]);
      const posterName = data.profiles ? getDisplayName(data.profiles, 'Someone') : 'Someone';
      members
        .filter((m) => m.user_id !== userId)
        .forEach((m) => createNotificationV2({ userId: m.user_id, actorId: userId, type: 'pact_post', refId: pact.id, body: `${posterName} posted in ${pact.name}` }));
    }
    return { data, error };
  }, [pact, userId, members]);

  const leavePact = useCallback(async () => {
    if (!pact || !userId) return { error: new Error('No pact selected') };
    const { error } = await supabase.from('pact_members').delete().eq('pact_id', pact.id).eq('user_id', userId);
    if (!error) {
      setMyPacts((prev) => prev.filter((p) => p.id !== pact.id));
      setPact(null);
      setMembers([]); setRules([]); setPosts([]);
    }
    return { error };
  }, [pact, userId]);

  return {
    myPacts, pact, members, rules, posts, myRole, openPacts, loading,
    switchPact, createPact, joinPactOpen, joinPactByCode, createPost, leavePact,
    refetch: fetchAll,
  };
}
