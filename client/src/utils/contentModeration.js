/**
 * Content Moderation Utility
 * Protects users from harmful, vulgar, bullying, or dangerous content.
 */

// ── Trigger word categories ──────────────────────────────────────────────────

// Words that result in a hard block with an error message
const BLOCKED_WORDS = [
  // Profanity
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'cunt', 'dick', 'pussy',
  'cock', 'whore', 'slut', 'fag', 'faggot', 'nigger', 'nigga', 'spic',
  'chink', 'kike', 'wetback', 'retard', 'tranny',
  // Bullying / threats
  'kill yourself', 'kys', 'go die', 'you should die', 'i will kill',
  'i will hurt', 'you are worthless', 'nobody likes you', 'kill u',
  'end your life', 'worthless piece', 'ugly piece',
  // Dangerous / illegal
  'buy drugs', 'sell drugs', 'cocaine', 'heroin', 'meth', 'fentanyl',
  'child porn', 'cp link', 'onlyfans link', 'porn link',
];

// Words that show a mental health support message instead of hard-blocking
const CRISIS_WORDS = [
  'kill myself', 'want to die', 'suicidal', 'end my life', 'take my life',
  'no reason to live', 'better off dead', 'cut myself', 'hurt myself',
  'self harm', 'self-harm', 'overdose',
];

