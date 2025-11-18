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
    <form onSubmit={handleSubmit} className="flex gap-3 p-6 border-t border-gray-800/50 bg-black/80 backdrop-blur-sm">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={
          !hasSelectedDocument 
            ? "Select document to initialize..." 
            : isLoading 
              ? "Processing query..." 
              : "Enter query..."
        }
        disabled={isDisabled}
        className={`
          flex-1 p-4 rounded border transition-all duration-200 font-light text-sm
          ${isDisabled 
            ? 'bg-gray-900/30 border-gray-800 text-gray-600 cursor-not-allowed' 
            : 'bg-gray-900/50 border-gray-700 text-gray-200 focus:border-gray-500 focus:bg-gray-800/50'
          }
          outline-none backdrop-blur-sm
        `}
      />
      <button
        type="submit"
        disabled={isDisabled || !input.trim()}
        className={`
          px-6 py-4 rounded border font-light text-sm transition-all duration-200
          ${isDisabled || !input.trim()
            ? 'bg-gray-900/30 border-gray-800 text-gray-600 cursor-not-allowed'
            : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700/50 hover:text-white hover:border-gray-600'
          }
          backdrop-blur-sm
        `}
      >
        Send
      </button>
    </form>
  );
};