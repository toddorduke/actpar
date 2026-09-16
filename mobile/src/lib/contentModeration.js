/**
 * Content Moderation Utility (text only)
 * Ports client/src/utils/contentModeration.js's checkText/checkUsername --
 * pure client-side logic, no external API, safe to run unchanged on mobile.
 * Media moderation (scanMediaUrl) isn't ported -- mobile posts are text-only
 * for now, no image/video upload from this app yet.
 */

const BLOCKED_WORDS = [
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'cunt', 'dick', 'pussy',
  'cock', 'whore', 'slut', 'fag', 'faggot', 'nigger', 'nigga', 'spic',
  'chink', 'kike', 'wetback', 'retard', 'tranny', 'bullshit', 'goddamn',
  'douche', 'douchebag', 'prick', 'twat', 'wanker', 'motherfucker',
  'kill yourself', 'kys', 'go die', 'you should die', 'i will kill',
  'i will hurt', 'you are worthless', 'nobody likes you', 'kill u',
  'end your life', 'worthless piece', 'ugly piece',
  'beat you up', 'beat your ass', 'fight you', 'come find you',
  'ill hurt you', 'im going to hurt', 'going to kill',
  'doxx you', 'dox you', 'find where you live', 'expose your address',
  'i know where you live', 'swat you', 'swatting',
  'pedo', 'pedophile', 'nonce',
  'buy drugs', 'sell drugs', 'cocaine', 'heroin', 'meth', 'fentanyl',
  'child porn', 'cp link', 'onlyfans link', 'porn link',
  'cash app me', 'cashapp me', 'venmo me', 'zelle me', 'send me money',
  'pay me first', 'wire me', 'click this link', 'dm me for deals',
];

const CRISIS_WORDS = [
  'kill myself', 'want to die', 'suicidal', 'end my life', 'take my life',
  'no reason to live', 'better off dead', 'cut myself', 'hurt myself',
  'self harm', 'self-harm', 'overdose',
  'i want to disappear', 'wish i was dead', 'i give up on life',
  'no point in living', 'dont want to live', "don't want to live",
  'cant take it anymore', "can't take it anymore", 'nothing to live for',
  'feel completely hopeless', 'rather be dead',
];

const WARNING_WORDS = [
  'hate', 'stupid', 'idiot', 'dumb', 'loser', 'ugly', 'fat', 'disgusting',
  'freak', 'weirdo', 'pathetic', 'useless',
  'trash', 'garbage', 'clown', 'dumbass', 'dumb ass', 'shut up',
  'go away', 'nobody wants you', 'you suck',
  'damn', 'hell', 'ass', 'piss', 'pissed', 'crap',
];

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[@]/g, 'a')
    .replace(/[3]/g, 'e')
    .replace(/[1!|]/g, 'i')
    .replace(/[0]/g, 'o')
    .replace(/[5\$]/g, 's')
    .replace(/[7]/g, 't')
    .replace(/(.)\1{2,}/g, '$1$1')
    .trim();
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function containsPhrase(text, phrase) {
  const words = phrase.trim().split(' ');
  if (words.length === 1) {
    const lastChar = escapeRegex(phrase.slice(-1));
    const re = new RegExp(`\\b${escapeRegex(phrase)}${lastChar}?(?:s|es|ed|ing|y|er|ers)?\\b`, 'i');
    return re.test(text);
  }
  return text.includes(phrase);
}

export function checkText(text) {
  if (!text || !text.trim()) return { ok: true, type: null, message: null };

  const normalized = normalize(text);

  for (const phrase of CRISIS_WORDS) {
    if (containsPhrase(normalized, phrase)) {
      return {
        ok: false,
        type: 'crisis',
        message: `We noticed something in your message that concerns us. If you're going through a difficult time, you're not alone. Please reach out to the Crisis Text Line — text HOME to 741741 (US) or call 988 (Suicide & Crisis Lifeline). This community cares about you. 💛`,
      };
    }
  }

  for (const phrase of BLOCKED_WORDS) {
    if (containsPhrase(normalized, phrase)) {
      return {
        ok: false,
        type: 'blocked',
        message: `Your message contains language that violates our Community Guidelines. Please keep this space positive and supportive. Edit your message and try again.`,
      };
    }
  }

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

export function checkUsername(name) {
  return checkText(name);
}
