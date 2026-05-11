// ========================================
// COMMUNITY DATA
// ========================================
const communityData = {
    currentFilter: 'all',
    currentPostType: 'general',
    
    posts: [
        {
            id: 1,
            type: 'achievement',
            author: 'Sarah Martinez',
            timestamp: '2 hours ago',
            content: 'I just completed my 60-day meditation streak! This journey has been incredible. Started with just 5 minutes a day and now doing 30-minute sessions. Feeling more centered and focused than ever! 🧘‍♀️',
            milestone: '60-Day Meditation Streak',
            likes: 47,
            comments: 12
        },
        {
            id: 2,
            type: 'meetup',
            author: 'Mike Thompson',
            timestamp: '4 hours ago',
            content: 'Let\'s get moving together! Looking for accountability partners for early morning runs.',
            meetup: {
                title: 'Morning Run Group',
                date: '2025-11-02',
                time: '06:00',
                location: 'Central Park, North Entrance'
            },
            likes: 23,
            comments: 8,
            attending: 5
        },
        {
            id: 3,
            type: 'general',
            author: 'Emma Lewis',
            timestamp: '6 hours ago',
            content: 'Anyone else struggling with consistency on weekends? I do great Monday-Friday but weekends throw me off track. Would love to hear your strategies! 💪',
            likes: 34,
            comments: 19
        },
        {
            id: 4,
            type: 'achievement',
            author: 'Josh Kim',
            timestamp: '1 day ago',
            content: 'Hit my weight loss goal! Down 25 pounds in 3 months. Couldn\'t have done it without this amazing community keeping me accountable. Thank you all! 🎉',
            milestone: '25 Pounds Lost',
            likes: 89,
            comments: 31
        },
        {
            id: 5,
            type: 'meetup',
            author: 'Maya Patel',
            timestamp: '1 day ago',
            content: 'Virtual book club for personal development enthusiasts! We\'ll discuss "Atomic Habits" this month.',
            meetup: {
                title: 'Personal Growth Book Club',
                date: '2025-11-05',
                time: '19:00',
                location: 'Zoom (link will be shared)'
            },
            likes: 41,
            comments: 15,
            attending: 12
        },
        {
            id: 6,
            type: 'general',
            author: 'Alex Rodriguez',
            timestamp: '2 days ago',
            content: 'Just wanted to share: small progress is still progress. I only worked out 3 days this week instead of my goal of 5, but that\'s still 3 more than doing nothing. Keep going everyone! 💪',
            likes: 67,
            comments: 24
        }
    ],

    trending: [
        { tag: '#MorningRoutine', posts: 234 },
        { tag: '#FitnessGoals', posts: 189 },
        { tag: '#MindfulnessChallenge', posts: 156 },
        { tag: '#30DayChallenge', posts: 142 },
        { tag: '#HealthyEating', posts: 128 }
    ],

    upcomingMeetups: [
        { title: 'Morning Run Group', date: 'Nov 2, 6:00 AM' },
        { title: 'Yoga & Meditation', date: 'Nov 3, 7:00 PM' },
        { title: 'Book Club Meeting', date: 'Nov 5, 7:00 PM' }
    ],

    topContributors: [
        { name: 'Sarah Martinez', posts: 47 },
        { name: 'Mike Thompson', posts: 39 },
        { name: 'Emma Lewis', posts: 34 },
        { name: 'Josh Kim', posts: 31 },
        { name: 'Maya Patel', posts: 28 }
    ],

    leaderboard: [
        { rank: 1, name: 'Josh Kim', achievement: '90-day streak', score: 950 },
        { rank: 2, name: 'Sarah Martinez', achievement: '60-day streak', score: 820 },
        { rank: 3, name: 'Maya Patel', achievement: '45-day streak', score: 710 },
        { rank: 4, name: 'Mike Thompson', achievement: '30-day streak', score: 650 },
        { rank: 5, name: 'Emma Lewis', achievement: '30-day streak', score: 620 }
    ]
};

// ========================================
// RENDER FUNCTIONS
// ========================================

/**
 * Render all posts in the feed
 */
