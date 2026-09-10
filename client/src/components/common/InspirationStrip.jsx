import React, { useRef, useState } from 'react';
import { useInspiration } from '../../hooks/useInspiration.js';
import './InspirationStrip.css';

function InspirationVideo({ item }) {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);

  function toggleMute(e) {
    e.preventDefault();
    e.stopPropagation();
    const next = !muted;
    setMuted(next);
    if (videoRef.current) videoRef.current.muted = next;
  }

  return (
    <a
      className="inspiration-strip-photo inspiration-strip-video"
      href={item.pexelsUrl}
      target="_blank"
      rel="noopener noreferrer"
      title={`Video by ${item.photographer} on Pexels`}
    >
      <video
        ref={videoRef}
        src={item.videoUrl}
        poster={item.posterUrl}
        autoPlay
        loop
        muted={muted}
        playsInline
      />
      <button
        type="button"
        className="inspiration-strip-mute-btn"
        onClick={toggleMute}
        aria-label={muted ? 'Unmute' : 'Mute'}
      >
        {muted ? '🔇' : '🔊'}
      </button>
    </a>
  );
}

// Shown only in an empty/quiet community feed, matched to the viewer's own
// goal -- never mixed into the real post stream. Deliberately labeled so
// it never reads as someone's actual post; see CLAUDE.md-adjacent
// discussion in the Feed/Community work about not faking activity.
export default function InspirationStrip({ query, label }) {
  const { items, loading } = useInspiration(query);

  if (loading) return null;
  if (!items?.length) return null;

  return (
    <div className="inspiration-strip">
      <p className="inspiration-strip-label">Inspiration for {label}</p>
      <div className="inspiration-strip-row">
        {items.map((item) => item.type === 'video' ? (
          <InspirationVideo key={item.id} item={item} />
        ) : (
          <a
            key={item.id}
            className="inspiration-strip-photo"
            href={item.pexelsUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={`Photo by ${item.photographer} on Pexels`}
          >
            <img src={item.url} alt={item.alt} loading="lazy" />
          </a>
        ))}
      </div>
      <p className="inspiration-strip-credit">via Pexels</p>
    </div>
  );
}
