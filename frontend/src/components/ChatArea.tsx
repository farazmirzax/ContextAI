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
    <div className="flex-1 overflow-y-auto p-6 bg-black/80">
      {messages.length === 0 && !isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-600">
            {selectedDocument ? (
              <>
                <div className="text-sm mb-3 font-light">READY</div>
                <div className="text-lg mb-2 font-light text-gray-300">Begin Analysis</div>
                <div className="text-xs text-gray-500">
                  Query: {selectedDocument.filename}
                </div>
              </>
            ) : (
              <>
                <div className="text-xs mb-3 font-light tracking-wider">WAITING</div>
                <div className="text-lg mb-2 font-light text-gray-400">No Document Selected</div>
                <div className="text-xs text-gray-600">
                  Load document to initialize conversation.
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