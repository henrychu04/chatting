import { initTRPC } from '@trpc/server';
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from '../database/schema';

export interface Context {
  db: DrizzleD1Database<typeof schema>;
  env: Env;
}

export const createTRPCContext = async (
  opts: FetchCreateContextFnOptions & {
    env: Env;
    ctx: ExecutionContext;
  }
): Promise<Context> => {
  const db = drizzle(opts.env.DB, { schema });

  return {
    db,
    env: opts.env,
  };
};

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
