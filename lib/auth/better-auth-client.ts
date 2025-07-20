'use client';

import { createAuthClient } from 'better-auth/react';
import { useState, useEffect } from 'react';

function getBaseURL() {
  if (typeof window !== 'undefined') {
    // Client-side: use relative URLs
    return '';
  }

  // Server-side: determine URL based on environment
  if (process.env.NODE_ENV === 'production') {
    // In production, use the actual production URL
    return process.env.BETTER_AUTH_URL;
  }

  // Development: use local dev server
  return 'http://localhost:8787';
}

// Always create the auth client, but handle SSR gracefully
export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  fetchOptions: {
    credentials: 'include', // Include cookies for authentication
  },
});

// Create SSR-safe versions of auth functions
const {
  signIn: originalSignIn,
  signUp: originalSignUp,
  signOut: originalSignOut,
  useSession: originalUseSession,
  getSession: originalGetSession,
} = authClient;

// SSR-safe useSession hook
function ssrSafeUseSession() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Always call the original hook but return safe values during SSR
  const sessionResult = originalUseSession();

  if (!isClient) {
    return {
      data: null,
      isPending: true,
      error: null,
      refetch: () => Promise.resolve(),
    };
  }

  return sessionResult;
}

export const signIn = originalSignIn;
export const signUp = originalSignUp;
export const signOut = originalSignOut;
export const useSession = ssrSafeUseSession;
export const getSession = originalGetSession;
