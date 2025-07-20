'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSession } from '../../lib/auth/better-auth-client';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { MessageItem } from './MessageItem';

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: string;
  type: 'message' | 'join' | 'leave' | 'system';
}

interface ChatRoomProps {
  roomName?: string;
}

export function ChatRoom({ roomName = 'general' }: ChatRoomProps) {
  const { data: sessionData, isPending: sessionLoading } = useSession();
  const [anonymousUser, setAnonymousUser] = useState<{ id: string; name: string } | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>(
    'disconnected'
  );
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive with better performance
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      // Use requestAnimationFrame for better performance on mobile
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: 'auto', // Changed to auto for smoother push-up effect
          block: 'end',
          inline: 'nearest',
        });
      });
    }
  }, []);

  // Memoize current user to prevent unnecessary re-renders
  const currentUser = useMemo(() => {
    return sessionData?.user || anonymousUser;
  }, [sessionData?.user, anonymousUser]);

  // Virtualize messages - only render last 100 messages for performance
  const visibleMessages = useMemo(() => {
    const MAX_VISIBLE_MESSAGES = 100;
    return messages.length > MAX_VISIBLE_MESSAGES ? messages.slice(-MAX_VISIBLE_MESSAGES) : messages;
  }, [messages]);

  // Memoize placeholder text to prevent unnecessary recalculations
  const inputPlaceholder = useMemo(() => {
    if (!currentUser) return 'Loading...';
    const displayName = currentUser.name.length > 15 ? currentUser.name.slice(0, 15) + '...' : currentUser.name;
    return `Message as ${displayName}...`;
  }, [currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!currentUser) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const userId = currentUser.id;
    const username = currentUser.name;

    const wsUrl = `${protocol}//${host}/api/chat/${roomName}?userId=${encodeURIComponent(
      userId
    )}&username=${encodeURIComponent(username)}`;

    setConnectionStatus('connecting');
    setHasInitialLoad(false);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionStatus('connected');
        setHasInitialLoad(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data); // Debug log

          switch (data.type) {
            case 'message':
              setMessages((prev) => {
                // Check if message already exists to prevent duplicates
                if (prev.some((msg) => msg.id === data.id)) {
                  return prev;
                }
                return [...prev, data];
              });
              break;

            case 'join':
            case 'leave':
              // Log join/leave events but don't show them in chat
              console.log(`User ${data.type}: ${data.username}`);
              // Update online users count if provided
              if (data.onlineUsers && Array.isArray(data.onlineUsers)) {
                console.log('Updating online users:', data.onlineUsers);
                setOnlineUsers(data.onlineUsers);
              }
              break;

            case 'userCount':
              // Handle user count updates
              if (data.onlineUsers && Array.isArray(data.onlineUsers)) {
                console.log('User count update:', data.onlineUsers);
                setOnlineUsers(data.onlineUsers);
              }
              break;

            case 'system':
              setMessages((prev) => {
                // Check if message already exists to prevent duplicates
                if (prev.some((msg) => msg.id === data.id)) {
                  return prev;
                }
                return [...prev, data];
              });
              // Update online users if provided with system message
              if (data.onlineUsers && Array.isArray(data.onlineUsers)) {
                console.log('System message online users:', data.onlineUsers);
                setOnlineUsers(data.onlineUsers);
              }
              break;

            case 'history':
              if (data.messages && Array.isArray(data.messages)) {
                // Filter out join/leave messages from history
                const chatMessages = data.messages.filter(
                  (msg: ChatMessage) => msg.type === 'message' || msg.type === 'system'
                );
                setMessages((prev) => {
                  // Create a Set of existing message IDs for efficient lookup
                  const existingIds = new Set(prev.map((msg) => msg.id));
                  // Only add messages that don't already exist
                  const newMessages = chatMessages.filter((msg: ChatMessage) => !existingIds.has(msg.id));
                  return [...prev, ...newMessages];
                });
              }
              // Update online users if provided with history
              if (data.onlineUsers && Array.isArray(data.onlineUsers)) {
                console.log('History online users:', data.onlineUsers);
                setOnlineUsers(data.onlineUsers);
              }
              break;

            case 'error':
              console.error('Chat error:', data.message);
              break;

            case 'pong':
              // Handle ping/pong for keep-alive
              break;

            default:
              console.log('Unknown message type:', data.type);
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        setHasInitialLoad(false);
        setOnlineUsers([]); // Clear online users when disconnected

        // Attempt to reconnect immediately if not manually closed
        if (event.code !== 1000) {
          console.log('Attempting to reconnect...');
          connect();
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setConnectionStatus('error');
    }
  }, [currentUser, roomName]);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }

    setHasInitialLoad(false);
    setOnlineUsers([]); // Clear online users when manually disconnecting
  }, []);

  // Send message
  const sendMessage = useCallback(() => {
    if (!wsRef.current || !inputMessage.trim()) return;

    const message = {
      type: 'message',
      message: inputMessage.trim(),
    };

    try {
      wsRef.current.send(JSON.stringify(message));
      setInputMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [inputMessage]);

  // Handle form submission
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      sendMessage();
    },
    [sendMessage]
  );

  // Handle input key press
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  // Handle touch events for better mobile experience
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Prevent iOS Safari from zooming when focusing on input
    if (e.target instanceof HTMLInputElement) {
      e.target.style.fontSize = '16px';
    }
  }, []);

  // Debounced input change handler
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
  }, []);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Separate effect for managing anonymous user creation
  useEffect(() => {
    // Only create anonymous user if:
    // 1. We're on the client
    // 2. Session is not loading
    // 3. No session data exists (no user)
    // 4. No anonymous user already exists
    if (isClient && !sessionLoading && !sessionData?.user && !anonymousUser) {
      const randomId = Math.random().toString(36).substring(2, 8);
      const anonymousUserData = {
        id: `anon_${randomId}`,
        name: `Guest${randomId.toUpperCase()}`,
      };
      setAnonymousUser(anonymousUserData);
    }

    // Clear anonymous user if we have a real user session
    if (sessionData?.user && anonymousUser) {
      setAnonymousUser(null);
    }
  }, [isClient, sessionLoading, sessionData?.user, anonymousUser]);

  // Connect when component mounts and user is available (authenticated or anonymous)
  useEffect(() => {
    if (currentUser && isClient) {
      // Disconnect first if we're already connected to prevent multiple connections
      if (wsRef.current) {
        disconnect();
      }
      // Connect immediately
      connect();
    }

    return () => {
      disconnect();
    };
  }, [sessionData?.user, anonymousUser, roomName, isClient]);

  // Format timestamp
  const formatTime = useCallback((timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  if (!isClient) {
    return (
      <Card className="flex flex-col h-96">
        <CardHeader>
          <CardTitle className="text-lg">Chat Room: {roomName}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <p className="text-gray-600">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  // Show loading while session is being checked
  if (sessionLoading) {
    return (
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg flex flex-col h-[calc(100vh-140px)] sm:h-[calc(100vh-180px)] lg:h-[calc(100vh-200px)]">
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Chat Messages</h2>
        </div>
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-full animate-pulse mx-auto mb-2"></div>
            <div className="text-gray-600 text-xs sm:text-sm">Loading chat...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg flex flex-col h-[calc(100vh-140px)] sm:h-[calc(100vh-180px)] lg:h-[calc(100vh-200px)]">
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Chat Messages</h2>
        </div>
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-500 rounded-full animate-pulse mx-auto mb-2"></div>
            <div className="text-gray-600 text-xs sm:text-sm">Setting up your account...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg flex flex-col h-[calc(100vh-140px)] sm:h-[calc(100vh-180px)] lg:h-[calc(100vh-200px)]">
      <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Chat Messages</h2>
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <span
                className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected'
                    ? 'bg-green-500'
                    : connectionStatus === 'connecting'
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
              ></span>
              <span className="text-gray-600 capitalize">{connectionStatus}</span>
            </div>

            {/* Active users count */}
            {connectionStatus === 'connected' && (
              <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600">
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0A6 6 0 0021 15H9a6 6 0 006-6.001z"
                  />
                </svg>
                <span>
                  {onlineUsers.length === 0
                    ? 'Loading users...'
                    : onlineUsers.length === 1
                    ? '1 user active'
                    : `${onlineUsers.length} users active`}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <div className="text-xs sm:text-sm text-gray-600">
              <span className="hidden sm:inline">You're chatting as </span>
              <span className="sm:hidden">Chatting as </span>
              <span className="font-medium text-gray-900 truncate max-w-[150px] sm:max-w-none">{currentUser.name}</span>
              {sessionData?.user && (
                <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">Verified</span>
              )}
            </div>
            {!isConnected && connectionStatus !== 'connecting' && (
              <button
                onClick={connect}
                className="px-2 py-1 sm:px-3 text-xs sm:text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-300 transition-all duration-200"
              >
                Reconnect
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-gray-50 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 flex flex-col justify-end">
        {!hasInitialLoad ? (
          <div></div>
        ) : visibleMessages.length === 0 ? (
          <div className="text-center py-8 sm:py-12 flex-shrink-0">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Welcome to the chat!</h3>
            <p className="text-sm sm:text-base text-gray-600 px-4">
              Start the conversation by sending a message below.
            </p>
          </div>
        ) : (
          <div className="space-y-0.5 sm:space-y-1 flex-shrink-0">
            {messages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                formatTime={formatTime}
                currentUserName={currentUser?.name}
              />
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 sm:p-4 border-t border-gray-200 bg-white">
        <form onSubmit={handleSubmit} className="flex gap-2 sm:gap-3">
          <input
            type="text"
            value={inputMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            onTouchStart={handleTouchStart}
            placeholder={inputPlaceholder}
            disabled={!isConnected}
            className="flex-1 px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-400 transition-all duration-200"
            style={{ fontSize: '16px' }}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="sentences"
          />
          <button
            type="submit"
            disabled={!isConnected || !inputMessage.trim()}
            className="px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:from-blue-600 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 min-w-[60px] sm:min-w-[80px]"
          >
            <span className="hidden sm:inline">Send</span>
            <span className="sm:hidden">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
