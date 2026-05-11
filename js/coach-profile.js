// ========================================
// COACH DATA
// ========================================
const coachData = {
    // Basic Info
    name: "Dr. Sarah Martinez",
    tagline: "Certified Executive & Life Transformation Coach",
    photo: "#667eea", // Placeholder color
    
    // At a Glance
    focusAreas: "Leadership, Burnout Recovery, Career Clarity",
    method: "Neuroscience-based strategy + accountability coaching",
    results: "95% of clients report improved confidence within 3 months",
    
    // Quick Info
    experience: "10+ years",
    clientsHelped: "120+",
    sessionLength: "60 minutes",
    format: "Online & In-Person",
    
    // Bio / Personal Statement
    bio: [
        "Hi, I'm Sarah! For the past decade, I've been on a mission to help high-achieving professionals break free from burnout and rediscover their purpose.",
        "My journey into coaching began after experiencing my own burnout as a corporate executive. I realized that success without fulfillment is just exhaustion in disguise. That's when I made the bold decision to leave my six-figure job and dedicate my life to helping others avoid the same trap.",
        "Today, I combine neuroscience-based strategies with mindfulness practices to help my clients achieve sustainable success. My approach isn't about working harder—it's about working smarter and aligning your actions with your deepest values.",
        "I believe that everyone has the potential for extraordinary transformation. Sometimes, all it takes is the right guidance, accountability, and a safe space to explore what's truly possible."
    ],
    
    // Coaching Philosophy
    philosophy: {
        statement: "I believe that lasting transformation happens when we align our external actions with our internal values. Real change isn't about willpower—it's about understanding how our brains work and creating systems that support our natural tendencies.",
        beliefs: [
            "Growth happens outside your comfort zone, but it shouldn't break you",
            "Authenticity is the foundation of sustainable success",
            "Small consistent actions create massive results over time",
            "Your mindset determines your reality—change your thoughts, change your life"
        ]
    },
    
    // Signature Framework
    framework: [
        {
            number: 1,
            title: "Clarity",
            description: "Identify your core values and true goals"
        },
        {
            number: 2,
            title: "Strategy",
            description: "Design a neuroscience-backed action plan"
        },
        {
            number: 3,
            title: "Action",
            description: "Implement with accountability and support"
        },
        {
            number: 4,
            title: "Optimization",
            description: "Refine and scale what works"
        }
    ],
    
    // Services
    services: [
        {
            title: "1-on-1 Executive Coaching",
            price: "$350/session",
            description: "Personalized coaching tailored to your unique challenges and goals. Perfect for executives and leaders looking for intensive transformation.",
            features: [
                "60-minute weekly sessions",
                "Unlimited email support",
                "Custom action plans and worksheets",
                "Progress tracking dashboard",
                "6-month commitment recommended"
            ]
        },
        {
            title: "Group Coaching Program",
            price: "$197/month",
            description: "Join a community of like-minded individuals working towards similar goals. Perfect for those who thrive in collaborative environments.",
            features: [
                "Bi-weekly 90-minute group calls",
                "Private community access",
                "Monthly 1-on-1 check-ins",
                "Group accountability partners",
                "Bonus workshops and masterclasses"
            ]
        },
        {
            title: "Intensive Breakthrough Session",
            price: "$500",
            description: "A deep-dive 3-hour session designed to create immediate breakthroughs. Ideal for those facing a specific challenge or decision.",
            features: [
                "3-hour intensive session",
                "Pre-session assessment",
                "Detailed action plan",
                "30-day follow-up support",
                "Recorded session for review"
            ]
        }
    ],
    
    // Testimonials
    testimonials: [
        {
            text: "Sarah helped me go from feeling completely burnt out to landing my dream job in just 4 months. Her framework is practical, empowering, and actually works. I can't recommend her enough!",
            author: "Jennifer L.",
            role: "VP of Marketing",
            rating: 5
        },
        {
            text: "I was skeptical about coaching, but Sarah's approach is different. She doesn't just give you feel-good platitudes—she gives you real strategies backed by science. My confidence has skyrocketed.",
            author: "Marcus T.",
            role: "Tech Entrepreneur",
            rating: 5
        },
        {
            text: "Working with Sarah was transformational. She helped me identify blind spots I didn't even know I had and gave me the tools to overcome them. Best investment I've made in myself.",
            author: "Priya S.",
            role: "Financial Analyst",
            rating: 5
        }
    ],
    
    // Transformations
    transformations: [
        {
            title: "From Burnout to Balance",
            before: "Working 80+ hours per week, constantly exhausted, feeling disconnected from family and hobbies. Success felt empty and unsustainable.",
            after: "Reduced work hours to 50 per week while maintaining performance. Reconnected with family, started exercising again, and rediscovered joy in work."
        },
        {
            title: "Career Clarity Breakthrough",
            before: "Stuck in a high-paying job that felt meaningless. Afraid to make a change due to financial responsibilities and fear of failure.",
            after: "Successfully transitioned to a purpose-driven career. Now earning 20% more while doing work that aligns with values and brings genuine fulfillment."
        },
        {
            title: "Confidence & Leadership Growth",
            before: "Struggling with imposter syndrome, avoiding speaking up in meetings, passed over for promotions despite strong performance.",
            after: "Promoted to leadership role within 6 months. Now confidently leading team meetings and presenting to C-suite executives."
        }
    ],
    
    // Credentials
    credentials: [
        {
            name: "ICF Professional Certified Coach (PCC)",
            org: "International Coaching Federation"
        },
        {
            name: "NLP Master Practitioner",
            org: "Neuro-Linguistic Programming Institute"
        },
        {
            name: "Master's in Organizational Psychology",
            org: "Columbia University"
        },
        {
            name: "Certified Mindfulness Instructor",
            org: "Mindfulness Training Institute"
        }
    ],
    
    // Core Values
    values: [
        "Authenticity",
        "Accountability",
        "Empowerment",
        "Resilience",
        "Growth Mindset",
        "Compassion"
    ],
    
    // Awards
    awards: [
        "Top 50 Leadership Coaches - Forbes 2024",
        "Excellence in Coaching Award - ICF 2023",
        "Featured Speaker - TEDx: The Power of Aligned Action"
    ],
    
    // Free Resources
    resources: [
        {
            icon: "📄",
            title: "Burnout Recovery Workbook",
            type: "PDF Guide"
        },
        {
            icon: "🎧",
            title: "The Clarity Podcast",
            type: "Weekly Episodes"
        },
        {
            icon: "📧",
            title: "5-Day Leadership Challenge",
            type: "Email Course"
        },
        {
            icon: "📹",
            title: "Goal-Setting Masterclass",
            type: "Free Video Training"
        }
    ]
};

