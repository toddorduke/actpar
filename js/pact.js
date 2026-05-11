// ========================================
// PACT DATA
// ========================================
const pactData = {
    pactName: "The Phoenix Circle",
    description: "An elite accountability group for ambitious goal-crushers",
    created: "Jan 2025",
    currentFilter: 'all',
    currentPostType: 'update',
    
    members: [
        { id: 1, name: "Sarah Martinez", role: "Founder", badge: "👑" },
        { id: 2, name: "Mike Thompson", role: "Member", badge: "" },
        { id: 3, name: "Emma Lewis", role: "Member", badge: "" },
        { id: 4, name: "Josh Kim", role: "Co-Lead", badge: "⭐" },
        { id: 5, name: "Maya Patel", role: "Member", badge: "" },
        { id: 6, name: "Alex Rodriguez", role: "Member", badge: "" },
        { id: 7, name: "Lisa Chen", role: "Member", badge: "" },
        { id: 8, name: "David Park", role: "Member", badge: "" }
    ],
    
    events: [
        {
            id: 1,
            title: "Weekly Check-In Call",
            date: "2025-11-01",
            time: "19:00",
            attendees: 6
        },
        {
            id: 2,
            title: "Goal Planning Session",
            date: "2025-11-05",
            time: "18:00",
            attendees: 5
        },
        {
            id: 3,
            title: "Celebration & Reflection",
            date: "2025-11-10",
            time: "20:00",
            attendees: 7
        }
    ],
    
    posts: [
        {
            id: 1,
            type: 'win',
            author: 'Sarah Martinez',
            timestamp: '2 hours ago',
            content: 'Hit my 60-day streak today! The Phoenix Circle has been instrumental in keeping me accountable. Thank you all for your support! 🔥',
            likes: 12,
            comments: 5
        },
        {
            id: 2,
            type: 'update',
            author: 'Mike Thompson',
            timestamp: '5 hours ago',
            content: 'Week 3 update: Completed 5/7 morning runs this week. Still struggling with weekends but making progress. Any tips from the group?',
            likes: 8,
            comments: 7
        },
        {
            id: 3,
            type: 'event',
            author: 'Emma Lewis',
            timestamp: '1 day ago',
            content: 'Organizing our monthly check-in call. Let\'s discuss our wins and challenges!',
            event: {
                title: 'Weekly Check-In Call',
                date: '2025-11-01',
                time: '19:00',
                location: 'Zoom (link in group chat)'
            },
            attendees: 6,
            likes: 10,
            comments: 3
        },
        {
            id: 4,
            type: 'challenge',
            author: 'Josh Kim',
            timestamp: '1 day ago',
            content: 'Calling out to the group - who wants to join me in a 7-day early morning challenge? Wake up at 5 AM and tackle our most important task first. Who\'s in? 💪',
            likes: 15,
            comments: 9
        },
        {
            id: 5,
            type: 'update',
            author: 'Maya Patel',
            timestamp: '2 days ago',
            content: 'Monthly progress: Lost 8 lbs, meditating daily, and reading 30 min before bed. The accountability from this group is everything! Here\'s my journey so far... [video]',
            hasVideo: true,
            likes: 18,
            comments: 11
        },
        {
            id: 6,
            type: 'win',
            author: 'Alex Rodriguez',
            timestamp: '3 days ago',
            content: 'Got the promotion I\'ve been working towards! Thank you Phoenix Circle for keeping me focused and motivated during this intense period.',
            likes: 20,
            comments: 14
        }
    ],
    
    leaderboard: [
        { rank: 1, name: 'Sarah Martinez', points: 450 },
        { rank: 2, name: 'Alex Rodriguez', points: 420 },
        { rank: 3, name: 'Maya Patel', points: 395 },
        { rank: 4, name: 'Josh Kim', points: 380 },
        { rank: 5, name: 'Mike Thompson', points: 365 }
    ],
    
    resources: [
        { icon: '📄', title: 'Weekly Goal Template', author: 'Sarah M.' },
        { icon: '🎧', title: 'Productivity Playlist', author: 'Mike T.' },
        { icon: '📹', title: 'Habit Tracking Tutorial', author: 'Emma L.' },
        { icon: '📊', title: 'Progress Tracking Sheet', author: 'Josh K.' }
    ]
};

// ========================================
// RENDER FUNCTIONS
// ========================================

/**
 * Render pact header info
 */
function renderPactHeader() {
    document.getElementById('pact-name').textContent = pactData.pactName;
    document.getElementById('pact-description').textContent = pactData.description;
    document.getElementById('member-count').textContent = pactData.members.length;
    document.getElementById('created-date').textContent = pactData.created;
    document.getElementById('total-posts').textContent = pactData.posts.length;
}

