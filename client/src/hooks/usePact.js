import { useCallback, useContext, useEffect, useState } from 'react';
import { checkText } from '../utils/contentModeration.js';
import { AuthContext } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';
import { createNotification } from './useNotifications.js';
import { getDisplayName } from '../utils/displayName.js';

export const usePact = (activePactId = null) => {
  const { user } = useContext(AuthContext);

  // All pacts the user belongs to
  const [myPacts, setMyPacts] = useState([]);
  // Data for the currently selected pact
  const [pact, setPact] = useState(null);
  const [members, setMembers] = useState([]);
  const [rules, setRules] = useState([]);
  const [posts, setPosts] = useState([]);
  const [myRole, setMyRole] = useState(null);
  const [openPacts, setOpenPacts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all pacts the user is a member of
  const fetchMyPacts = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('pact_members')
      .select('pact_id, role, pacts(id, name, description, is_open, invite_code, created_at)')
      .eq('user_id', user.id);
    return data ?? [];
  }, [user]);

  // Fetch data for a specific pact
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
    if (!user) return;
    setLoading(true);

    const memberRows = await fetchMyPacts();

    if (memberRows.length === 0) {
      // Not in any pact — fetch open ones to browse
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

    const pacts = memberRows.map((r) => ({
      ...r.pacts,
      myRole: r.role,
    }));
    setMyPacts(pacts);

    // Load data for the active pact (first one by default)
    const targetId = activePactId || pacts[0].id;
    const targetRole = memberRows.find((r) => r.pact_id === targetId)?.role || memberRows[0].role;
    const { pactData, membersData, rulesData, postsData } = await fetchPactData(targetId);

    setMyRole(targetRole);
    setPact(pactData ?? null);
    setMembers(membersData ?? []);
    setRules(rulesData ?? []);
    setPosts(postsData ?? []);
    setLoading(false);
  }, [user, activePactId, fetchMyPacts, fetchPactData]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const switchPact = useCallback(async (pactId) => {
    setLoading(true);
    const memberRows = await fetchMyPacts();
    const targetRole = memberRows.find((r) => r.pact_id === pactId)?.role || 'member';
    const { pactData, membersData, rulesData, postsData } = await fetchPactData(pactId);
    setMyRole(targetRole);
    setPact(pactData ?? null);
    setMembers(membersData ?? []);
    setRules(rulesData ?? []);
    setPosts(postsData ?? []);
    setLoading(false);
  }, [fetchMyPacts, fetchPactData]);

  const createPact = useCallback(async ({ name, description, initialRules, is_open }) => {
    const nameCheck = checkText(name);
    if (!nameCheck.ok) return { error: null, moderation: nameCheck };
    if (description) {
      const descCheck = checkText(description);
      if (!descCheck.ok) return { error: null, moderation: descCheck };
    }
    const { data: newPact, error: pactError } = await supabase
      .from('pacts')
      .insert({ name, description, created_by: user.id, is_open: is_open ?? true })
      .select()
      .single();
    if (pactError) return { error: pactError };

    const { error: memberError } = await supabase
      .from('pact_members')
      .insert({ pact_id: newPact.id, user_id: user.id, role: 'founder' });
    if (memberError) return { error: memberError };

    if (initialRules?.length > 0) {
      const ruleRows = initialRules
        .filter((r) => r.trim())
        .map((rule_text, position) => ({ pact_id: newPact.id, rule_text, position }));
      if (ruleRows.length > 0) await supabase.from('pact_rules').insert(ruleRows);
    }

    await fetchAll();
    return { error: null, pactId: newPact.id };
  }, [user, fetchAll]);

  const joinPactOpen = useCallback(async (pactId) => {
    const { error } = await supabase
      .from('pact_members')
      .insert({ pact_id: pactId, user_id: user.id, role: 'member' });
    if (error) return { error };

    // Notify the pact founder
    const { data: pactInfo } = await supabase
      .from('pacts')
      .select('name, created_by')
      .eq('id', pactId)
      .single();
    if (pactInfo?.created_by) {
      const { data: joiner } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();
      const name = getDisplayName(joiner, 'Someone');
      createNotification({
        userId: pactInfo.created_by,
        actorId: user.id,
        type: 'pact_joined',
        refId: pactId,
        body: `${name} joined your pact "${pactInfo.name}"`,
      });
    }

    await fetchAll();
    return { error: null };
  }, [user, fetchAll]);

  const joinPactByCode = useCallback(async (inviteCode) => {
    const { data: pactData, error: findError } = await supabase
      .from('pacts')
      .select('id, name')
      .eq('invite_code', inviteCode.trim())
      .maybeSingle();
    if (findError || !pactData) return { error: findError || new Error('Invite code not found.') };

    const { error: joinError } = await supabase
      .from('pact_members')
      .insert({ pact_id: pactData.id, user_id: user.id, role: 'member' });
    if (joinError) return { error: joinError };

    await fetchAll();
    return { error: null, pactName: pactData.name };
  }, [user, fetchAll]);

  const toggleOpen = useCallback(async (isOpen) => {
    if (!pact) return;
    const { error } = await supabase.from('pacts').update({ is_open: isOpen }).eq('id', pact.id);
    if (!error) {
      setPact((prev) => ({ ...prev, is_open: isOpen }));
      setMyPacts((prev) => prev.map((p) => p.id === pact.id ? { ...p, is_open: isOpen } : p));
    }
    return { error };
  }, [pact]);

  const addRule = useCallback(async (ruleText) => {
    if (!pact) return;
    const modCheck = checkText(ruleText);
    if (!modCheck.ok) return { error: null, moderation: modCheck };
    const { data, error } = await supabase
      .from('pact_rules')
      .insert({ pact_id: pact.id, rule_text: ruleText, position: rules.length })
      .select().single();
    if (!error) setRules((prev) => [...prev, data]);
    return { error };
  }, [pact, rules]);

  const updateRule = useCallback(async (ruleId, ruleText) => {
    const modCheck = checkText(ruleText);
    if (!modCheck.ok) return { error: null, moderation: modCheck };
    const { data, error } = await supabase
      .from('pact_rules').update({ rule_text: ruleText }).eq('id', ruleId).select().single();
    if (!error) setRules((prev) => prev.map((r) => (r.id === ruleId ? data : r)));
    return { error };
  }, []);

  const deleteRule = useCallback(async (ruleId) => {
    const { error } = await supabase.from('pact_rules').delete().eq('id', ruleId);
    if (!error) setRules((prev) => prev.filter((r) => r.id !== ruleId));
    return { error };
  }, []);

  const createPost = useCallback(async ({ content, post_type, milestone }) => {
    if (!pact) return;
    const modCheck = checkText(content);
    if (!modCheck.ok) return { data: null, error: null, moderation: modCheck };
    if (milestone) {
      const msCheck = checkText(milestone);
      if (!msCheck.ok) return { data: null, error: null, moderation: msCheck };
    }
    const { data, error } = await supabase
      .from('pact_posts')
      .insert({ pact_id: pact.id, user_id: user.id, content, post_type, milestone: milestone || null })
      .select('*, profiles(first_name, last_name)').single();
    if (!error) {
      setPosts((prev) => [data, ...prev]);
      // Notify all other pact members
      const posterName = data.profiles
        ? getDisplayName(data.profiles, 'Someone')
        : 'Someone';
      members
        .filter((m) => m.user_id !== user.id)
        .forEach((m) => createNotification({
          userId: m.user_id,
          actorId: user.id,
          type: 'pact_post',
          refId: pact.id,
          body: `${posterName} posted in ${pact.name}`,
        }));
    }
    return { data, error };
  }, [pact, user, members]);

  const removeMember = useCallback(async (userId) => {
    if (!pact) return { error: new Error('No pact selected') };
    const { error } = await supabase
      .from('pact_members')
      .delete()
      .eq('pact_id', pact.id)
      .eq('user_id', userId);
    if (!error) setMembers((prev) => prev.filter((m) => m.user_id !== userId));
    return { error };
  }, [pact]);

  const updateMemberRole = useCallback(async (userId, role) => {
    if (!pact) return { error: new Error('No pact selected') };
    const { error } = await supabase
      .from('pact_members')
      .update({ role })
      .eq('pact_id', pact.id)
      .eq('user_id', userId);
    if (!error) setMembers((prev) => prev.map((m) => m.user_id === userId ? { ...m, role } : m));
    return { error };
  }, [pact]);

  const leavePact = useCallback(async () => {
    if (!pact || !user) return { error: new Error('No pact selected') };
    const { error } = await supabase
      .from('pact_members')
      .delete()
      .eq('pact_id', pact.id)
      .eq('user_id', user.id);
    if (!error) {
      setMyPacts((prev) => prev.filter((p) => p.id !== pact.id));
      setPact(null);
      setMembers([]); setRules([]); setPosts([]);
    }
    return { error };
  }, [pact, user]);

  const deletePact = useCallback(async () => {
    if (!pact) return { error: new Error('No pact selected') };
    const { error } = await supabase.from('pacts').delete().eq('id', pact.id);
    if (!error) {
      setPact(null);
      setMyPacts((prev) => prev.filter((p) => p.id !== pact.id));
      setMembers([]); setRules([]); setPosts([]);
    }
    return { error };
  }, [pact]);

  return {
    myPacts, pact, members, rules, posts, myRole, openPacts, loading,
    switchPact, createPact, joinPactOpen, joinPactByCode, toggleOpen,
    addRule, updateRule, deleteRule, createPost,
    removeMember, updateMemberRole, leavePact, deletePact,
    refetch: fetchAll,
  };
};
