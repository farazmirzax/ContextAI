import React, { useRef } from 'react';
import type { Document } from '../types';

interface SidebarProps {
  documents: Document[];
  selectedDocumentId: string | null;
  isLoading: boolean;
  onDocumentSelect: (docId: string) => void;
  onFileUpload: (file: File) => void;
  onBackToHome?: () => void;
  uploadProgress?: { step: string; percentage: number };
}

export const Sidebar: React.FC<SidebarProps> = ({
  documents,
  selectedDocumentId,
  isLoading,
  onDocumentSelect,
  onFileUpload,
  onBackToHome,
  uploadProgress,
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
    <div className="w-full sm:w-60 border-r border-gray-800/50 bg-black/80 backdrop-blur-sm p-2 sm:p-4 flex flex-col relative z-10">
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
          <div className="flex flex-col items-center justify-center space-y-1.5">
            <span className="text-xs text-gray-300">{uploadProgress?.step || 'Processing...'}</span>
            <div className="w-full bg-gray-700/40 rounded-full h-1.5 overflow-hidden border border-gray-600/30">
              <div 
                className="relative h-full bg-linear-to-r from-cyan-500 to-blue-500 transition-all duration-500 ease-out rounded-full"
                style={{
                  width: `${uploadProgress?.percentage || 0}%`,
                  boxShadow: '0 0 10px rgba(34, 211, 238, 0.45)'
                }}
              >
                {/* Shimmer glow constrained to the filled width */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-3 w-1/3 rounded-full bg-white/70 blur-md pointer-events-none"
                  style={{
                    animation: 'glowSweep 1.6s linear infinite',
                    left: '-30%'
                  }}
                />
              </div>
            </div>
            <style>{`
              @keyframes glowSweep {
                0% { left: -30%; }
                100% { left: 100%; }
              }
            `}</style>
            <span className="text-xs text-gray-500">{uploadProgress?.percentage || 0}%</span>
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