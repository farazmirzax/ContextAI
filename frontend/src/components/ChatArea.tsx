import React, { useEffect, useRef } from 'react';
import { ChatMessage, LoadingMessage } from './ChatMessage';
import type { Message, Document } from '../types';

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  selectedDocument: Document | null;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  isLoading,
  selectedDocument,
}) => {
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const showLoadingMessage = isLoading && 
    messages.length > 0 && 
    messages[messages.length - 1].sender === 'user';

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-gray-900">
      {messages.length === 0 && !isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-500">
            {selectedDocument ? (
              <>
                <div className="text-2xl mb-2">💬</div>
                <div className="text-lg mb-2">Ready to chat!</div>
                <div className="text-sm">
                  Ask a question about "{selectedDocument.filename}"
                </div>
              </>
            ) : (
              <>
                <div className="text-4xl mb-4">📄</div>
                <div className="text-xl mb-2">Welcome to PDF Chat</div>
                <div className="text-sm">
                  Please upload or select a document to start chatting.
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {showLoadingMessage && <LoadingMessage />}
          <div ref={chatBottomRef} />
        </>
      )}
    </div>
  );
};