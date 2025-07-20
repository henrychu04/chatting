import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../server/routers';

function getBaseUrl() {
  if (typeof window !== 'undefined') {
    // Client-side should use relative URL
    return '';
  }
  // SSR should use localhost or production URL
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
