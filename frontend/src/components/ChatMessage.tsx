import React from 'react';
import type { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === 'user';

  return (
    <div className={`flex mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] ${isUser ? 'text-right' : 'text-left'}`}>
        {/* Message Label */}
        <div className={`text-xs text-gray-500 mb-1 font-light tracking-wider ${isUser ? 'text-right' : 'text-left'}`}>
          {isUser ? 'USER' : 'CONTEXTAI'}
        </div>
        
        {/* Message Content */}
        <div
          className={`
            p-4 border font-light text-sm leading-relaxed
            ${isUser 
              ? 'bg-gray-900/50 text-gray-200 border-gray-700 rounded-l-lg rounded-tr-lg' 
              : 'bg-gray-800/30 text-gray-300 border-gray-700/50 rounded-r-lg rounded-tl-lg'
            }
            whitespace-pre-wrap break-words backdrop-blur-sm
          `}
        >
          {message.text}
        </div>
      </div>
    </div>
  );
};

interface LoadingMessageProps {}

export const LoadingMessage: React.FC<LoadingMessageProps> = () => {
  return (
    <div className="flex justify-start mb-6">
      <div className="max-w-[80%] w-full">
        {/* Loading Label */}
        <div className="text-xs text-gray-500 mb-1 font-light tracking-wider">
          CONTEXTAI
        </div>
        
        {/* Loading Content with Progress Bar */}
        <div className="bg-gray-800/30 text-gray-300 border border-gray-700/50 p-4 rounded-r-lg rounded-tl-lg backdrop-blur-sm">
          <div className="space-y-2">
            <span className="text-xs text-gray-500 font-light">Processing...</span>
            {/* Progress Bar Container */}
            <div className="w-full bg-gray-700/40 rounded-full h-2 overflow-hidden border border-gray-600/30">
              {/* Animated Progress Fill */}
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full animate-pulse"
                style={{
                  animation: 'progress 2s ease-in-out infinite',
                  width: '30%',
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* CSS Animation for smoother progress effect */}
      <style>{`
        @keyframes progress {
          0% { width: 10%; }
          50% { width: 90%; }
          100% { width: 10%; }
        }
      `}</style>
    </div>
  );
};