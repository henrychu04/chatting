import React from 'react';

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: string;
  type: 'message' | 'join' | 'leave' | 'system';
}

interface MessageItemProps {
  message: ChatMessage;
  formatTime: (timestamp: string) => string;
  currentUserName?: string;
}

export const MessageItem = React.memo(({ message, formatTime, currentUserName }: MessageItemProps) => {
  const getUsernameStyle = (username: string) => {
    if (currentUserName && username === currentUserName) {
      return 'text-blue-600';
    }
    if (username.startsWith('Guest')) {
      return 'text-purple-600';
    }
    return 'text-gray-700';
  };

  return (
    <div className="hover:bg-white hover:shadow-sm rounded-lg group">
      {message.type === 'message' ? (
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-baseline gap-1 sm:gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-gray-500 min-w-[40px] sm:min-w-[50px] font-mono">
              {formatTime(message.timestamp)}
            </span>
            <span className={`font-semibold text-sm ${getUsernameStyle(message.username)}`}>{message.username}:</span>
          </div>
          <span className="text-gray-900 break-words text-sm sm:text-base leading-relaxed sm:flex-1 pl-12 sm:pl-0">
            {message.message}
          </span>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
          <span className="text-xs text-gray-500 min-w-[40px] sm:min-w-[50px] font-mono">
            {formatTime(message.timestamp)}
          </span>
          <span className="text-blue-600 italic text-sm pl-12 sm:pl-0">{message.message}</span>
        </div>
      )}
    </div>
  );
});

MessageItem.displayName = 'MessageItem';
