import React from 'react';
import type { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === 'user';

  return (
    <div className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`
          max-w-[70%] p-3 rounded-2xl shadow-sm
          ${isUser 
            ? 'bg-blue-600 text-white rounded-br-md' 
            : 'bg-gray-700 text-gray-100 rounded-bl-md'
          }
          whitespace-pre-wrap wrap-break-word
        `}
      >
        {message.text}
      </div>
    </div>
  );
};

interface LoadingMessageProps {}

export const LoadingMessage: React.FC<LoadingMessageProps> = () => {
  return (
    <div className="flex justify-start mb-4">
      <div className="bg-gray-700 text-gray-100 p-3 rounded-2xl rounded-bl-md">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};