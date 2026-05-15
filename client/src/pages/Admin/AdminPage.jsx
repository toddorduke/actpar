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
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');

  const isAdmin = ADMIN_EMAILS.includes(user?.email);

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return; }
    fetchReports();
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

  async function updateStatus(id, status) {
    await supabase.from('reports').update({ status }).eq('id', id);
    setReports((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
    toast(`Report marked as ${status}`, 'success');
  }

  async function banUser(userId) {
    if (!window.confirm('Ban this user? This will delete their auth account.')) return;
    await supabase.auth.admin.deleteUser(userId);
    toast('User banned.', 'success');
    fetchReports();
  }

  const filtered = reports.filter((r) => r.status === tab);

  if (!isAdmin) return null;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">🛡️ Admin — Reports</h1>
        <div className="admin-tabs">
          {['pending', 'reviewed', 'dismissed'].map((t) => (
            <button
              key={t}
              className={`admin-tab${tab === t ? ' active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
              <span className="admin-tab-count">
                {reports.filter((r) => r.status === t).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="admin-loading">Loading reports...</div>
      ) : filtered.length === 0 ? (
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
      )}
    </div>
  );
}