// ========================================
// RENDER FUNCTIONS
// ========================================

/**
 * Render hero section
 */
function renderHero() {
    document.getElementById('coach-name').textContent = coachData.name;
    document.getElementById('coach-tagline').textContent = coachData.tagline;
    document.getElementById('focus-areas').textContent = coachData.focusAreas;
    document.getElementById('method').textContent = coachData.method;
    document.getElementById('results').textContent = coachData.results;
    
    // Set coach photo background
    const photo = document.getElementById('coach-photo');
    photo.style.background = `linear-gradient(135deg, ${coachData.photo} 0%, ${coachData.photo}dd 100%)`;
}

/**
 * Render quick info sidebar
 */
function renderQuickInfo() {
    document.getElementById('experience').textContent = coachData.experience;
    document.getElementById('clients-helped').textContent = coachData.clientsHelped;
    document.getElementById('session-length').textContent = coachData.sessionLength;
    document.getElementById('format').textContent = coachData.format;
}

/**
 * Render bio
 */
function renderBio() {
    const container = document.getElementById('bio-content');
    container.innerHTML = '';
    
    coachData.bio.forEach(paragraph => {
        const p = document.createElement('p');
        p.textContent = paragraph;
        container.appendChild(p);
    });
}

/**
 * Render philosophy
 */
function renderPhilosophy() {
    const container = document.getElementById('philosophy-content');
    
    let html = `<p><strong>${coachData.philosophy.statement}</strong></p>`;
    html += '<ul>';
    coachData.philosophy.beliefs.forEach(belief => {
        html += `<li>${belief}</li>`;
    });
    html += '</ul>';
    
    container.innerHTML = html;
}

/**
 * Render framework
 */
function renderFramework() {
    const container = document.getElementById('framework-visual');
    container.innerHTML = '';
    
    coachData.framework.forEach(step => {
        const stepDiv = document.createElement('div');
        stepDiv.className = 'framework-step';
        stepDiv.innerHTML = `
            <div class="framework-number">${step.number}</div>
            <div class="framework-title">${step.title}</div>
            <div class="framework-description">${step.description}</div>
        `;
        container.appendChild(stepDiv);
    });
}

/**
 * Render services
 */
function renderServices() {
    const container = document.getElementById('services-grid');
    container.innerHTML = '';
    
    coachData.services.forEach(service => {
        const serviceCard = document.createElement('div');
        serviceCard.className = 'service-card';
        
        let featuresHTML = '<ul class="service-features">';
        service.features.forEach(feature => {
            featuresHTML += `<li>${feature}</li>`;
        });
        featuresHTML += '</ul>';
        
        serviceCard.innerHTML = `
            <div class="service-header">
                <h3 class="service-title">${service.title}</h3>
                <span class="service-price">${service.price}</span>
            </div>
            <p class="service-description">${service.description}</p>
            ${featuresHTML}
            <button class="service-cta" onclick="openBookingModal()">Get Started</button>
        `;
        
        container.appendChild(serviceCard);
    });
}

/**
 * Render testimonials
 */
