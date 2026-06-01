import React, { createContext, useContext, useState } from 'react';

const STORAGE_KEY = 'actpar_nav_slots_v3';
const DEFAULT_SLOTS = ['connect', 'feed', 'tribe', 'explore'];

// Keys that no longer exist — strip them from stored slots
const REMOVED_KEYS = new Set(['pact', 'coach']);

// Valid keys come from NAV_POOL in Navigation.jsx — keep in sync
const VALID_KEYS = new Set(['connect', 'messages', 'ranks', 'tribe', 'feed', 'explore']);

export const NavSlotsContext = createContext(null);

export const NavSlotsProvider = ({ children }) => {
  const [slots, setSlots] = useState(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) {
        const p = JSON.parse(s);
        if (Array.isArray(p) && p.length > 0) {
          const hadInvalid = p.some((k) => REMOVED_KEYS.has(k) || !VALID_KEYS.has(k));
          const cleaned = p.filter((k) => !REMOVED_KEYS.has(k) && VALID_KEYS.has(k)).slice(0, 4);
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
