// ========================================
// USER DATA
// ========================================
// In production, this would come from an API/database
const userData = {
    name: "Alex Johnson",
    tagline: "Building better habits, one day at a time",
    goals: [
        { 
            id: 1, 
            title: "Morning Meditation", 
            day: 45, 
            priority: 1, 
            partners: ["Sarah M.", "Mike T."] 
        },
        { 
            id: 2, 
            title: "Exercise Daily", 
            day: 23, 
            priority: 2, 
            partners: [] 
        },
        { 
            id: 3, 
            title: "Read 30min", 
            day: 67, 
            priority: 3, 
            partners: ["Emma L."] 
        },
        { 
            id: 4, 
            title: "Healthy Eating", 
            day: 12, 
            priority: 4, 
            partners: ["Sarah M."] 
        }
    ],
    photos: [
        { id: 1, color: '#3b82f6' },
        { id: 2, color: '#8b5cf6' },
        { id: 3, color: '#ec4899' },
        { id: 4, color: '#10b981' },
        { id: 5, color: '#f59e0b' },
        { id: 6, color: '#ef4444' }
    ],
    videos: [
        { id: 1, title: "Journey Update", duration: "2:34" },
        { id: 2, title: "Milestone Celebration", duration: "1:15" }
    ],
    tribe: [
        { id: 1, name: "Sarah M.", status: "online" },
        { id: 2, name: "Mike T.", status: "offline" },
        { id: 3, name: "Emma L.", status: "online" },
        { id: 4, name: "Josh K.", status: "offline" },
        { id: 5, name: "Maya P.", status: "online" }
    ]
};

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Calculate percentage progress towards 90-day goal
 */
function calculateProgress(currentDay) {
    return Math.min((currentDay / 90) * 100, 100);
}

/**
 * Create SVG icon for partners
 */
function createPartnersIcon() {
    return `
        <svg class="partners-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z">
            </path>
        </svg>
    `;
}

/**
 * Create SVG icon for trophy/achievement
 */
function createTrophyIcon() {
    return `
        <svg class="badge-icon" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path>
            <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
        </svg>
    `;
}

// ========================================
// RENDER FUNCTIONS
// ========================================

/**
 * Render user header information
 */
function renderHeader() {
    document.getElementById('user-name').textContent = userData.name;
    document.getElementById('user-tagline').textContent = userData.tagline;
}

/**
 * Render goal pyramid
 */
function renderGoalPyramid() {
    const container = document.getElementById('pyramid-container');
    container.innerHTML = ''; // Clear existing content

    userData.goals.forEach((goal, index) => {
        const percentage = calculateProgress(goal.day);
        
        // Create goal level wrapper
        const goalLevel = document.createElement('div');
        goalLevel.className = 'goal-level';
        
        // Create goal card
        const goalCard = document.createElement('div');
        goalCard.className = `goal-card priority-${goal.priority}`;
        
        // Build achievement badges if applicable
        let achievementBadges = '';
        if (goal.day >= 30) {
            achievementBadges = '<div class="achievement-badges">';
            if (goal.day >= 30) {
                achievementBadges += `
                    <span class="badge">
                        ${createTrophyIcon()}
                        30-Day Streak
                    </span>
                `;
            }
            if (goal.day >= 60) {
                achievementBadges += `
                    <span class="badge">
                        ${createTrophyIcon()}
                        60-Day Streak
                    </span>
                `;
            }
            achievementBadges += '</div>';
        }
        
        // Build goal card HTML
        goalCard.innerHTML = `
            <div class="goal-header">
                <h3 class="goal-title">${goal.title}</h3>
                <div class="goal-meta">
                    <span class="priority-badge">Priority ${goal.priority}</span>
                    <div class="day-count">
                        <div class="day-number">${goal.day}</div>
                        <div class="day-label">days</div>
                    </div>
                </div>
            </div>
            
            ${goal.partners.length > 0 ? `
                <div class="partners">
                    ${createPartnersIcon()}
                    <span>Partners: ${goal.partners.join(', ')}</span>
                </div>
            ` : ''}
            
            <div class="progress-container">
                <div class="progress-info">
                    <span>Progress to 90 days</span>
                    <strong>${Math.round(percentage)}%</strong>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percentage}%">
                        ${percentage > 20 ? `<span class="progress-percentage">${Math.round(percentage)}%</span>` : ''}
                    </div>
                </div>
                <div class="milestone-markers">
                    <span>0</span>
                    <span>30</span>
                    <span>60</span>
                    <span>90</span>
                </div>
            </div>
            
            ${achievementBadges}
        `;
        
        goalLevel.appendChild(goalCard);
        container.appendChild(goalLevel);
        
        // Animate progress bar after render
        setTimeout(() => {
            const progressFill = goalCard.querySelector('.progress-fill');
            if (progressFill) {
                progressFill.style.width = `${percentage}%`;
            }
        }, 100 * index);
    });
}

/**
 * Render photos grid
 */
function renderPhotos() {
    const container = document.getElementById('photos-grid');
    container.innerHTML = '';

    userData.photos.forEach(photo => {
        const photoDiv = document.createElement('div');
        photoDiv.className = 'photo-item';
        photoDiv.style.background = `linear-gradient(135deg, ${photo.color} 0%, ${photo.color}dd 100%)`;
        photoDiv.onclick = () => {
            alert(`Photo ${photo.id} clicked! You can implement a lightbox here.`);
        };
        container.appendChild(photoDiv);
    });
}

/**
 * Render videos list
 */
function renderVideos() {
    const container = document.getElementById('videos-container');
    container.innerHTML = '';

    userData.videos.forEach(video => {
        const videoDiv = document.createElement('div');
        videoDiv.className = 'video-item';
        videoDiv.innerHTML = `
            <div class="video-thumbnail">▶️</div>
            <div class="video-info">
                <div class="video-title">${video.title}</div>
                <div class="video-duration">${video.duration}</div>
            </div>
        `;
        videoDiv.onclick = () => {
            alert(`Playing video: ${video.title}`);
        };
        container.appendChild(videoDiv);
    });
}

/**
 * Render accountability tribe
 */
function renderTribe() {
    const container = document.getElementById('tribe-grid');
    container.innerHTML = '';

    userData.tribe.forEach(member => {
        const memberDiv = document.createElement('div');
        memberDiv.className = 'tribe-member';
        memberDiv.innerHTML = `
            <div class="tribe-avatar">
                <span class="status-indicator status-${member.status}"></span>
            </div>
            <div class="tribe-name">${member.name}</div>
        `;
        memberDiv.onclick = () => {
            alert(`View ${member.name}'s profile`);
        };
        container.appendChild(memberDiv);
    });
}

// ========================================
// INITIALIZE APP
// ========================================

/**
 * Initialize the application when DOM is ready
 */
function init() {
    renderHeader();
    renderGoalPyramid();
    renderPhotos();
    renderVideos();
    renderTribe();
    
    console.log('User Profile App initialized successfully!');
}

// Run initialization when DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// ========================================
// EXPORT FOR FUTURE USE (if using modules)
// ========================================
// Uncomment if you want to use ES6 modules later
// export { userData, renderGoalPyramid, renderPhotos, renderVideos, renderTribe };