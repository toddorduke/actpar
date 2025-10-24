import React from "react";
import { userData } from "../../data/userData";
import "./GoalPyramid.css";

export default function GoalPyramid() {
  return (
    <section className="goal-pyramid">
      {userData.goals.map((goal, index) => {
        const percent = (goal.day / 90) * 100;
        const width = 100 - index * 12;
        return (
          <div className="goal-level" key={goal.id}>
            <div className="goal-card" style={{ width: `${width}%` }}>
              <div className="goal-header">
                <span className="goal-title">{goal.title}</span>
                <span className="priority-badge">P{goal.priority}</span>
              </div>

              <div className="day-count">
                <div className="day-number">{goal.day}</div>
                <div className="day-label">days</div>
              </div>

              <div className="progress-bar-container">
                <div className="progress-info">
                  <span>Progress to 90 days</span>
                  <span><strong>{Math.round(percent)}%</strong></span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${percent}%` }}>
                    {percent > 20 && (
                      <span className="progress-percentage">{Math.round(percent)}%</span>
                    )}
                  </div>
                </div>
              </div>

              {goal.partners.length > 0 && (
                <div className="partners">
                  <span>🤝 Partners: {goal.partners.join(", ")}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
