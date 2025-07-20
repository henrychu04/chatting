import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../server/routers';

function getBaseUrl() {
  if (typeof window !== 'undefined') {
    // Client-side: use relative URL
    return '';
  }

  // Server-side: determine URL based on environment
  if (process.env.NODE_ENV === 'production') {
    // In production, use the actual production URL
    return process.env.BETTER_AUTH_URL || 'https://chatting-app-2.henrychu04.workers.dev';
  }

  // Development: use local dev server
  return 'http://localhost:8787';
}

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
    }),
  ],
});
