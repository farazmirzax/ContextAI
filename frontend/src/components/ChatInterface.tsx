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
}: ChatInterfaceProps) {
  return (
    <div className="flex h-screen w-full bg-gray-950 text-gray-100">
      {/* Sidebar */}
      <Sidebar
        documents={documents}
        selectedDocumentId={selectedDocument?.document_id || null}
        isLoading={isLoading}
        onDocumentSelect={onDocumentSelect}
        onFileUpload={onFileUpload}
        onBackToHome={onBackToHome}
      />

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1">
        {/* Header */}
        <header className="text-center p-6 border-b border-gray-700 bg-gray-900">
          <h1 className="text-2xl font-bold bg-linear-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            ContextAI
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Intelligent Document Assistant
          </p>
          {selectedDocument && (
            <p className="text-sm text-gray-400 mt-1">
              📄 Currently chatting with: {selectedDocument.filename}
            </p>
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