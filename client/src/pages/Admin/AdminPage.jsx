import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext.jsx';
import { supabase } from '../../lib/supabase.js';
import { useToast } from '../../components/common/Toast.jsx';
import { useNavigate } from 'react-router-dom';
import { getDisplayName } from '../../utils/displayName.js';
import './AdminPage.css';

const ADMIN_EMAILS = ['toddwork1995@gmail.com'];

export default function AdminPage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const toast = useToast();
  const [reports, setReports] = useState([]);
  const [issueReports, setIssueReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState('content');
  const [tab, setTab] = useState('pending');

  const isAdmin = ADMIN_EMAILS.includes(user?.email);

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return; }
    fetchReports();
    fetchIssueReports();
  }, [isAdmin]);

  async function fetchReports() {
    setLoading(true);
    const { data } = await supabase
      .from('reports')
      .select('*, reporter:reporter_id(id, email), reported:reported_user_id(id, first_name, last_name)')
      .order('created_at', { ascending: false });
    setReports(data ?? []);
    setLoading(false);
  }

  async function fetchIssueReports() {
    const { data } = await supabase
      .from('issue_reports')
      .select('*, reporter:user_id(id, email, first_name, last_name)')
      .order('created_at', { ascending: false });
    setIssueReports(data ?? []);
  }

  async function updateStatus(id, status) {
    await supabase.from('reports').update({ status }).eq('id', id);
    setReports((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
    toast(`Report marked as ${status}`, 'success');
  }

  async function updateIssueStatus(id, status) {
    await supabase.from('issue_reports').update({ status }).eq('id', id);
    setIssueReports((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
    toast(`Issue marked as ${status}`, 'success');
  }

  async function banUser(userId) {
    if (!window.confirm('Ban this user? This will delete their auth account.')) return;
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-ban-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ userId }),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast(`Couldn't ban user: ${result.error ?? 'Unknown error'}`, 'error');
      return;
    }
    toast('User banned.', 'success');
    fetchReports();
  }

  const filtered = reports.filter((r) => r.status === tab);
  const filteredIssues = issueReports.filter((r) => r.status === tab);
  const activeCounts = section === 'content' ? reports : issueReports;

  if (!isAdmin) return null;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">🛡️ Admin — Reports</h1>
        <div className="admin-tabs admin-section-tabs">
          <button
            className={`admin-tab${section === 'content' ? ' active' : ''}`}
            onClick={() => setSection('content')}
          >
            Content Reports
          </button>
          <button
            className={`admin-tab${section === 'issues' ? ' active' : ''}`}
            onClick={() => setSection('issues')}
          >
            🐞 Issue Reports
            <span className="admin-tab-count">
              {issueReports.filter((r) => r.status === 'pending').length}
            </span>
          </button>
        </div>
        <div className="admin-tabs">
          {['pending', 'reviewed', 'dismissed'].map((t) => (
            <button
              key={t}
              className={`admin-tab${tab === t ? ' active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
              <span className="admin-tab-count">
                {activeCounts.filter((r) => r.status === t).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="admin-loading">Loading reports...</div>
      ) : section === 'content' ? (
        filtered.length === 0 ? (
          <div className="admin-empty">No {tab} reports.</div>
        ) : (
          <div className="admin-reports">
            {filtered.map((r) => (
              <div key={r.id} className="admin-report-card">
                <div className="report-meta">
                  <span className="report-reason">{r.reason}</span>
                  <span className="report-date">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                {r.details && <p className="report-details">"{r.details}"</p>}
                <div className="report-parties">
                  <div><span className="report-label">Reporter:</span> {r.reporter?.email ?? 'Unknown'}</div>
                  <div>
                    <span className="report-label">Reported:</span>{' '}
                    {getDisplayName(r.reported, 'Unknown')}
                  </div>
                  {r.post_id && <div><span className="report-label">Post ID:</span> {r.post_id}</div>}
                </div>
                <div className="report-actions">
                  {r.status === 'pending' && (
                    <>
                      <button className="report-btn reviewed" onClick={() => updateStatus(r.id, 'reviewed')}>
                        ✓ Mark Reviewed
                      </button>
                      <button className="report-btn dismiss" onClick={() => updateStatus(r.id, 'dismissed')}>
                        Dismiss
                      </button>
                    </>
                  )}
                  {r.reported_user_id && (
                    <button className="report-btn ban" onClick={() => banUser(r.reported_user_id)}>
                      Ban User
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : filteredIssues.length === 0 ? (
        <div className="admin-empty">No {tab} issue reports.</div>
      ) : (
        <div className="admin-reports">
          {filteredIssues.map((r) => (
            <div key={r.id} className="admin-report-card">
              <div className="report-meta">
                <span className="report-reason">{r.page_url ?? 'Unknown page'}</span>
                <span className="report-date">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              <p className="report-details">"{r.description}"</p>
              {r.screenshot_url && (
                <a href={r.screenshot_url} target="_blank" rel="noreferrer">
                  <img src={r.screenshot_url} alt="Issue screenshot" className="admin-issue-screenshot" />
                </a>
              )}
              <div className="report-parties">
                <div><span className="report-label">From:</span> {r.reporter?.email ?? getDisplayName(r.reporter, 'Unknown')}</div>
              </div>
              {r.status === 'pending' && (
                <div className="report-actions">
                  <button className="report-btn reviewed" onClick={() => updateIssueStatus(r.id, 'reviewed')}>
                    ✓ Mark Reviewed
                  </button>
                  <button className="report-btn dismiss" onClick={() => updateIssueStatus(r.id, 'dismissed')}>
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
