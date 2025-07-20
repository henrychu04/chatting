import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../../database/schema';

interface BetterAuthEnv {
  DB: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL?: string;
}

export function createAuth(env: BetterAuthEnv) {
  const db = drizzle(env.DB, { schema });

  // Get secret from environment (Cloudflare Workers env or process.env for local dev)
  const secret = env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET;

  if (!secret) {
    throw new Error(
      'BETTER_AUTH_SECRET is required. Set it in .env file for development or use: npx wrangler secret put BETTER_AUTH_SECRET for production'
    );
  }

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: 'sqlite',
      schema,
    }),
    baseURL: env.BETTER_AUTH_URL,
    secret: secret,
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 24 hours
    },
    user: {
      additionalFields: {
        role: {
          type: 'string',
          defaultValue: 'user',
        },
      },
    },
    trustedOrigins: [env.BETTER_AUTH_URL || ''],
    csrfProtection: {
      enabled: process.env.NODE_ENV === 'production', // Enable CSRF in production
    },
    rateLimit: {
      enabled: process.env.NODE_ENV === 'production', // Enable rate limiting in production
      window: 60 * 1000, // 1 minute
      max: 10, // 10 requests per minute per IP
    },
    advanced: {
      crossSubDomainCookies: {
        enabled: false,
      },
      useSecureCookies: process.env.NODE_ENV === 'production', // Use secure cookies in production
    },
  });
}