function renderPosts() {
    const container = document.getElementById('feed-container');
    container.innerHTML = '';

    // Filter posts based on current filter
    const filteredPosts = communityData.currentFilter === 'all' 
        ? communityData.posts 
        : communityData.posts.filter(post => {
            if (communityData.currentFilter === 'achievements') return post.type === 'achievement';
            if (communityData.currentFilter === 'meetups') return post.type === 'meetup';
            if (communityData.currentFilter === 'general') return post.type === 'general';
            return true;
        });

    if (filteredPosts.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #6b7280;">No posts found for this filter.</div>';
        return;
    }

    filteredPosts.forEach(post => {
        const postCard = document.createElement('div');
        postCard.className = 'post-card';
        
        let badgeClass = '';
        let badgeText = '';
        if (post.type === 'achievement') {
            badgeClass = 'badge-achievement';
            badgeText = '🏆 Achievement';
        } else if (post.type === 'meetup') {
            badgeClass = 'badge-meetup';
            badgeText = '📅 Meetup';
        } else {
            badgeClass = 'badge-general';
            badgeText = '💬 General';
        }

        let postContent = `
            <div class="post-header">
                <div class="post-avatar"></div>
                <div class="post-author-info">
                    <div class="post-author-name">${post.author}</div>
                    <div class="post-timestamp">${post.timestamp}</div>
                </div>
                <span class="post-badge ${badgeClass}">${badgeText}</span>
            </div>
            <div class="post-content">
                <p class="post-text">${post.content}</p>
        `;

        // Add achievement milestone if applicable
        if (post.type === 'achievement' && post.milestone) {
            postContent += `
                <div class="achievement-milestone">
                    🏆 ${post.milestone}
                </div>
            `;
        }

        // Add meetup details if applicable
        if (post.type === 'meetup' && post.meetup) {
            postContent += `
                <div class="meetup-details">
                    <div class="meetup-title">${post.meetup.title}</div>
                    <div class="meetup-info">
                        <div class="meetup-info-item">
                            <svg class="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            ${formatDate(post.meetup.date)} at ${post.meetup.time}
                        </div>
                        <div class="meetup-info-item">
                            <svg class="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            </svg>
                            ${post.meetup.location}
                        </div>
                        ${post.attending ? `
                            <div class="meetup-info-item">
                                <svg class="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                </svg>
                                ${post.attending} people attending
                            </div>
                        ` : ''}
                    </div>
                    <button class="join-meetup-btn" onclick="joinMeetup(${post.id})">
                        Join Meetup
                    </button>
                </div>
            `;
        }

        postContent += `
            </div>
            <div class="post-actions">
                <button class="action-btn" onclick="likePost(${post.id})">
                    <svg class="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                    </svg>
                    ${post.likes}
                </button>
                <button class="action-btn" onclick="commentPost(${post.id})">
                    <svg class="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                    </svg>
                    ${post.comments}
                </button>
                <button class="action-btn" onclick="sharePost(${post.id})">
                    <svg class="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
                    </svg>
                    Share
                </button>
            </div>
        `;

        postCard.innerHTML = postContent;
        container.appendChild(postCard);
    });
}

/**
 * Render trending topics
 */
function renderTrending() {
    const container = document.getElementById('trending-list');
    container.innerHTML = '';

    communityData.trending.forEach(topic => {
        const trendingItem = document.createElement('div');
        trendingItem.className = 'trending-item';
        trendingItem.onclick = () => {
            alert(`Viewing posts tagged with ${topic.tag}`);
        };
        trendingItem.innerHTML = `
            <div class="trending-tag">${topic.tag}</div>
            <div class="trending-count">${topic.posts} posts</div>
        `;
        container.appendChild(trendingItem);
    });
}

/**
 * Render upcoming meetups sidebar
 */
function renderUpcomingMeetups() {
    const container = document.getElementById('upcoming-meetups-sidebar');
    container.innerHTML = '';

    communityData.upcomingMeetups.forEach(meetup => {
        const meetupDiv = document.createElement('div');
        meetupDiv.className = 'mini-meetup';
        meetupDiv.onclick = () => {
            alert(`View details for: ${meetup.title}`);
        };
        meetupDiv.innerHTML = `
            <div class="mini-meetup-title">${meetup.title}</div>
            <div class="mini-meetup-date">${meetup.date}</div>
        `;
        container.appendChild(meetupDiv);
    });
}

/**
 * Render top contributors
 */
function renderTopContributors() {
    const container = document.getElementById('top-contributors');
    container.innerHTML = '';

    communityData.topContributors.forEach(contributor => {
        const contributorDiv = document.createElement('div');
        contributorDiv.className = 'contributor-item';
        contributorDiv.onclick = () => {
            alert(`View ${contributor.name}'s profile`);
        };
        contributorDiv.innerHTML = `
            <div class="contributor-avatar"></div>
            <div class="contributor-info">
                <div class="contributor-name">${contributor.name}</div>
                <div class="contributor-posts">${contributor.posts} posts this week</div>
            </div>
        `;
        container.appendChild(contributorDiv);
    });
}

/**
 * Render leaderboard
 */
