import React from 'react';
import './ConfirmDialog.css';

export default function ConfirmDialog({ message, onConfirm, onCancel, confirmLabel = 'Confirm', danger = false }) {
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="confirm-cancel-btn" onClick={onCancel}>Cancel</button>
          <button className={`confirm-ok-btn${danger ? ' danger' : ''}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
