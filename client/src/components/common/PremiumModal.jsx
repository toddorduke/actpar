import React, { useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import { useToast } from './Toast.jsx';
import './PremiumModal.css';

const PRICE_ID = import.meta.env.VITE_STRIPE_PRICE_ID ?? '';

const PERKS = [
  { icon: '🚀', label: 'Unlimited Pacts' },
  { icon: '📊', label: 'Advanced Analytics' },
  { icon: '🏆', label: 'Priority on Leaderboards' },
  { icon: '🤝', label: 'Verified Coach Badges' },
  { icon: '🔔', label: 'Smart Nudge Scheduling' },
  { icon: '💬', label: 'Unlimited Direct Messages' },
];

export default function PremiumModal({ onClose }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { toast('Please log in first.', 'error'); setLoading(false); return; }

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ priceId: PRICE_ID }),
      },
    );

    if (!res.ok) {
      toast('Could not start checkout. Try again.', 'error');
      setLoading(false);
      return;
    }

    const { url } = await res.json();
    window.location.href = url;
  }

  return (
    <div className="premium-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="premium-modal">
        <button className="premium-close" onClick={onClose}>×</button>

        <div className="premium-badge">⚡ ActPar Pro</div>
        <h2 className="premium-title">Level Up Your Accountability</h2>
        <p className="premium-sub">Everything you need to stay consistent, hold others accountable, and lead by example.</p>

        <ul className="premium-perks">
          {PERKS.map(({ icon, label }) => (
            <li key={label} className="premium-perk">
              <span className="perk-icon">{icon}</span>
              <span className="perk-label">{label}</span>
            </li>
          ))}
        </ul>

        <div className="premium-price">
          <span className="price-amount">$9</span>
          <span className="price-period">/ month</span>
        </div>

        <button className="premium-cta" onClick={handleUpgrade} disabled={loading}>
          {loading ? 'Redirecting…' : 'Upgrade to Pro →'}
        </button>

        <p className="premium-guarantee">Cancel any time. No questions asked.</p>
      </div>
    </div>
  );
}
