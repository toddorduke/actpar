import React from "react";
import { userData } from "../../data/userData";

export default function TribeSection() {
  return (
    <section className="tribe-section">
      <h2>👥 Accountability Tribe</h2>
      <div className="tribe-grid">
        {userData.tribe.map((member) => (
          <div className="tribe-member" key={member.id}>
            <div
              className="tribe-avatar"
              style={{
                background: member.status === "online"
                  ? "linear-gradient(135deg, #10b981 0%, #34d399 100%)"
                  : "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)",
              }}
            />
            <div className="tribe-name">{member.name}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
