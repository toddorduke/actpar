import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { supabase } from '../../lib/supabase.js';
import Avatar from '../../components/common/Avatar.jsx';
import './LeaderboardPage.css';

export default function LeaderboardPage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [metric, setMetric] = useState('streak');
  const [scope, setScope] = useState('local');
  const [leaders, setLeaders] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [myCity, setMyCity] = useState('');
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;
      setLoading(true);

      const { data: myProfile } = await supabase
        .from('profiles')
        .select('city')
        .eq('id', user.id)
        .single();

      const city = myProfile?.city ?? '';
      setMyCity(city);
      if (city) setSelectedCity(city);

      const { data: goalData } = await supabase
        .from('goals')
        .select('user_id, day_count, goal_type, is_active, progress, target_value, profiles!goals_user_id_fkey(id, first_name, last_name, avatar_url, alter_ego_name, city)')
        .eq('is_active', true);

      // Aggregate per user
      const userMap = {};
      for (const g of goalData ?? []) {
        const p = g.profiles;
        if (!p) continue;
        if (!userMap[g.user_id]) {
          userMap[g.user_id] = {
            id: p.id,
            name: `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || 'User',
            avatar_url: p.avatar_url,
            alter_ego: p.alter_ego_name,
            city: p.city ?? '',
            bestStreak: 0,
            totalGoals: 0,
            totalProgress: 0,
          };
        }
        userMap[g.user_id].totalGoals += 1;
        if (g.goal_type !== 'numeric') {
          if ((g.day_count ?? 0) > userMap[g.user_id].bestStreak) {
            userMap[g.user_id].bestStreak = g.day_count ?? 0;
          }
        } else {
          const pct = g.target_value ? ((g.progress ?? 0) / g.target_value) * 100 : 0;
          userMap[g.user_id].totalProgress += pct;
        }
      }

      const allUsers = Object.values(userMap);

      // Collect unique cities
      const citySet = [...new Set(allUsers.map(u => u.city).filter(Boolean))].sort();
      setCities(citySet);
      setLeaders(allUsers);
      setLoading(false);
    }
    load();
  }, [user]);

  function sorted(list) {
    return [...list].sort((a, b) => {
      if (metric === 'streak') return b.bestStreak - a.bestStreak;
      if (metric === 'goals') return b.totalGoals - a.totalGoals;
      return 0;
    });
  }

  const filtered = scope === 'local'
    ? leaders.filter(u => u.city === selectedCity)
    : scope === 'city' && selectedCity
      ? leaders.filter(u => u.city === selectedCity)
      : leaders;

  const ranked = sorted(filtered);
  const myEntry = sorted(leaders).find(u => u.id === user?.id);
  const globalRank = sorted(leaders).findIndex(u => u.id === user?.id) + 1;
  const localRank = sorted(leaders.filter(u => u.city === myCity)).findIndex(u => u.id === user?.id) + 1;

  const medalFor = (i) => {
    if (i === 0) return '🥇';
    if (i === 1) return '🥈';
    if (i === 2) return '🥉';
    return null;
  };

  const scoreFor = (person) => {
    if (metric === 'streak') return { value: person.bestStreak, unit: 'day streak' };
    if (metric === 'goals') return { value: person.totalGoals, unit: 'active goals' };
    return { value: 0, unit: '' };
  };

  return (
    <div className="lb-page">
      <div className="lb-container">

        {/* Header */}
        <div className="lb-header">
          <h1 className="lb-title">🏆 Leaderboard</h1>
          <p className="lb-subtitle">
            {scope === 'local' && myCity ? `Showing leaders in ${myCity}` : 'Showing all users'}
          </p>
        </div>

        {/* My Rank Card */}
        {myEntry && (
          <div className="lb-my-rank-card">
            <div className="lb-my-rank-label">Your Rank</div>
            <div className="lb-my-rank-row">
              <Avatar url={myEntry.avatar_url} name={myEntry.name} size={44} />
              <div className="lb-my-rank-info">
                <div className="lb-my-rank-name">{myEntry.name}</div>
                {myCity && <div className="lb-my-rank-city">📍 {myCity}</div>}
              </div>
              <div className="lb-my-rank-scores">
                {myCity && <div className="lb-my-rank-score"><span className="lb-my-rank-num">#{localRank}</span><span className="lb-my-rank-unit"> local</span></div>}
                <div className="lb-my-rank-score"><span className="lb-my-rank-num">#{globalRank}</span><span className="lb-my-rank-unit"> global</span></div>
                <div className="lb-my-rank-score"><span className="lb-my-rank-num">{myEntry.bestStreak}</span><span className="lb-my-rank-unit"> day streak</span></div>
                <div className="lb-my-rank-score"><span className="lb-my-rank-num">{myEntry.totalGoals}</span><span className="lb-my-rank-unit"> goals</span></div>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="lb-controls">
          {/* Scope */}
          <div className="lb-control-group">
            <button className={`lb-ctrl-btn${scope === 'local' ? ' active' : ''}`} onClick={() => setScope('local')}>
              📍 My City
            </button>
            <button className={`lb-ctrl-btn${scope === 'global' ? ' active' : ''}`} onClick={() => setScope('global')}>
              🌍 Global
            </button>
            <button className={`lb-ctrl-btn${scope === 'city' ? ' active' : ''}`} onClick={() => setScope('city')}>
              🏙️ Browse Cities
            </button>
          </div>

          {/* City picker */}
          {scope === 'city' && (
            <select
              className="lb-city-select"
              value={selectedCity}
              onChange={e => setSelectedCity(e.target.value)}
            >
              <option value="">All cities</option>
              {cities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}

          {/* Metric */}
          <div className="lb-control-group">
            <button className={`lb-ctrl-btn${metric === 'streak' ? ' active' : ''}`} onClick={() => setMetric('streak')}>🔥 Streak</button>
            <button className={`lb-ctrl-btn${metric === 'goals' ? ' active' : ''}`} onClick={() => setMetric('goals')}>🎯 Goals</button>
          </div>
        </div>

        {/* Board */}
        {loading ? (
          <div className="lb-loading">Loading leaderboard...</div>
        ) : ranked.length === 0 ? (
          <div className="lb-empty">
            {scope === 'local' && !myCity
              ? 'Set your city in Settings to see local leaders.'
              : 'No users found for this filter.'}
          </div>
        ) : (
          <div className="lb-board">
            {/* Top 3 podium */}
            {ranked.length >= 3 && (
              <div className="lb-podium">
                {/* 2nd */}
                <div className="lb-podium-slot lb-podium-2" onClick={() => navigate(`/profile/${ranked[1].id}`)}>
                  <Avatar url={ranked[1].avatar_url} name={ranked[1].name} size={52} />
                  <div className="lb-podium-medal">🥈</div>
                  <div className="lb-podium-name">{ranked[1].name.split(' ')[0]}</div>
                  <div className="lb-podium-score">{scoreFor(ranked[1]).value} <span>{scoreFor(ranked[1]).unit}</span></div>
                  <div className="lb-podium-bar lb-podium-bar-2" />
                </div>
                {/* 1st */}
                <div className="lb-podium-slot lb-podium-1" onClick={() => navigate(`/profile/${ranked[0].id}`)}>
                  <div className="lb-podium-crown">👑</div>
                  <Avatar url={ranked[0].avatar_url} name={ranked[0].name} size={68} />
                  <div className="lb-podium-medal">🥇</div>
                  <div className="lb-podium-name">{ranked[0].name.split(' ')[0]}</div>
                  <div className="lb-podium-score">{scoreFor(ranked[0]).value} <span>{scoreFor(ranked[0]).unit}</span></div>
                  <div className="lb-podium-bar lb-podium-bar-1" />
                </div>
                {/* 3rd */}
                <div className="lb-podium-slot lb-podium-3" onClick={() => navigate(`/profile/${ranked[2].id}`)}>
                  <Avatar url={ranked[2].avatar_url} name={ranked[2].name} size={44} />
                  <div className="lb-podium-medal">🥉</div>
                  <div className="lb-podium-name">{ranked[2].name.split(' ')[0]}</div>
                  <div className="lb-podium-score">{scoreFor(ranked[2]).value} <span>{scoreFor(ranked[2]).unit}</span></div>
                  <div className="lb-podium-bar lb-podium-bar-3" />
                </div>
              </div>
            )}

            {/* Full ranked list */}
            <div className="lb-rows">
              {ranked.map((person, i) => {
                const isMe = person.id === user?.id;
                const medal = medalFor(i);
                const score = scoreFor(person);
                return (
                  <div
                    key={person.id}
                    className={`lb-row${isMe ? ' lb-row-me' : ''}`}
                    onClick={() => navigate(isMe ? '/profile' : `/profile/${person.id}`)}
                  >
                    <div className="lb-row-rank">
                      {medal ? <span className="lb-row-medal">{medal}</span> : <span className="lb-row-num">#{i + 1}</span>}
                    </div>
                    <Avatar url={person.avatar_url} name={person.name} size={38} />
                    <div className="lb-row-info">
                      <div className="lb-row-name">{person.name} {isMe && <span className="lb-row-you">You</span>}</div>
                      {person.alter_ego && <div className="lb-row-ego">⚡ {person.alter_ego}</div>}
                      {person.city && scope !== 'local' && <div className="lb-row-city">📍 {person.city}</div>}
                    </div>
                    <div className="lb-row-score">
                      <span className="lb-row-score-num">{score.value}</span>
                      <span className="lb-row-score-unit">{score.unit}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
