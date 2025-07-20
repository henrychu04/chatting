import { AuthForm } from '../components/AuthForm';

export function meta() {
  return [{ title: 'Login - Chat App' }, { name: 'description', content: 'Sign in to join the chat' }];
}

export default function Login() {
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
        </div>

        <div className="text-center mt-4 sm:mt-6">
          <p className="text-xs sm:text-sm text-gray-500">Secure • Real-time • Easy to use</p>
        </div>
      </div>
    </div>
  );
}