/**
 * Render members list
 */
function renderMembers() {
    const container = document.getElementById('members-list');
    container.innerHTML = '';
    
    pactData.members.forEach(member => {
        const memberDiv = document.createElement('div');
        memberDiv.className = 'member-item';
        memberDiv.onclick = () => {
            alert(`View ${member.name}'s profile`);
        };
        memberDiv.innerHTML = `
            <div class="member-avatar">
                ${member.badge ? `<span class="member-role-badge">${member.badge}</span>` : ''}
            </div>
            <div class="member-info">
                <div class="member-name">${member.name}</div>
                <div class="member-role">${member.role}</div>
            </div>
        `;
        container.appendChild(memberDiv);
    });
}

/**
 * Render events list
 */
function renderEvents() {
    const container = document.getElementById('events-list');
    container.innerHTML = '';
    
    pactData.events.forEach(event => {
        const eventDiv = document.createElement('div');
        eventDiv.className = 'event-item';
        eventDiv.onclick = () => {
            alert(`Event: ${event.title}\nDate: ${formatDate(event.date)} at ${event.time}\nAttendees: ${event.attendees}`);
        };
        eventDiv.innerHTML = `
            <div class="event-title">${event.title}</div>
            <div class="event-time">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                ${formatDate(event.date)} at ${event.time}
            </div>
        `;
        container.appendChild(eventDiv);
    });
}

/**
 * Render posts feed
 */
