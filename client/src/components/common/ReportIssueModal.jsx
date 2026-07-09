import React, { useContext, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { supabase } from '../../lib/supabase.js';
import { validateFileType, validateFileSize } from '../../utils/contentModeration.js';
import { useToast } from './Toast.jsx';
import './ReportIssueModal.css';

export default function ReportIssueModal({ onClose }) {
  const { user } = useContext(AuthContext);
  const { pathname } = useLocation();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [description, setDescription] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const typeCheck = validateFileType(file);
    if (!typeCheck.ok) { toast(typeCheck.message, 'error'); return; }
    const sizeCheck = validateFileSize(file);
    if (!sizeCheck.ok) { toast(sizeCheck.message, 'error'); return; }

    setScreenshot(file);
    setScreenshotPreview(URL.createObjectURL(file));
  }

  function removeScreenshot() {
    setScreenshot(null);
    setScreenshotPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!description.trim()) { toast('Please describe what happened.', 'warning'); return; }
    setSubmitting(true);

    let screenshotUrl = null;
    if (screenshot) {
      const ext = screenshot.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('issue-screenshots')
        .upload(path, screenshot, { cacheControl: '3600', upsert: false });
      if (uploadError) {
        toast(`Couldn't upload screenshot: ${uploadError.message}`, 'error');
        setSubmitting(false);
        return;
      }
      screenshotUrl = supabase.storage.from('issue-screenshots').getPublicUrl(path).data.publicUrl;
    }

    const { error } = await supabase.from('issue_reports').insert({
      user_id: user.id,
      description: description.trim(),
      screenshot_url: screenshotUrl,
      page_url: pathname,
    });

    setSubmitting(false);
    if (error) { toast(`Couldn't submit: ${error.message}`, 'error'); return; }
    toast('Thanks for letting us know! We\'ll take a look.', 'success');
    onClose();
  }

  return (
    <div className="report-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="report-box">
        <div className="report-header">
          <h2 className="report-title">Report an Issue</h2>
          <button className="report-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="report-form">
          <p className="report-intro">
            Something broken, confusing, or just not working right? Tell us what happened — a screenshot helps a lot.
          </p>

          <textarea
            className="report-details"
            placeholder="What happened? What did you expect to happen instead?"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={1000}
            autoFocus
          />

          {screenshotPreview ? (
            <div className="issue-screenshot-preview">
              <img src={screenshotPreview} alt="Screenshot preview" />
              <button type="button" className="issue-screenshot-remove" onClick={removeScreenshot}>
                Remove
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="issue-screenshot-add-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              📎 Attach a screenshot (optional)
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <button type="submit" className="report-submit-btn" disabled={submitting || !description.trim()}>
            {submitting ? 'Submitting…' : 'Submit Report'}
          </button>
        </form>
      </div>
    </div>
  );
}
