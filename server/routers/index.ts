import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { user } from '../../database/schema';
import { eq } from 'drizzle-orm/sql/expressions/conditions';

export const appRouter = router({
  // Add your other routers here
  // For now, better-auth handles authentication via its own endpoints

  deleteUser: publicProcedure
    .input(
      z.object({ email: z.email() })
    )
    .mutation(async ({ ctx, input }) => {
      // Delete the user by email
      await ctx.db.delete(user).where(eq(user.email, input.email));
      return { success: true };
    }),
});

export type AppRouter = typeof appRouter;
