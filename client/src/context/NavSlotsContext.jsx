import React, { createContext, useContext, useState } from 'react';

// Bumped to v5 -- 'pact' was pulled from the nav pool the same way 'coach'
// was (no flag, no comment, just silently dropped from NAV_POOL/
// DEFAULT_SLOTS at some point) but its route was never actually disabled,
// only reachable by clicking a pact_joined/pact_post notification. Adding
// it back the same way coach was in v4 -- see that bump's note on why the
// version needs to change for a DEFAULT_SLOTS addition to actually reach
// anyone with a stored value already.
const STORAGE_KEY = 'actpar_nav_slots_v5';
const DEFAULT_SLOTS = ['connect', 'feed', 'tribe', 'explore', 'coach', 'pact'];

// Keys that no longer exist — strip them from stored slots
const REMOVED_KEYS = new Set([]);

// Valid keys come from NAV_POOL in Navigation.jsx — keep in sync
const VALID_KEYS = new Set(['connect', 'messages', 'ranks', 'tribe', 'feed', 'explore', 'coach', 'pact']);

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
