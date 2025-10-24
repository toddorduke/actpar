import React from "react";
import { userData } from "../../data/userData";

export default function ProfileHeader() {
  return (
    <header className="profile-header">
      <h1>🎯 Goal Pyramid</h1>
      <div className="intro">
        <h3>⚡ Alter Ego: {userData.alterEgo}</h3>

        <h5><strong>💪 5 Strengths:</strong></h5>
        <div className="tag-list">
          {userData.strengths.map((item, index) => (
            <span className="tag" key={index}>{item}</span>
          ))}
        </div>

        <h5 style={{ marginTop: 20 }}><strong>🌱 3 Growth Areas:</strong></h5>
        <div className="tag-list">
          {userData.growthAreas.map((item, index) => (
            <span className="tag" key={index}>{item}</span>
          ))}
        </div>
      </div>
    </header>
  );
}
import React from "react";
import ProfileHeader from "../components/profile/ProfileHeader";
import GoalPyramid from "../components/profile/GoalPyramid";
import MediaSection from "../components/profile/MediaSection";
import TribeSection from "../components/profile/TribeSection";

export default function ProfilePage() {
  return (
    <main className="profile-page">
      <ProfileHeader />
      <GoalPyramid />
      <MediaSection />
      <TribeSection />
    </main>
  );
}
