import React from "react";
import { userData } from "../../data/userData";

export default function MediaSection() {
  return (
    <section className="media-section">
      <h2>📸 Photos</h2>
      <div className="media-grid">
        {userData.photos.map((color, i) => (
          <div
            key={i}
            className="photo-item"
            style={{
              background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
            }}
          />
        ))}
      </div>

      <h2 style={{ marginTop: "2rem" }}>🎥 Videos</h2>
      {userData.videos.map((video) => (
        <div className="video-item" key={video.id}>
          <div className="video-thumbnail">▶️</div>
          <div className="video-info">
            <div className="video-title">{video.title}</div>
            <div className="video-duration">{video.duration}</div>
          </div>
        </div>
      ))}
    </section>
  );
}
