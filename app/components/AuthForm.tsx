'use client';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { signIn, signUp, useSession } from '../../lib/auth/better-auth-client';

export function AuthForm() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { data: sessionData, isPending, refetch } = useSession();

  // Redirect to home page if user is logged in
  useEffect(() => {
    if (sessionData?.user) {
      navigate('/');
    }
  }, [sessionData?.user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'register') {
        if (formData.name && formData.email && formData.password) {
          const result = await signUp.email({
            name: formData.name,
            email: formData.email,
            password: formData.password,
          });

          if (result.data) {
            setFormData({ name: '', email: '', password: '' });
            refetch();
            console.log('Registration successful, redirecting to home...');
            navigate('/');
          } else if (result.error) {
            setError(
              result.error.message || 'Registration failed. Please try again.'
            );
          }
        }
      } else {
        if (formData.email && formData.password) {
          const result = await signIn.email({
            email: formData.email,
            password: formData.password,
          });

          if (result.data) {
            setFormData({ name: '', email: '', password: '' });
            refetch();
            console.log('Login successful, redirecting to home...');
            navigate('/');
          } else if (result.error) {
            setError(
              result.error.message ||
                'Login failed. Please check your credentials.'
            );
          }
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    // Clear messages when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleModeChange = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setError('');
    setSuccess('');
    setFormData({ name: '', email: '', password: '' });
  };

  if (isPending) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="w-6 h-6 bg-blue-500 rounded-full animate-pulse"></div>
        <div className="text-gray-600 text-sm">Loading...</div>
      </div>
    );
  }

  // If user is logged in, show loading while redirect happens
  if (sessionData?.user) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="w-6 h-6 bg-green-500 rounded-full animate-pulse"></div>
        <div className="text-gray-600 text-sm">Redirecting to chat...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Tab Selector */}
      <div className="mb-6">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => handleModeChange('login')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
              mode === 'login'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => handleModeChange('register')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
              mode === 'register'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Create Account
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-red-500 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-green-500 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <p className="text-sm text-green-700">{success}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {mode === 'register' && (
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              required={mode === 'register'}
              placeholder="Enter your full name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            placeholder="Enter your email"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            required
            placeholder={
              mode === 'register'
                ? 'Choose a password (min 6 chars)'
                : 'Enter your password'
            }
            minLength={mode === 'register' ? 6 : 1}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading
            ? `${mode === 'register' ? 'Creating Account' : 'Signing In'}...`
            : mode === 'register'
              ? 'Create Account'
              : 'Sign In'}
        </button>
      </form>

      {/* Help Text */}
      {mode === 'register' && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700 text-center">
            Creating an account allows you to keep your username and preferences
            across sessions
          </p>
        </div>
      )}
    </div>
  );
}
