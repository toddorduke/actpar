import React, { useState } from 'react';
import ReportIssueModal from './ReportIssueModal.jsx';
import './ReportIssueButton.css';

export default function ReportIssueButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="report-issue-tab"
        onClick={() => setOpen(true)}
        aria-label="Report an issue"
        title="Report an issue"
      >
        🚩 Feedback
      </button>
      {open && <ReportIssueModal onClose={() => setOpen(false)} />}
    </>
  );
}
