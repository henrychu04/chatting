'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { useState } from 'react';
import { trpc } from '../lib/trpc';

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

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
