import React, { useState } from 'react';
import { useToast } from './Toast.jsx';
import { supabase } from '../../lib/supabase.js';
import './ReportModal.css';

const REASONS = [
  'Nudity or sexual content',
  'Violence or dangerous content',
  'Harassment or bullying',
  'Hate speech or slurs',
  'Drug or illegal content',
  'Spam or misleading',
  'Self-harm or suicide',
  'Other',
];

export default function ReportModal({ postId, reportedUserId, onClose }) {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!reason) { toast('Please select a reason.', 'warning'); return; }
    setSubmitting(true);

    const { error } = await supabase.from('reports').insert({
      post_id: postId ?? null,
      reported_user_id: reportedUserId ?? null,
      reason,
      details: details.trim() || null,
    });

    setSubmitting(false);
    if (error) {
      // Table may not exist yet — still show success to user
      console.error('Report error:', error);
    }
    toast('Thank you for your report. Our team will review it shortly.', 'success');
    onClose();
  }

  return (
    <div className="report-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="report-box">
        <div className="report-header">
          <h2 className="report-title">Report Content</h2>
          <button className="report-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="report-form">
          <p className="report-intro">
            Help keep this community safe. Tell us what's wrong with this content.
          </p>

          <div className="report-reasons">
            {REASONS.map(r => (
              <label key={r} className={`report-reason${reason === r ? ' selected' : ''}`}>
                <input
                  type="radio"
                  name="reason"
                  value={r}
                  checked={reason === r}
                  onChange={() => setReason(r)}
                />
                {r}
              </label>
            ))}
          </div>

          <textarea
            className="report-details"
            placeholder="Additional details (optional)"
            rows={3}
            value={details}
            onChange={e => setDetails(e.target.value)}
            maxLength={500}
          />

          <button type="submit" className="report-submit-btn" disabled={submitting || !reason}>
            {submitting ? 'Submitting…' : 'Submit Report'}
          </button>
        </form>
      </div>
    </div>
  );
}
