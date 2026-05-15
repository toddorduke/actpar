import React, { createContext, useContext, useState } from 'react';

const STORAGE_KEY = 'actpar_nav_slots';
const DEFAULT_SLOTS = ['connect', 'tribe'];

export const NavSlotsContext = createContext(null);

export const NavSlotsProvider = ({ children }) => {
  const [slots, setSlots] = useState(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) {
        const p = JSON.parse(s);
        if (Array.isArray(p) && p.length > 0) return p.slice(0, 3);
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
