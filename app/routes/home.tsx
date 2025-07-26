'use client';

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Facet } from '../components/Facet';
import { useSession, signOut } from '../../lib/auth/better-auth-client';

export function meta() {
  return [
    { title: 'Edge Chat - Real-time Messaging' },
    { name: 'description', content: 'Real-time messaging with Edge Chat - powered by Cloudflare!' },
  ];
}

export default function Home() {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);
  const { data: sessionData, isPending, refetch } = useSession();

  // Client-side hydration detection
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle authentication redirect with delay to prevent flash
  useEffect(() => {
    if (isClient && !isPending && !sessionData?.user && !hasRedirected) {
      console.log('No user session, redirecting to login...');
      setHasRedirected(true);
      // Small delay to prevent flash during navigation
      setTimeout(() => {
        navigate('/login');
      }, 100);
    }
  }, [sessionData, isPending, navigate, isClient, hasRedirected]);

  // Show consistent loading state during SSR and initial client load
  if (!isClient || isPending || (!sessionData?.user && !hasRedirected)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center gap-4">
          <div className="w-8 h-8 bg-blue-500 rounded-full animate-pulse"></div>
          <div className="text-gray-600">Loading chat...</div>
        </div>
      </div>
    );
  }

  if (!sessionData?.user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-2 sm:p-4 lg:p-6">
        {/* Header Card */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg mb-3 sm:mb-4 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Edge Chat</h1>
                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Live</span>
                  </div>
                  <span className="hidden sm:inline">•</span>
                  <span className="hidden sm:inline">Real-time messaging</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={async () => {
                  console.log('Sign out button clicked');
                  setIsLoggingOut(true);
                  try {
                    console.log('Attempting to sign out...');
                    const result = await signOut();
                    console.log('Sign out result:', result);

                    // Clear any local storage items that might contain auth data
                    if (typeof window !== 'undefined') {
                      localStorage.clear();
                      sessionStorage.clear();

                      // Clear cookies manually as a fallback
                      document.cookie.split(';').forEach((c) => {
                        const eqPos = c.indexOf('=');
                        const name = eqPos > -1 ? c.substr(0, eqPos) : c;
                        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
                      });
                    }

                    // Refetch session to clear local state
                    await refetch();
                    console.log('Session refetched after logout');

                    // Navigate to login page
                    navigate('/login');
                  } catch (error) {
                    console.error('Sign out error:', error);
                    console.error('Error details:', error);

                    // Even if sign out fails, clear local data and redirect
                    if (typeof window !== 'undefined') {
                      localStorage.clear();
                      sessionStorage.clear();
                    }
                    await refetch();
                    navigate('/login');
                  } finally {
                    setIsLoggingOut(false);
                  }
                }}
                disabled={isLoggingOut}
                className="px-3 py-2 sm:px-4 text-xs sm:text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>

        {/* Facet */}
        <Facet facetName="general" />
      </div>
    </div>
  );
}
