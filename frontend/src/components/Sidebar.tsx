import React, { useRef } from 'react';
import type { Document } from '../types';

interface SidebarProps {
  documents: Document[];
  selectedDocumentId: string | null;
  isLoading: boolean;
  onDocumentSelect: (docId: string) => void;
  onFileUpload: (file: File) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  documents,
  selectedDocumentId,
  isLoading,
  onDocumentSelect,
  onFileUpload,
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
    <div className="w-60 border-r border-gray-700 bg-gray-900 p-4 flex flex-col">
      <h2 className="text-lg font-semibold text-white mb-4">My Documents</h2>
      
      {/* Upload Button */}
      <button
        onClick={handleFileSelect}
        disabled={isLoading}
        className={`
          w-full p-3 mb-4 rounded-lg font-medium transition-all duration-200
          ${isLoading 
            ? 'bg-blue-500/50 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
          }
          text-white shadow-md hover:shadow-lg
        `}
      >
        {isLoading ? 'Processing...' : '+ Upload PDF'}
      </button>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf"
        className="hidden"
      />

      {/* Document List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {documents.map((doc) => (
          <button
            key={doc.document_id}
            onClick={() => onDocumentSelect(doc.document_id)}
            className={`
              w-full p-3 rounded-lg text-left transition-all duration-200
              ${selectedDocumentId === doc.document_id
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }
              text-sm break-all
            `}
          >
            {doc.filename}
          </button>
        ))}
        
        {documents.length === 0 && !isLoading && (
          <div className="text-gray-500 text-sm text-center mt-8">
            No documents uploaded yet.
            <br />
            Upload a PDF to get started.
          </div>
        )}
      </div>
    </div>
  );
};