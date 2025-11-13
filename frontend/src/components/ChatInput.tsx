import React, { useState } from 'react';

interface ChatInputProps {
  isLoading: boolean;
  hasSelectedDocument: boolean;
  onSendMessage: (message: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  isLoading,
  hasSelectedDocument,
  onSendMessage,
}) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading && hasSelectedDocument) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const isDisabled = isLoading || !hasSelectedDocument;

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 p-6 border-t border-gray-700 bg-gray-900">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={
          !hasSelectedDocument 
            ? "Please select a document first" 
            : isLoading 
              ? "Waiting for response..." 
              : "Ask about the selected document..."
        }
        disabled={isDisabled}
        className={`
          flex-1 p-3 rounded-lg border transition-all duration-200
          ${isDisabled 
            ? 'bg-gray-800 border-gray-600 text-gray-500 cursor-not-allowed' 
            : 'bg-gray-800 border-gray-600 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
          }
          outline-none
        `}
      />
      <button
        type="submit"
        disabled={isDisabled || !input.trim()}
        className={`
          px-6 py-3 rounded-lg font-medium transition-all duration-200
          ${isDisabled || !input.trim()
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-md hover:shadow-lg'
          }
        `}
      >
        Send
      </button>
    </form>
  );
};