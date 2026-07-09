import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { supabase } from '../../lib/supabase.js';
import { getDisplayName } from '../../utils/displayName.js';
import Avatar from './Avatar.jsx';
import './GlobalSearch.css';

export default function GlobalSearch({ onClose }) {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [communityResults, setCommunityResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const search = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); setCommunityResults([]); return; }
    setLoading(true);
    const [{ data: people }, { data: communities }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, first_name, last_name, alter_ego_name, avatar_url, tagline')
        .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,alter_ego_name.ilike.%${q}%`)
        .neq('id', user.id)
        .limit(8),
      supabase
        .from('communities')
        .select('id, name, description, avatar_url')
        .ilike('name', `%${q}%`)
        .limit(5),
    ]);
    setResults(people ?? []);
    setCommunityResults(communities ?? []);
    setLoading(false);
  }, [user.id]);

  function handleChange(e) {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(val), 250);
  }

  function goToProfile(id) {
    navigate(`/profile/${id}`);
    onClose();
  }

  function goToCommunity(id) {
    navigate(`/community/${id}`);
    onClose();
  }

  const hasResults = results.length > 0 || communityResults.length > 0;

  return (
    <div className="gs-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="gs-panel">
        <div className="gs-input-row">
          <svg className="gs-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            className="gs-input"
            placeholder="Search people or communities…"
            value={query}
            onChange={handleChange}
          />
          <button className="gs-close" onClick={onClose}>×</button>
        </div>

        <div className="gs-results">
          {loading && <p className="gs-status">Searching…</p>}

          {!loading && query.trim() && !hasResults && (
            <p className="gs-status">Nothing found for "{query}"</p>
          )}

          {!loading && !query.trim() && (
            <p className="gs-hint">Start typing to find people or communities on ActPar</p>
          )}

          {!loading && results.length > 0 && (
            <>
              {communityResults.length > 0 && <div className="gs-section-label">People</div>}
              {results.map((p) => {
                const name = getDisplayName(p, 'Unknown');
                return (
                  <button key={p.id} className="gs-result" onClick={() => goToProfile(p.id)}>
                    <Avatar url={p.avatar_url} name={name} size={42} />
                    <div className="gs-result-info">
                      <span className="gs-result-name">{name}</span>
                      {p.alter_ego_name && (
                        <span className="gs-result-ego">⚡ {p.alter_ego_name}</span>
                      )}
                      {p.tagline && (
                        <span className="gs-result-tagline">{p.tagline}</span>
                      )}
                    </div>
                    <svg className="gs-result-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                );
              })}
            </>
          )}

          {!loading && communityResults.length > 0 && (
            <>
              {results.length > 0 && <div className="gs-section-label">Communities</div>}
              {communityResults.map((c) => (
                <button key={c.id} className="gs-result" onClick={() => goToCommunity(c.id)}>
                  {c.avatar_url ? (
                    <img className="gs-result-community-avatar" src={c.avatar_url} alt={c.name} />
                  ) : (
                    <div className="gs-result-community-avatar gs-result-community-avatar-fallback">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="gs-result-info">
                    <span className="gs-result-name">{c.name}</span>
                    {c.description && (
                      <span className="gs-result-tagline">{c.description}</span>
                    )}
                  </div>
                  <svg className="gs-result-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
