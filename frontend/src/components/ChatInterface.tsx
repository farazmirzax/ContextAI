import { Sidebar, ChatArea, ChatInput } from './';
import type { Message, Document } from '../types';

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  documents: Document[];
  selectedDocument: Document | null;
  onDocumentSelect: (docId: string) => void;
  onFileUpload: (file: File) => void;
  onSendMessage: (message: string) => void;
  onBackToHome: () => void;
  uploadProgress?: { step: string; percentage: number };
}

export function ChatInterface({
  messages,
  isLoading,
  documents,
  selectedDocument,
  onDocumentSelect,
  onFileUpload,
  onSendMessage,
  onBackToHome,
  uploadProgress,
}: ChatInterfaceProps) {
  return (
    <div className="flex flex-col sm:flex-row h-screen w-full bg-black text-gray-100 relative overflow-hidden">
      {/* Codex-style Background for Chat */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Subtle Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-3"
          style={{
            backgroundImage: `
              linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px),
              linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px'
          }}
        ></div>
        
        {/* Floating Neural Network Indicators */}
        <div className="chat-neural-layer">
          <div className="neural-node neural-node-1">◉</div>
          <div className="neural-node neural-node-2">◎</div>
          <div className="neural-node neural-node-3">○</div>
          <div className="neural-node neural-node-4">●</div>
        </div>
      </div>

      {/* Sidebar */}
      <Sidebar
        documents={documents}
        selectedDocumentId={selectedDocument?.document_id || null}
        isLoading={isLoading}
        onDocumentSelect={onDocumentSelect}
        onFileUpload={onFileUpload}
        onBackToHome={onBackToHome}
        uploadProgress={uploadProgress}
      />

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 relative z-10">
        {/* Header - Codex Style */}
        <header className="text-center p-3 sm:p-4 md:p-6 border-b border-gray-800/50 bg-black/80 backdrop-blur-sm">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-light text-white mb-1 sm:mb-2 tracking-wider">
            ContextAI
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 font-light">
            Intelligent Document Assistant
          </p>
          {selectedDocument && (
            <div className="mt-3 flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <p className="text-xs text-gray-500 font-light">
                Active: {selectedDocument.filename}
              </p>
            </div>
          )}
        </header>
        
        {/* Chat Messages Area */}
        <ChatArea
          messages={messages}
          isLoading={isLoading}
          selectedDocument={selectedDocument}
        />

        {/* Input Form */}
        <ChatInput
          isLoading={isLoading}
          hasSelectedDocument={!!selectedDocument}
          onSendMessage={onSendMessage}
        />
      </div>
    </div>
  );
}