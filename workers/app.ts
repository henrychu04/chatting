import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1';
import { createRequestHandler } from 'react-router';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import * as schema from '../database/schema';
import { createTRPCContext } from '../server/trpc';
import { appRouter } from '../server/routers';
import { createAuth } from '../lib/auth/better-auth';
import { ChatRoom } from './chat-room';

declare module 'react-router' {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
    db: DrizzleD1Database<typeof schema>;
    auth: ReturnType<typeof createAuth>;
  }
}

// Export the ChatRoom class for Durable Objects
export { ChatRoom } from './chat-room';

const requestHandler = createRequestHandler(() => import('virtual:react-router/server-build'), import.meta.env.MODE);

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle WebSocket connections to chat rooms
    if (url.pathname.startsWith('/api/chat/')) {
      const roomName = url.pathname.split('/')[3] || 'general';
      const durableObjectId = env.CHAT_ROOM.idFromName(roomName);
      const durableObject = env.CHAT_ROOM.get(durableObjectId);

      // Forward request to the Durable Object
      return durableObject.fetch(request);
    }

    // Initialize better-auth
    const auth = createAuth({
      DB: env.DB,
      BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET || 'fallback-secret-for-development',
      BETTER_AUTH_URL: env.BETTER_AUTH_URL,
    });

    // Handle better-auth requests
    if (url.pathname.startsWith('/api/auth/')) {
      return auth.handler(request);
    }

    // Handle tRPC requests
    if (url.pathname.startsWith('/api/trpc/')) {
      return fetchRequestHandler({
        endpoint: '/api/trpc',
        req: request,
        router: appRouter,
        createContext: (opts) => createTRPCContext({ ...opts, env, ctx }),
      });
    }

    // Handle React Router requests
    const db = drizzle(env.DB, { schema });
    return requestHandler(request, {
      cloudflare: { env, ctx },
      db,
      auth,
    });
  },
} satisfies ExportedHandler<Env>;
