import React, { useRef } from 'react';
import type { Document } from '../types';

interface SidebarProps {
  documents: Document[];
  selectedDocumentId: string | null;
  isLoading: boolean;
  onDocumentSelect: (docId: string) => void;
  onFileUpload: (file: File) => void;
  onBackToHome?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  documents,
  selectedDocumentId,
  isLoading,
  onDocumentSelect,
  onFileUpload,
  onBackToHome,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
      // Clear the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="w-60 border-r border-gray-800/50 bg-black/80 backdrop-blur-sm p-4 flex flex-col relative z-10">
      {/* Back to Home Button */}
      {onBackToHome && (
        <button
          onClick={onBackToHome}
          className="mb-6 flex items-center text-gray-500 hover:text-gray-300 transition-colors duration-200 font-light text-sm"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </button>
      )}
      
      <h2 className="text-lg font-light text-white mb-6 tracking-wide">My Documents</h2>
      
      {/* Upload Button - Codex Style */}
      <button
        onClick={handleFileSelect}
        disabled={isLoading}
        className={`
          w-full p-3 mb-6 rounded border border-gray-700 font-light transition-all duration-200 text-sm
          ${isLoading 
            ? 'bg-gray-800/50 cursor-not-allowed text-gray-500' 
            : 'bg-gray-900/50 hover:bg-gray-800/70 text-gray-300 hover:text-white hover:border-gray-600'
          }
        `}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="w-4 h-4 border border-gray-500 border-t-transparent rounded-full animate-spin mr-2"></div>
            Processing...
          </div>
        ) : (
          '+ Upload PDF'
        )}
      </button>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf"
        className="hidden"
      />

      {/* Document List - Codex Style */}
      <div className="flex-1 overflow-y-auto space-y-1">
        {documents.map((doc) => (
          <button
            key={doc.document_id}
            onClick={() => onDocumentSelect(doc.document_id)}
            className={`
              w-full p-3 rounded border text-left transition-all duration-200 font-light text-xs
              ${selectedDocumentId === doc.document_id
                ? 'bg-gray-800 text-white border-gray-600 shadow-sm'
                : 'bg-gray-900/30 text-gray-400 border-gray-800 hover:bg-gray-800/50 hover:text-gray-300 hover:border-gray-700'
              }
              break-all
            `}
          >
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${selectedDocumentId === doc.document_id ? 'bg-green-400' : 'bg-gray-600'}`}></div>
              {doc.filename}
            </div>
          </button>
        ))}
        
        {documents.length === 0 && !isLoading && (
          <div className="text-gray-600 text-xs text-center mt-8 font-light">
            No documents loaded.
            <br />
            Upload to begin analysis.
          </div>
        )}
      </div>
    </div>
  );
};