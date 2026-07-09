import { useCallback, useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';
import { checkText } from '../utils/contentModeration.js';

export const useCommunityEvents = (communityId) => {
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [rsvps, setRsvps] = useState({}); // eventId -> user's status
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    if (!communityId) return;
    setLoading(true);
    const [{ data: eventsData }, { data: myRsvps }] = await Promise.all([
      supabase
        .from('community_events')
        .select('*, profiles(first_name, last_name), event_rsvps(user_id, status)')
        .eq('community_id', communityId)
        .order('event_date', { ascending: true }),
      supabase
        .from('event_rsvps')
        .select('event_id, status')
        .eq('user_id', user?.id ?? ''),
    ]);
    setEvents(eventsData ?? []);
    const map = {};
    (myRsvps ?? []).forEach((r) => { map[r.event_id] = r.status; });
    setRsvps(map);
    setLoading(false);
  }, [communityId, user?.id]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const createEvent = useCallback(async ({ title, description, location, event_date, price, stripe_payment_link, max_attendees }) => {
    const titleCheck = checkText(title);
    if (!titleCheck.ok) return { data: null, error: null, moderation: titleCheck };
    if (description) {
      const descCheck = checkText(description);
      if (!descCheck.ok) return { data: null, error: null, moderation: descCheck };
    }
    if (location) {
      const locationCheck = checkText(location);
      if (!locationCheck.ok) return { data: null, error: null, moderation: locationCheck };
    }
    const { data, error } = await supabase
      .from('community_events')
      .insert({ community_id: communityId, created_by: user.id, title, description, location, event_date, price: price || 0, stripe_payment_link: stripe_payment_link || null, max_attendees: max_attendees || null })
      .select('*, profiles(first_name, last_name), event_rsvps(user_id, status)')
      .single();
    if (!error) setEvents((prev) => [...prev, data].sort((a, b) => new Date(a.event_date) - new Date(b.event_date)));
    return { data, error };
  }, [communityId, user]);

  const rsvp = useCallback(async (eventId, status) => {
    const existing = rsvps[eventId];
    if (existing === status) {
      // toggle off
      await supabase.from('event_rsvps').delete().eq('event_id', eventId).eq('user_id', user.id);
      setRsvps((prev) => { const n = { ...prev }; delete n[eventId]; return n; });
    } else {
      await supabase.from('event_rsvps').upsert({ event_id: eventId, user_id: user.id, status });
      setRsvps((prev) => ({ ...prev, [eventId]: status }));
    }
    fetchEvents();
  }, [rsvps, user, fetchEvents]);

  const deleteEvent = useCallback(async (eventId) => {
    await supabase.from('community_events').delete().eq('id', eventId);
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  }, []);

  return { events, rsvps, loading, createEvent, rsvp, deleteEvent, refetch: fetchEvents };
};
