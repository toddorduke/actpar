import React, { useEffect, useState } from 'react';
import Avatar from './Avatar.jsx';
import { playConnectedSound } from '../../utils/sounds.js';
import './ConnectedModal.css';

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  angle: (360 / 18) * i,
  distance: 90 + Math.random() * 60,
  delay: Math.random() * 0.15,
}));

export default function ConnectedModal({ open, onClose, myAvatarUrl, myName, otherAvatarUrl, otherName, onMessage, onViewProfile }) {
  const [phase, setPhase] = useState('strike');

  useEffect(() => {
    if (!open) return;
    setPhase('strike');
    playConnectedSound();
    const t = setTimeout(() => setPhase('reveal'), 550);
    return () => clearTimeout(t);
  }, [open]);

  if (!open) return null;

  return (
    <div className="connected-modal-backdrop" onClick={() => phase === 'reveal' && onClose()}>
      <div className={`connected-modal-shake${phase === 'strike' ? ' shaking' : ''}`}>
        <div className="connected-modal" onClick={(e) => e.stopPropagation()}>
          <div className="connected-flash" />
          <svg className={`connected-bolt${phase === 'reveal' ? ' struck' : ''}`} viewBox="0 0 60 220" preserveAspectRatio="none">
            <polygon points="34,0 10,110 26,110 18,220 50,90 32,90 42,0" />
          </svg>

          {phase === 'reveal' && (
            <div className="connected-reveal">
              <div className="connected-particles">
                {PARTICLES.map((p, i) => (
                  <span
                    key={i}
                    className="connected-particle"
                    style={{
                      '--angle': `${p.angle}deg`,
                      '--distance': `${p.distance}px`,
                      '--delay': `${p.delay}s`,
                    }}
                  >⚡</span>
                ))}
              </div>

              <div className="connected-avatars">
                <Avatar url={myAvatarUrl} name={myName} size={88} className="connected-avatar connected-avatar-left" />
                <span className="connected-bolt-icon">⚡</span>
                <Avatar url={otherAvatarUrl} name={otherName} size={88} className="connected-avatar connected-avatar-right" />
              </div>

              <h2 className="connected-title">You're Connected!</h2>
              <p className="connected-sub">You and {otherName || 'this person'} can now message each other and cheer each other on.</p>

              <div className="connected-actions">
                <button className="connected-btn connected-btn-primary" onClick={onMessage}>Send a Message</button>
                {onViewProfile && (
                  <button className="connected-btn connected-btn-secondary" onClick={onViewProfile}>View Profile</button>
                )}
                <button className="connected-btn connected-btn-ghost" onClick={onClose}>Continue</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