// Words that show a gentle warning before allowing submission
const WARNING_WORDS = [
  'hate', 'stupid', 'idiot', 'dumb', 'loser', 'ugly', 'fat', 'disgusting',
  'freak', 'weirdo', 'pathetic', 'useless',
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function normalize(text) {
  return text
    .toLowerCase()
    // common letter substitutions (l33tspeak)
    .replace(/[@]/g, 'a')
    .replace(/[3]/g, 'e')
    .replace(/[1!|]/g, 'i')
    .replace(/[0]/g, 'o')
    .replace(/[5\$]/g, 's')
    .replace(/[7]/g, 't')
    // strip extra spaces and repeated chars (haaate → hate)
    .replace(/(.)\1{2,}/g, '$1$1')
    .trim();
}

function containsPhrase(text, phrase) {
  // Check for phrase anywhere in text (with word boundaries for single words)
  const words = phrase.trim().split(' ');
  if (words.length === 1) {
    // Single word — use word boundary
    const re = new RegExp(`\\b${escapeRegex(phrase)}\\b`, 'i');
    return re.test(text);
  }
  // Multi-word phrase
  return text.includes(phrase);
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── Main export ──────────────────────────────────────────────────────────────

/**
 * Check text content for harmful language.
 * @param {string} text
 * @returns {{ ok: boolean, type: 'crisis'|'blocked'|'warning'|null, message: string|null }}
 */
export function checkText(text) {
  if (!text || !text.trim()) return { ok: true, type: null, message: null };

  const normalized = normalize(text);

  // 1. Crisis / self-harm — show support message, soft block
  for (const phrase of CRISIS_WORDS) {
    if (containsPhrase(normalized, phrase)) {
      return {
        ok: false,
        type: 'crisis',
        message: `We noticed something in your message that concerns us. If you're going through a difficult time, you're not alone. Please reach out to the Crisis Text Line — text HOME to 741741 (US) or call 988 (Suicide & Crisis Lifeline). This community cares about you. 💛`,
      };
    }
  }

  // 2. Hard-blocked words / phrases
  for (const phrase of BLOCKED_WORDS) {
    if (containsPhrase(normalized, phrase)) {
      return {
        ok: false,
        type: 'blocked',
        message: `Your message contains language that violates our Community Guidelines. Please keep this space positive and supportive. Edit your message and try again.`,
      };
    }
  }

  // 3. Warning words — allowed but flagged
  for (const phrase of WARNING_WORDS) {
    if (containsPhrase(normalized, phrase)) {
      return {
        ok: false,
        type: 'warning',
        message: `Your message may contain language that could be hurtful to others. Please review it and make sure it aligns with our community values of respect and support.`,
      };
    }
  }

  return { ok: true, type: null, message: null };
}

/**
 * Check a username / display name.
 */
export function checkUsername(name) {
  return checkText(name);
}

// ── Image / Video moderation ─────────────────────────────────────────────────

/**
 * Validate file type is allowed.
 * Blocks executable, script, and other dangerous file types.
 */
export function validateFileType(file) {
  const ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const ALLOWED_VIDEO = ['video/mp4', 'video/quicktime', 'video/webm'];
  const ALL_ALLOWED = [...ALLOWED_IMAGE, ...ALLOWED_VIDEO];

  if (!ALL_ALLOWED.includes(file.type)) {
    return {
      ok: false,
      message: `File type "${file.type || 'unknown'}" is not allowed. Please upload a JPG, PNG, WebP, GIF, MP4, MOV, or WebM file.`,
    };
  }
  return { ok: true };
}

/**
 * Validate file size.
 */
export function validateFileSize(file) {
  const MAX_IMAGE = 10 * 1024 * 1024; // 10 MB
  const MAX_VIDEO = 100 * 1024 * 1024; // 100 MB
  const isVideo = file.type.startsWith('video/');
  const limit = isVideo ? MAX_VIDEO : MAX_IMAGE;

  if (file.size > limit) {
    const limitMb = limit / (1024 * 1024);
    return {
      ok: false,
      message: `File is too large. Maximum size is ${limitMb} MB for ${isVideo ? 'videos' : 'images'}.`,
    };
  }
  return { ok: true };
}

/**
 * Scan an uploaded file URL using Sightengine NSFW detection API.
 *
 * To enable:
 *   1. Sign up at https://sightengine.com (free tier: 2,000 checks/month)
 *   2. Add to your .env file:
 *      VITE_SIGHTENGINE_USER=your_api_user
 *      VITE_SIGHTENGINE_SECRET=your_api_secret
 *
 * Returns { ok: true } if safe, { ok: false, message } if flagged.
 */
export async function scanMediaUrl(fileUrl) {
  const apiUser = import.meta.env.VITE_SIGHTENGINE_USER;
  const apiSecret = import.meta.env.VITE_SIGHTENGINE_SECRET;

  // If keys not configured, skip API check (log warning in dev)
  if (!apiUser || !apiSecret) {
    if (import.meta.env.DEV) {
      console.warn('[ContentMod] Sightengine keys not set — skipping AI media scan. Add VITE_SIGHTENGINE_USER and VITE_SIGHTENGINE_SECRET to .env');
    }
    return { ok: true };
  }

  try {
    const params = new URLSearchParams({
      url: fileUrl,
      models: 'nudity-2.1,weapon,gore-2.0,drug,hate-symbol',
      api_user: apiUser,
      api_secret: apiSecret,
    });

    const res = await fetch(`https://api.sightengine.com/1.0/check.json?${params}`);
    const data = await res.json();

    if (data.status !== 'success') {
      // API error — fail open (don't block user due to API outage)
      console.error('[ContentMod] Sightengine error:', data);
      return { ok: true };
    }

    const nudity = data.nudity;
    const NUDITY_THRESHOLD = 0.6;

    // Check nudity
    if (
      nudity?.sexual_activity > NUDITY_THRESHOLD ||
      nudity?.sexual_display > NUDITY_THRESHOLD ||
      nudity?.erotica > NUDITY_THRESHOLD
    ) {
      return {
        ok: false,
        message: 'This image was flagged as containing explicit content and cannot be uploaded. Please keep all media appropriate and safe for all users.',
      };
    }

    // Check weapons
    if (data.weapon?.classes?.firearm > 0.8 || data.weapon?.classes?.knife > 0.85) {
      return {
        ok: false,
        message: 'This image was flagged as containing weapons. Please keep all content safe and positive.',
      };
    }

    // Check gore
    if (data.gore?.prob > NUDITY_THRESHOLD) {
      return {
        ok: false,
        message: 'This image was flagged as containing graphic or violent content and cannot be uploaded.',
      };
    }

    // Check drugs
    if (data.drug?.prob > 0.7) {
      return {
        ok: false,
        message: 'This image was flagged as containing drug-related content and cannot be uploaded.',
      };
    }

    // Check hate symbols
    if (data['hate-symbol']?.prob > 0.7) {
      return {
        ok: false,
        message: 'This image was flagged as containing hate symbols and cannot be uploaded.',
      };
    }

    return { ok: true };
  } catch (err) {
    // Network error — fail open
    console.error('[ContentMod] Sightengine network error:', err);
    return { ok: true };
  }
}
