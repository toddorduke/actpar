// ========================================
// USER DATA
// ========================================
const homeData = {
    userName: "Alex",
    questions: [
        {
            id: 1,
            text: "What's one thing you're grateful for today?",
            category: "gratitude"
        },
        {
            id: 2,
            text: "What's the biggest win you had this week with your goals?",
            category: "reflection"
        },
        {
            id: 3,
            text: "What's one challenge you're facing right now, and how can your tribe help?",
            category: "support"
        }
    ],
    userGoals: [
        { id: 1, name: "Morning Meditation", day: 45, progress: 50 },
        { id: 2, name: "Exercise Daily", day: 23, progress: 25.5 },
        { id: 3, name: "Read 30min", day: 67, progress: 74.4 }
    ],
    videoSnippets: [
        {
            id: 1,
            title: "5 Habits of Successful People",
            author: "Sarah M.",
            thumbnail: "#667eea"
        },
        {
            id: 2,
            title: "Morning Routine Tips",
            author: "Mike T.",
            thumbnail: "#764ba2"
        },
        {
            id: 3,
            title: "Staying Consistent",
            author: "Emma L.",
            thumbnail: "#f093fb"
        },
        {
            id: 4,
            title: "Overcoming Obstacles",
            author: "Josh K.",
            thumbnail: "#f5576c"
        }
    ],
    activeMembers: [
        { id: 1, name: "Sarah Martinez", status: "Completed daily meditation", online: true },
        { id: 2, name: "Mike Thompson", status: "Just hit 30-day streak! 🔥", online: true },
        { id: 3, name: "Emma Lewis", status: "Working on goal #3", online: true },
        { id: 4, name: "Josh Kim", status: "Posted new video", online: false },
        { id: 5, name: "Maya Patel", status: "Looking for workout partner", online: true }
    ],
    suggestedConnections: [
        { id: 1, name: "Alex Rodriguez", mutualFriends: 5 },
        { id: 2, name: "Lisa Chen", mutualFriends: 3 },
        { id: 3, name: "David Park", mutualFriends: 7 }
    ],
    trendingTopics: [
        { tag: "#MorningRoutine", posts: 234 },
        { tag: "#FitnessGoals", posts: 189 },
        { tag: "#MindfulnessChallenge", posts: 156 },
        { tag: "#30DayChallenge", posts: 142 }
    ]
};

// ========================================
// RENDER FUNCTIONS
// ========================================

/**
 * Render daily reflection questions
 */
function renderQuestions() {
    const container = document.getElementById('questions-container');
    container.innerHTML = '';

    homeData.questions.forEach(question => {
        const questionCard = document.createElement('div');
        questionCard.className = 'question-card';
        questionCard.innerHTML = `
            <div class="question-text">${question.text}</div>
            <textarea 
                class="answer-input" 
                placeholder="Share your thoughts..."
                id="answer-${question.id}"
            ></textarea>
            <button class="submit-answer" onclick="submitAnswer(${question.id})">
                Submit Answer
            </button>
        `;
        container.appendChild(questionCard);
    });
}

/**
 * Handle answer submission
 */
function submitAnswer(questionId) {
    const answer = document.getElementById(`answer-${questionId}`).value;
    if (answer.trim()) {
        alert(`Your answer has been saved! 💫\n\n"${answer}"`);
        document.getElementById(`answer-${questionId}`).value = '';
    } else {
        alert('Please write an answer before submitting.');
    }
}

/**
 * Render user's active goals
 */
function renderGoals() {
    const container = document.getElementById('goals-feed');
    container.innerHTML = '';

    homeData.userGoals.forEach(goal => {
        const goalItem = document.createElement('div');
        goalItem.className = 'goal-item';
        goalItem.innerHTML = `
            <div class="goal-item-header">
                <span class="goal-name">${goal.name}</span>
                <span class="goal-day">Day ${goal.day}</span>
            </div>
            <div class="goal-progress">
                <div class="goal-progress-fill" style="width: ${goal.progress}%"></div>
            </div>
        `;
        container.appendChild(goalItem);
    });
}

/**
 * Render video snippets
 */
function renderVideos() {
    const container = document.getElementById('video-snippets');
    container.innerHTML = '';

    homeData.videoSnippets.forEach(video => {
        const videoCard = document.createElement('div');
        videoCard.className = 'video-card';
        videoCard.onclick = () => {
            alert(`Playing: ${video.title}\nBy: ${video.author}`);
        };
        videoCard.innerHTML = `
            <div class="video-thumbnail" style="background: linear-gradient(135deg, ${video.thumbnail} 0%, ${video.thumbnail}cc 100%)">
                <div class="play-button">▶️</div>
                <div class="video-overlay">
                    <div class="video-title">${video.title}</div>
                    <div class="video-author">${video.author}</div>
                </div>
            </div>
        `;
        container.appendChild(videoCard);
    });
}

/**
 * Render active members
 */
function renderActiveMembers() {
    const container = document.getElementById('active-members');
    container.innerHTML = '';

    homeData.activeMembers.forEach(member => {
        const memberItem = document.createElement('div');
        memberItem.className = 'member-item';
        memberItem.onclick = () => {
            alert(`View ${member.name}'s profile`);
        };
        memberItem.innerHTML = `
            <div class="member-avatar">
                ${member.online ? '<span class="online-indicator"></span>' : ''}
            </div>
            <div class="member-info">
                <div class="member-name">${member.name}</div>
                <div class="member-status">${member.status}</div>
            </div>
        `;
        container.appendChild(memberItem);
    });
}

/**
 * Render suggested connections
 */
function renderSuggestedConnections() {
    const container = document.getElementById('suggested-people');
    container.innerHTML = '';

    homeData.suggestedConnections.forEach(person => {
        const personDiv = document.createElement('div');
        personDiv.className = 'suggested-person';
        personDiv.innerHTML = `
            <div class="suggested-avatar"></div>
            <div class="suggested-info">
                <div class="suggested-name">${person.name}</div>
                <div class="suggested-mutual">${person.mutualFriends} mutual friends</div>
            </div>
            <button class="connect-btn" onclick="connectWithUser(${person.id}, '${person.name}')">
                Connect
            </button>
        `;
        container.appendChild(personDiv);
    });
}

/**
 * Handle connection request
 */
function connectWithUser(userId, userName) {
    alert(`Connection request sent to ${userName}! 🤝`);
    // In production, this would send an API request
}

/**
 * Render trending topics
 */
function renderTrendingTopics() {
    const container = document.getElementById('trending-topics');
    container.innerHTML = '';

    homeData.trendingTopics.forEach(topic => {
        const topicItem = document.createElement('div');
        topicItem.className = 'topic-item';
        topicItem.onclick = () => {
            alert(`Viewing posts tagged with ${topic.tag}`);
        };
        topicItem.innerHTML = `
            <div class="topic-tag">${topic.tag}</div>
            <div class="topic-count">${topic.posts} posts</div>
        `;
        container.appendChild(topicItem);
    });
}

/**
 * Update user name in welcome section
 */
function updateUserName() {
    document.getElementById('user-name').textContent = homeData.userName;
}

// ========================================
// INITIALIZE APP
// ========================================

/**
 * Initialize the home page when DOM is ready
 */
function init() {
    updateUserName();
    renderQuestions();
    renderGoals();
    renderVideos();
    renderActiveMembers();
    renderSuggestedConnections();
    renderTrendingTopics();
    
    console.log('Home page initialized successfully! 🎉');
}

// Run initialization when DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Make functions globally accessible for onclick handlers
window.submitAnswer = submitAnswer;
window.connectWithUser = connectWithUser;