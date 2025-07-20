import { z } from 'zod';

// Message validation schema
export const messageSchema = z
  .object({
    type: z.enum(['message', 'ping']),
    message: z
      .string()
      .min(1, 'Message cannot be empty')
      .max(1000, 'Message too long')
      .trim()
      .refine((msg) => !/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(msg), 'Invalid content detected'),
  })
  .strict();

// User info validation
export const userInfoSchema = z
  .object({
    userId: z.string().min(1).max(100),
    username: z
      .string()
      .min(1, 'Username required')
      .max(50, 'Username too long')
      .regex(/^[a-zA-Z0-9_-]+$/, 'Username contains invalid characters')
      .trim(),
  })
  .strict();

// Rate limiting helper
export class RateLimiter {
  private requests = new Map<string, number[]>();

  constructor(
    private windowMs: number = 60000, // 1 minute
    private maxRequests: number = 30 // 30 messages per minute
  ) {}

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get existing requests for this identifier
    const userRequests = this.requests.get(identifier) || [];

    // Filter out old requests
    const recentRequests = userRequests.filter((time) => time > windowStart);

    // Check if under limit
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);

    return true;
  }

  // Clean up old entries (call periodically)
  cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    for (const [identifier, requests] of this.requests.entries()) {
      const recentRequests = requests.filter((time) => time > windowStart);
      if (recentRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, recentRequests);
      }
    }
  }
}

// Content filtering
export function sanitizeMessage(message: string): string {
  return message
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

// Profanity filter (basic - expand as needed)
export function containsProfanity(message: string): boolean {
  const profanityList = ['spam', 'scam']; // Add your profanity words
  const lowerMessage = message.toLowerCase();
  return profanityList.some((word) => lowerMessage.includes(word));
}
