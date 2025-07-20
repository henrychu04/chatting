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

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: 'sqlite',
      schema,
    }),
    baseURL: env.BETTER_AUTH_URL || 'http://localhost:8787',
    secret: env.BETTER_AUTH_SECRET,
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
    trustedOrigins:
      process.env.NODE_ENV === 'production'
        ? [env.BETTER_AUTH_URL || 'https://your-domain.com']
        : ['http://localhost:8787', 'http://localhost:5173'],
    csrfProtection: {
      enabled: process.env.NODE_ENV === 'production', // Enable CSRF in production
    },
    rateLimit: {
      window: 60 * 1000, // 1 minute
      max: 10, // 10 requests per minute per IP
    },
  });
}
