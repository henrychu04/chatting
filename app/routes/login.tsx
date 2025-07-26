import { AuthForm } from '../components/AuthForm';
import { useState } from 'react';
import { trpc } from '../lib/trpc';

export function meta() {
  return [{ title: 'Login - Chat App' }, { name: 'description', content: 'Sign in to join the chat' }];
}

export default function Login() {
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null);
  const deleteUser = trpc.deleteUser.useMutation();
  const [showWarning, setShowWarning] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);

  async function handleDeleteUser(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      await deleteUser.mutateAsync({ email });
      setResult({ success: true });
    } catch (err: any) {
      setResult({ error: err?.message || 'An error occurred.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-sm sm:max-w-md">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8 animate-fade-in">
          <div className="text-center mb-6 sm:mb-8">
            <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 animate-bounce-in">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Welcome</h1>
            <p className="text-sm sm:text-base text-gray-600">Sign in to your account to continue</p>
          </div>
          <AuthForm />
          <div className="mt-4 text-center">
            <button
              type="button"
              className="text-xs sm:text-sm text-blue-600 hover:underline focus:outline-none"
              onClick={() => {
                setShowWarning(true);
                setShowEmailInput(false);
                setResult(null);
              }}
            >
              Forgot password?
            </button>
            {showWarning && (
              <div className="mt-3 p-3 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded text-xs sm:text-sm">
                <strong>Warning:</strong> Your account will be <span className="font-bold">deleted</span> if you
                proceed.
                <br />
                {!showEmailInput ? (
                  <>
                    <button
                      type="button"
                      className="mt-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs sm:text-sm"
                      onClick={() => setShowEmailInput(true)}
                    >
                      Proceed
                    </button>
                    <button
                      type="button"
                      className="mt-2 ml-2 px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-xs sm:text-sm"
                      onClick={() => setShowWarning(false)}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <form onSubmit={handleDeleteUser} className="mt-3 space-y-2">
                    <input
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                    <button
                      type="submit"
                      className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition disabled:opacity-50 text-xs sm:text-sm"
                      disabled={loading}
                    >
                      {loading ? 'Deleting...' : 'Delete my account'}
                    </button>
                    <button
                      type="button"
                      className="w-full bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 transition text-xs sm:text-sm"
                      onClick={() => {
                        setShowWarning(false);
                        setShowEmailInput(false);
                        setResult(null);
                        setEmail('');
                      }}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    {result?.success && (
                      <div className="mt-2 text-green-700 text-sm">Account deleted successfully.</div>
                    )}
                    {result?.error && <div className="mt-2 text-red-700 text-sm">{result.error}</div>}
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal for delete confirmation */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs">
            <h2 className="text-lg font-semibold mb-2 text-red-700">Delete Account</h2>
            <p className="text-sm mb-4 text-gray-700">
              Warning: Your account will be <span className="font-bold">deleted</span> if you proceed. This action
              cannot be undone.
            </p>
            <form onSubmit={handleDeleteUser} className="space-y-3">
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="submit"
                className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete my account'}
              </button>
              <button
                type="button"
                className="w-full bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 transition"
                onClick={() => {
                  setShowModal(false);
                  setResult(null);
                  setEmail('');
                }}
                disabled={loading}
              >
                Cancel
              </button>
            </form>
            {result?.success && <div className="mt-3 text-green-700 text-sm">Account deleted successfully.</div>}
            {result?.error && <div className="mt-3 text-red-700 text-sm">{result.error}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