function renderPosts() {
    const container = document.getElementById('feed-container');
    container.innerHTML = '';
    
    // Filter posts based on current filter
    const filteredPosts = pactData.currentFilter === 'all' 
        ? pactData.posts 
        : pactData.posts.filter(post => {
            if (pactData.currentFilter === 'updates') return post.type === 'update';
            if (pactData.currentFilter === 'wins') return post.type === 'win';
            if (pactData.currentFilter === 'challenges') return post.type === 'challenge';
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
        if (post.type === 'update') {
            badgeClass = 'badge-update';
            badgeText = '📊 Update';
        } else if (post.type === 'win') {
            badgeClass = 'badge-win';
            badgeText = '🎉 Win';
        } else if (post.type === 'challenge') {
            badgeClass = 'badge-challenge';
            badgeText = '💪 Challenge';
        } else if (post.type === 'event') {
            badgeClass = 'badge-event';
            badgeText = '📅 Event';
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

        // Add event details if applicable
        if (post.type === 'event' && post.event) {
            postContent += `
                <div class="event-details">
                    <div class="event-details-title">${post.event.title}</div>
                    <div class="event-info">
                        <div class="event-info-item">
                            <svg class="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            ${formatDate(post.event.date)} at ${post.event.time}
                        </div>
                        <div class="event-info-item">
                            <svg class="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            </svg>
                            ${post.event.location}
                        </div>
                        ${post.attendees ? `
                            <div class="event-info-item">
                                <svg class="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                </svg>
                                ${post.attendees} attending
                            </div>
                        ` : ''}
                    </div>
                    <button class="attend-btn" onclick="attendEvent(${post.id})">
                        I'll Attend
                    </button>
                </div>
            `;
        }

        // Add video if applicable
        if (post.hasVideo) {
            postContent += `
                <div class="video-embed">
                    <div class="video-placeholder" onclick="playVideo(${post.id})">
                        <div class="play-icon">▶</div>
                    </div>
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
 * Render leaderboard
 */
function renderLeaderboard() {
    const container = document.getElementById('leaderboard');
    container.innerHTML = '';
    
    pactData.leaderboard.forEach(leader => {
        const leaderDiv = document.createElement('div');
        leaderDiv.className = 'leader-item';
        leaderDiv.innerHTML = `
            <div class="leader-rank">${leader.rank}</div>
            <div class="leader-info">
                <div class="leader-name">${leader.name}</div>
                <div class="leader-points">${leader.points} points</div>
            </div>
            <div class="leader-score">${leader.points}</div>
        `;
        container.appendChild(leaderDiv);
    });
}

/**
 * Render resources
 */
function renderResources() {
    const container = document.getElementById('resources-list');
    container.innerHTML = '';
    
    pactData.resources.forEach(resource => {
        const resourceDiv = document.createElement('div');
        resourceDiv.className = 'resource-item';
        resourceDiv.onclick = () => {
            alert(`Opening: ${resource.title}`);
        };
        resourceDiv.innerHTML = `
            <span class="resource-icon">${resource.icon}</span>
            <div class="resource-info">
                <div class="resource-title">${resource.title}</div>
                <div class="resource-author">Shared by ${resource.author}</div>
            </div>
        `;
        container.appendChild(resourceDiv);
    });
}

// ========================================
// INTERACTION FUNCTIONS
// ========================================

/**
 * Switch feed tab filter
 */
function switchFeedTab(filter) {
    pactData.currentFilter = filter;
    
    // Update active tab
    document.querySelectorAll('.feed-tab').forEach(tab => {
        tab.classList.remove('active');
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
    document.getElementById('post-content').value = '';
    document.getElementById('event-title').value = '';
    document.getElementById('event-date').value = '';
    document.getElementById('event-time').value = '';
}

/**
 * Select post type
 */
function selectPostType(type) {
    pactData.currentPostType = type;
    
    // Update active button
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Show/hide event fields
    const eventFields = document.querySelector('.event-fields');
    eventFields.style.display = type === 'event' ? 'block' : 'none';
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
        id: pactData.posts.length + 1,
        type: pactData.currentPostType,
        author: 'You',
        timestamp: 'Just now',
        content: content,
        likes: 0,
        comments: 0
    };
    
    // Add event-specific data
    if (pactData.currentPostType === 'event') {
        const title = document.getElementById('event-title').value;
        const date = document.getElementById('event-date').value;
        const time = document.getElementById('event-time').value;
        
        if (title && date && time) {
            newPost.event = { title, date, time, location: 'TBD' };
            newPost.attendees = 0;
        }
    }
    
    // Add to beginning of posts array
    pactData.posts.unshift(newPost);
    
    // Re-render posts
    renderPosts();
    
    // Close modal
    closeCreatePostModal();
    
    alert('Your post has been shared with The Pact! 🔥');
}

/**
 * Open invite modal
 */
function openInviteModal() {
    document.getElementById('invite-modal').classList.add('active');
}

/**
 * Close invite modal
 */
function closeInviteModal() {
    document.getElementById('invite-modal').classList.remove('active');
    document.getElementById('invite-email').value = '';
    document.getElementById('invite-message').value = '';
}

/**
 * Send invitation
 */
function sendInvite(event) {
    event.preventDefault();
    
    const email = document.getElementById('invite-email').value;
    const message = document.getElementById('invite-message').value;
    
    if (!email) {
        alert('Please enter an email address!');
        return;
    }
    
    console.log('Sending invite to:', email, 'Message:', message);
    
    alert(`Invitation sent to ${email}! 🎉\n\nThey will receive an exclusive invite to join ${pactData.pactName}.`);
    
    closeInviteModal();
}

/**
 * Copy invite link
 */
function copyInviteLink() {
    const linkInput = document.getElementById('invite-link');
    linkInput.select();
    linkInput.setSelectionRange(0, 99999); // For mobile
    
    navigator.clipboard.writeText(linkInput.value).then(() => {
        alert('Invite link copied to clipboard! 📋');
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Failed to copy link. Please copy manually.');
    });
}

/**
 * Like a post
 */
function likePost(postId) {
    const post = pactData.posts.find(p => p.id === postId);
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
    alert('Post shared within The Pact! 🔗');
}

/**
 * Attend event
 */
function attendEvent(postId) {
    const post = pactData.posts.find(p => p.id === postId);
    if (post && post.event) {
        if (post.attendees !== undefined) {
            post.attendees++;
        } else {
            post.attendees = 1;
        }
        renderPosts();
        alert(`You're attending: ${post.event.title}! 🎉`);
    }
}

/**
 * Play video
 */
function playVideo(postId) {
    alert('Video player coming soon! 🎥');
}

/**
 * Format date for display
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// ========================================
// INITIALIZE APP
// ========================================

/**
 * Initialize The Pact page
 */
function init() {
    renderPactHeader();
    renderMembers();
    renderEvents();
    renderPosts();
    renderLeaderboard();
    renderResources();
    
    // Close modals when clicking outside
    document.getElementById('create-post-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeCreatePostModal();
        }
    });
    
    document.getElementById('invite-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeInviteModal();
        }
    });
    
    console.log('The Pact page initialized successfully! 🔥');
}

// Run initialization when DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Make functions globally accessible
window.switchFeedTab = switchFeedTab;
window.openCreatePostModal = openCreatePostModal;
window.closeCreatePostModal = closeCreatePostModal;
window.selectPostType = selectPostType;
window.submitPost = submitPost;
window.openInviteModal = openInviteModal;
window.closeInviteModal = closeInviteModal;
window.sendInvite = sendInvite;
window.copyInviteLink = copyInviteLink;
window.likePost = likePost;
window.commentPost = commentPost;
window.sharePost = sharePost;
window.attendEvent = attendEvent;
window.playVideo = playVideo;