function renderLeaderboard() {
    const container = document.getElementById('leaderboard');
    container.innerHTML = '';

    communityData.leaderboard.forEach(leader => {
        const leaderDiv = document.createElement('div');
        leaderDiv.className = 'leader-item';
        leaderDiv.innerHTML = `
            <div class="leader-rank">${leader.rank}</div>
            <div class="leader-info">
                <div class="leader-name">${leader.name}</div>
                <div class="leader-achievement">${leader.achievement}</div>
            </div>
            <div class="leader-score">${leader.score}</div>
        `;
        container.appendChild(leaderDiv);
    });
}

// ========================================
// INTERACTION FUNCTIONS
// ========================================

/**
 * Filter posts by type
 */
function filterPosts(type) {
    communityData.currentFilter = type;
    
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    renderPosts();
}

/**
 * Open create post modal
 */
function openCreatePostModal() {
    document.getElementById('create-post-modal').classList.add('active');
}

/**
 * Close create post modal
 */
function closeCreatePostModal() {
    document.getElementById('create-post-modal').classList.remove('active');
    // Reset form
    document.getElementById('post-content').value = '';
    document.getElementById('achievement-milestone').value = '';
    document.getElementById('meetup-title').value = '';
    document.getElementById('meetup-date').value = '';
    document.getElementById('meetup-time').value = '';
    document.getElementById('meetup-location').value = '';
}

/**
 * Select post type in modal
 */
function selectPostType(type) {
    communityData.currentPostType = type;
    
    // Update active button
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Show/hide relevant fields
    const achievementFields = document.querySelector('.achievement-fields');
    const meetupFields = document.querySelector('.meetup-fields');
    
    achievementFields.style.display = type === 'achievement' ? 'block' : 'none';
    meetupFields.style.display = type === 'meetup' ? 'block' : 'none';
}

/**
 * Submit new post
 */
function submitPost() {
    const content = document.getElementById('post-content').value;
    
    if (!content.trim()) {
        alert('Please write something before posting!');
        return;
    }
    
    const newPost = {
        id: communityData.posts.length + 1,
        type: communityData.currentPostType,
        author: 'You',
        timestamp: 'Just now',
        content: content,
        likes: 0,
        comments: 0
    };
    
    // Add type-specific data
    if (communityData.currentPostType === 'achievement') {
        const milestone = document.getElementById('achievement-milestone').value;
        if (milestone) {
            newPost.milestone = milestone;
        }
    } else if (communityData.currentPostType === 'meetup') {
        const title = document.getElementById('meetup-title').value;
        const date = document.getElementById('meetup-date').value;
        const time = document.getElementById('meetup-time').value;
        const location = document.getElementById('meetup-location').value;
        
        if (title && date && time && location) {
            newPost.meetup = { title, date, time, location };
            newPost.attending = 0;
        }
    }
    
    // Add to beginning of posts array
    communityData.posts.unshift(newPost);
    
    // Re-render posts
    renderPosts();
    
    // Close modal
    closeCreatePostModal();
    
    alert('Your post has been published! 🎉');
}

/**
 * Like a post
 */
function likePost(postId) {
    const post = communityData.posts.find(p => p.id === postId);
    if (post) {
        post.likes++;
        renderPosts();
    }
}

/**
 * Comment on a post
 */
function commentPost(postId) {
    alert('Comment feature coming soon! 💬');
}

/**
 * Share a post
 */
function sharePost(postId) {
    alert('Post shared! 🔗');
}

/**
 * Join a meetup
 */
function joinMeetup(postId) {
    const post = communityData.posts.find(p => p.id === postId);
    if (post && post.meetup) {
        if (post.attending !== undefined) {
            post.attending++;
        } else {
            post.attending = 1;
        }
        renderPosts();
        alert(`You've joined: ${post.meetup.title}! 🎉`);
    }
}

/**
 * Format date for display
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// ========================================
// INITIALIZE APP
// ========================================

/**
 * Initialize the tribe community page
 */
function init() {
    renderPosts();
    renderTrending();
    renderUpcomingMeetups();
    renderTopContributors();
    renderLeaderboard();
    
    // Close modal when clicking outside
    document.getElementById('create-post-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeCreatePostModal();
        }
    });
    
    console.log('Tribe Community page initialized successfully! 🎉');
}

// Run initialization when DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Make functions globally accessible
window.filterPosts = filterPosts;
window.openCreatePostModal = openCreatePostModal;
window.closeCreatePostModal = closeCreatePostModal;
window.selectPostType = selectPostType;
window.submitPost = submitPost;
window.likePost = likePost;
window.commentPost = commentPost;
window.sharePost = sharePost;
window.joinMeetup = joinMeetup;