import { router } from '../trpc';

export const appRouter = router({
  // Add your other routers here
  // For now, better-auth handles authentication via its own endpoints
});

export type AppRouter = typeof appRouter;
