import { Sidebar, ChatArea, ChatInput } from './components';
import { useChat } from './hooks/useChat';

function App() {
  const {
    messages,
    isLoading,
    documents,
    selectedDocument,
    handleFileUpload,
    handleDocumentSelect,
    handleSendMessage,
  } = useChat();

  return (
    <div className="flex h-screen w-full bg-gray-950 text-gray-100">
      {/* Sidebar */}
      <Sidebar
        documents={documents}
        selectedDocumentId={selectedDocument?.document_id || null}
        isLoading={isLoading}
        onDocumentSelect={handleDocumentSelect}
        onFileUpload={handleFileUpload}
      />

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1">
        {/* Header */}
        <header className="text-center p-6 border-b border-gray-700 bg-gray-900">
          <h1 className="text-2xl font-bold text-white">
            Chat With Your PDF
          </h1>
          {selectedDocument && (
            <p className="text-sm text-gray-400 mt-1">
              Currently chatting with: {selectedDocument.filename}
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
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
}

export default App;