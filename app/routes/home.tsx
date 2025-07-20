'use client';

import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ChatRoom } from '../components/ChatRoom';
import { useSession, signOut } from '../../lib/auth/better-auth-client';

export function meta() {
  return [
    { title: 'Chat App - React Router App' },
    { name: 'description', content: 'Real-time chat with Better Auth and Durable Objects!' },
  ];
}

export default function Home() {
  const navigate = useNavigate();
  const { data: sessionData, isPending } = useSession();

  useEffect(() => {
    console.log('Home page - isPending:', isPending, 'sessionData:', sessionData);
    if (!isPending && !sessionData?.user) {
      console.log('No user session, redirecting to login...');
      navigate('/login');
    }
  }, [sessionData, isPending, navigate]);

  if (isPending) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
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
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Public Chat</h1>
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
                  await signOut();
                  navigate('/login');
                }}
                className="px-3 py-2 sm:px-4 text-xs sm:text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-300 transition-all duration-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Chat Room */}
        <ChatRoom roomName="general" />
      </div>
    </div>
  );
}