function renderTestimonials() {
    const container = document.getElementById('testimonials-container');
    container.innerHTML = '';
    
    coachData.testimonials.forEach(testimonial => {
        const testimonialCard = document.createElement('div');
        testimonialCard.className = 'testimonial-card';
        
        const stars = '⭐'.repeat(testimonial.rating);
        
        testimonialCard.innerHTML = `
            <div class="quote-icon">"</div>
            <p class="testimonial-text">${testimonial.text}</p>
            <div class="testimonial-author">
                <div class="author-avatar"></div>
                <div>
                    <div class="author-name">${testimonial.author}</div>
                    <div class="author-role">${testimonial.role}</div>
                    <div class="rating">${stars}</div>
                </div>
            </div>
        `;
        
        container.appendChild(testimonialCard);
    });
}

/**
 * Render transformations
 */
function renderTransformations() {
    const container = document.getElementById('transformations-container');
    container.innerHTML = '';
    
    coachData.transformations.forEach(transformation => {
        const transformationCard = document.createElement('div');
        transformationCard.className = 'transformation-card';
        
        transformationCard.innerHTML = `
            <h3 class="transformation-title">${transformation.title}</h3>
            <div class="transformation-grid">
                <div class="before-state">
                    <div class="state-label">Before</div>
                    <p class="state-description">${transformation.before}</p>
                </div>
                <div class="arrow-icon">→</div>
                <div class="after-state">
                    <div class="state-label">After</div>
                    <p class="state-description">${transformation.after}</p>
                </div>
            </div>
        `;
        
        container.appendChild(transformationCard);
    });
}

/**
 * Render credentials
 */
function renderCredentials() {
    const container = document.getElementById('credentials-list');
    container.innerHTML = '';
    
    coachData.credentials.forEach(credential => {
        const credentialDiv = document.createElement('div');
        credentialDiv.className = 'credential-item';
        credentialDiv.innerHTML = `
            <div class="credential-name">${credential.name}</div>
            <div class="credential-org">${credential.org}</div>
        `;
        container.appendChild(credentialDiv);
    });
}

/**
 * Render values
 */
function renderValues() {
    const container = document.getElementById('values-list');
    container.innerHTML = '';
    
    coachData.values.forEach(value => {
        const valueTag = document.createElement('div');
        valueTag.className = 'value-tag';
        valueTag.textContent = value;
        container.appendChild(valueTag);
    });
}

/**
 * Render awards
 */
function renderAwards() {
    const container = document.getElementById('awards-list');
    container.innerHTML = '';
    
    coachData.awards.forEach(award => {
        const awardDiv = document.createElement('div');
        awardDiv.className = 'award-item';
        awardDiv.innerHTML = `
            <span class="award-icon">🏆</span>
            <span class="award-text">${award}</span>
        `;
        container.appendChild(awardDiv);
    });
}

/**
 * Render resources
 */
function renderResources() {
    const container = document.getElementById('resources-list');
    container.innerHTML = '';
    
    coachData.resources.forEach(resource => {
        const resourceDiv = document.createElement('div');
        resourceDiv.className = 'resource-item';
        resourceDiv.onclick = () => {
            alert(`Download: ${resource.title}`);
        };
        resourceDiv.innerHTML = `
            <span class="resource-icon">${resource.icon}</span>
            <div class="resource-info">
                <div class="resource-title">${resource.title}</div>
                <div class="resource-type">${resource.type}</div>
            </div>
        `;
        container.appendChild(resourceDiv);
    });
}

// ========================================
// INTERACTION FUNCTIONS
// ========================================

/**
 * Open booking modal
 */
function openBookingModal() {
    document.getElementById('booking-modal').classList.add('active');
}

/**
 * Close booking modal
 */
function closeBookingModal() {
    document.getElementById('booking-modal').classList.remove('active');
    // Reset form
    document.getElementById('booking-form').reset();
}

/**
 * Submit booking form
 */
function submitBooking(event) {
    event.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const goal = document.getElementById('goal').value;
    const timeline = document.getElementById('timeline').value;
    
    if (!name || !email || !goal) {
        alert('Please fill out all required fields!');
        return;
    }
    
    // In production, this would send data to your backend
    console.log('Booking request:', { name, email, phone, goal, timeline });
    
    alert(`Thanks ${name}! Your discovery call request has been received. I'll reach out to you at ${email} within 24 hours to schedule our session. 🎉`);
    
    closeBookingModal();
}

/**
 * Scroll to section
 */
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ========================================
// INITIALIZE APP
// ========================================

/**
 * Initialize the coach profile page
 */
function init() {
    renderHero();
    renderQuickInfo();
    renderBio();
    renderPhilosophy();
    renderFramework();
    renderServices();
    renderTestimonials();
    renderTransformations();
    renderCredentials();
    renderValues();
    renderAwards();
    renderResources();
    
    // Close modal when clicking outside
    document.getElementById('booking-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeBookingModal();
        }
    });
    
    console.log('Coach Profile page initialized successfully! 🎉');
}

// Run initialization when DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Make functions globally accessible
window.openBookingModal = openBookingModal;
window.closeBookingModal = closeBookingModal;
window.submitBooking = submitBooking;
window.scrollToSection = scrollToSection;