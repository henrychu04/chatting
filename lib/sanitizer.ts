import DOMPurify from 'dompurify';

// Server-side DOMPurify setup
let purify: typeof DOMPurify;

if (typeof window === 'undefined') {
  // Server-side: Use JSDOM (dynamic import to avoid TypeScript issues)
  try {
    const { JSDOM } = require('jsdom');
    const window = new JSDOM('').window;
    purify = DOMPurify(window as any);
  } catch (error) {
    // Fallback if JSDOM is not available
    console.warn('JSDOM not available, using basic sanitization', error);
    purify = {
      sanitize: (dirty: string) => dirty.replace(/<[^>]*>/g, ''), // Basic HTML strip
    } as any;
  }
} else {
  // Client-side: Use browser DOMPurify
  purify = DOMPurify;
}

/**
 * Chat-optimized sanitization config
 * Allows basic formatting while preventing XSS
 */
const CHAT_SANITIZE_CONFIG = {
  // Allow basic text formatting tags
  ALLOWED_TAGS: [
    'b',
    'strong', // Bold
    'i',
    'em', // Italic
    'u', // Underline
    'code', // Inline code
    'br', // Line breaks
    'a', // Links (with restrictions)
  ],

  // Allow specific attributes
  ALLOWED_ATTR: [
    'href', // For links
    'target', // For link targets
  ],

  // Only allow safe URL schemes
  ALLOWED_URI_REGEXP: /^(?:https?|ftp|mailto|tel):/i,

  // Additional security options
  ALLOW_DATA_ATTR: false, // No data attributes
  ALLOW_UNKNOWN_PROTOCOLS: false, // No custom protocols
  KEEP_CONTENT: true, // Keep content when removing tags
  RETURN_DOM: false, // Return string not DOM
  RETURN_DOM_FRAGMENT: false, // Return string not fragment
};

/**
 * Strict sanitization config for paranoid security
 * Only allows plain text with line breaks
 */
const STRICT_SANITIZE_CONFIG = {
  ALLOWED_TAGS: ['br'], // Only line breaks
  ALLOWED_ATTR: [], // No attributes
  KEEP_CONTENT: true,
};

/**
 * Rich sanitization config for trusted content
 * Allows more formatting options
 */
const RICH_SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    'b',
    'strong',
    'i',
    'em',
    'u',
    's',
    'sub',
    'sup',
    'code',
    'pre',
    'blockquote',
    'br',
    'p',
    'ul',
    'ol',
    'li',
    'a',
    'img',
  ],
  ALLOWED_ATTR: ['href', 'target', 'src', 'alt', 'title'],
  ALLOWED_URI_REGEXP: /^(?:https?|ftp|mailto|tel):/i,
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
};

/**
 * Sanitize chat message with default chat-safe configuration
 */
export function sanitizeChatMessage(message: string): string {
  if (!message || typeof message !== 'string') {
    return '';
  }

  // Trim and limit message length for chat
  const trimmedMessage = message.trim().slice(0, 5000); // 5k char limit

  return purify.sanitize(trimmedMessage, CHAT_SANITIZE_CONFIG);
}

/**
 * Strict sanitization - only plain text + line breaks
 */
export function sanitizeStrict(message: string): string {
  if (!message || typeof message !== 'string') {
    return '';
  }

  return purify.sanitize(message.trim(), STRICT_SANITIZE_CONFIG);
}

/**
 * Rich sanitization for trusted content
 */
export function sanitizeRich(message: string): string {
  if (!message || typeof message !== 'string') {
    return '';
  }

  return purify.sanitize(message.trim(), RICH_SANITIZE_CONFIG);
}

/**
 * Escape HTML entities for display as plain text
 */
export function escapeHtml(message: string): string {
  if (!message || typeof message !== 'string') {
    return '';
  }

  return message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize username - only alphanumeric, spaces, and safe characters
 */
export function sanitizeUsername(username: string): string {
  if (!username || typeof username !== 'string') {
    return 'Anonymous';
  }

  return (
    username
      .trim()
      .slice(0, 50) // Max 50 characters
      .replace(/[^\w\s\-_.]/g, '') // Only word chars, spaces, hyphens, underscores, dots
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim() || 'Anonymous'
  );
}

/**
 * Check if message contains potentially dangerous content
 */
export function containsSuspiciousContent(message: string): boolean {
  if (!message || typeof message !== 'string') {
    return false;
  }

  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /onload=/i,
    /onerror=/i,
    /onclick=/i,
    /onmouseover=/i,
    /onfocus=/i,
    /data:text\/html/i,
  ];

  return suspiciousPatterns.some((pattern) => pattern.test(message));
}

export default {
  sanitizeChatMessage,
  sanitizeStrict,
  sanitizeRich,
  escapeHtml,
  sanitizeUsername,
  containsSuspiciousContent,
};
