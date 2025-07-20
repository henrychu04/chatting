'use client';

import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? '' : 'http://localhost:8787',
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
