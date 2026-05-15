import React, { useState } from 'react';
import { getDisplayName } from '../../utils/displayName.js';
import './SparkModal.css';

const DAILY_LIMIT = 5;
const SPARK_KEY = () => `actpar_sparks_${new Date().toISOString().split('T')[0]}`;

export function getSparksUsedToday() {
  return Number(localStorage.getItem(SPARK_KEY()) ?? 0);
}

function incrementSparksUsed() {
  const key = SPARK_KEY();
  localStorage.setItem(key, String(getSparksUsedToday() + 1));
}

export default function SparkModal({ profile, onSend, onClose }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const used = getSparksUsedToday();
  const remaining = Math.max(0, DAILY_LIMIT - used);
  const name = getDisplayName(profile, 'this person');
  const canSend = remaining > 0 && message.trim().length >= 10;

  async function handleSend() {
    if (!canSend) return;
    setSending(true);
    const { error } = await onSend(message.trim());
    if (!error) {
      incrementSparksUsed();
      onClose();
    }
    setSending(false);
  }

  return (
    <div className="spark-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="spark-modal">
        <button className="spark-modal-close" onClick={onClose}>×</button>

        <div className="spark-modal-header">
          <span className="spark-modal-icon">⚡</span>
          <h2 className="spark-modal-title">Send a Spark</h2>
          <p className="spark-modal-sub">
            Sparks go to the top of {name}'s inbox with your message.
            You get <strong>{DAILY_LIMIT} sparks per day</strong>.
          </p>
        </div>

        <div className="spark-modal-body">
          {remaining === 0 ? (
            <div className="spark-out">
              <span className="spark-out-icon">⚡</span>
              <p className="spark-out-text">You've used all your sparks today. They reset at midnight.</p>
            </div>
          ) : (
            <>
              <div className="spark-remaining">
                {Array.from({ length: DAILY_LIMIT }).map((_, i) => (
                  <span key={i} className={`spark-pip${i < remaining ? ' lit' : ''}`}>⚡</span>
                ))}
                <span className="spark-remaining-label">{remaining} remaining today</span>
              </div>

              <label className="spark-label">Your message <span className="spark-label-req">(required)</span></label>
              <textarea
                className="spark-textarea"
                placeholder={`Tell ${profile.first_name ?? name} why you want to connect…`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={200}
                rows={4}
                autoFocus
              />
              <div className="spark-char-count">{message.length}/200 {message.length < 10 && message.length > 0 && <span className="spark-char-warn">— at least 10 characters</span>}</div>
            </>
          )}
        </div>

        <div className="spark-modal-actions">
          <button className="spark-cancel-btn" onClick={onClose}>Cancel</button>
          {remaining > 0 && (
            <button className="spark-send-btn-modal" onClick={handleSend} disabled={!canSend || sending}>
              {sending ? 'Sending…' : 'Send Spark ⚡'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
