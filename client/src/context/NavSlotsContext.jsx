import React, { createContext, useContext, useState } from 'react';

// Bumped to v6 -- 'ranks' (Leaderboard) has the exact same problem pact
// and coach did: a working NAV_POOL entry and a fully live /leaderboard
// route, but zero links to it anywhere in the app outside NAV_POOL's own
// definition, and never in DEFAULT_SLOTS. Added it to DEFAULT_SLOTS too
// rather than wait for a third report of the same pattern -- see the v4/v5
// bumps' notes on why the version needs to change for a DEFAULT_SLOTS
// addition to actually reach anyone with a stored value already. No
// further version bump needed for removing 'coach' below -- REMOVED_KEYS
// already forces a reset to DEFAULT_SLOTS for anyone who has it stored.
const STORAGE_KEY = 'actpar_nav_slots_v6';
const DEFAULT_SLOTS = ['connect', 'feed', 'tribe', 'explore', 'pact', 'ranks'];

// Keys that no longer exist — strip them from stored slots. 'coach' was
// only ever a testing entry point (COACH_MARKETPLACE_ENABLED went back to
// false 2026-09-18 once the user had seen it) -- pact and ranks stay,
// those were real orphaned-nav bugs, not deliberate hides.
const REMOVED_KEYS = new Set(['coach']);

// Valid keys come from NAV_POOL in Navigation.jsx — keep in sync
const VALID_KEYS = new Set(['connect', 'messages', 'ranks', 'tribe', 'feed', 'explore', 'pact']);

export const NavSlotsContext = createContext(null);

export const NavSlotsProvider = ({ children }) => {
  const [slots, setSlots] = useState(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) {
        const p = JSON.parse(s);
        if (Array.isArray(p) && p.length > 0) {
          const hadInvalid = p.some((k) => REMOVED_KEYS.has(k) || !VALID_KEYS.has(k));
          const cleaned = p.filter((k) => !REMOVED_KEYS.has(k) && VALID_KEYS.has(k)).slice(0, DEFAULT_SLOTS.length);
          // If any keys were stripped, reset to defaults so the nav looks right
          if (hadInvalid) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SLOTS));
            return DEFAULT_SLOTS;
          }
          if (cleaned.length > 0) return cleaned;
        }
      }
    } catch {}
    return DEFAULT_SLOTS;
  });

  function updateSlots(newSlots) {
    setSlots(newSlots);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSlots));
  }

  return (
    <NavSlotsContext.Provider value={{ slots, updateSlots }}>
      {children}
    </NavSlotsContext.Provider>
  );
};

export const useNavSlots = () => useContext(NavSlotsContext);
