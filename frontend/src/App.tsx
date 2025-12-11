import { useState } from 'react';
import { LandingPage, ChatInterface } from './components';
import { useChat } from './hooks/useChat';

function App() {
  const [showChat, setShowChat] = useState(false);
  
  const {
    messages,
    isLoading,
    isUploading,
    documents,
    selectedDocument,
    handleFileUpload,
    handleDocumentSelect,
    handleSendMessage,
    uploadProgress,
  } = useChat();

  const handleFileUploadWithTransition = async (file: File) => {
    await handleFileUpload(file);
    setShowChat(true);
  };

  const handleBackToHome = () => {
    setShowChat(false);
  };

  // Show landing page if no documents or user clicked back to home
  if (!showChat || documents.length === 0) {
    return (
      <LandingPage
        onFileUpload={handleFileUploadWithTransition}
        isLoading={isUploading}
        uploadProgress={uploadProgress || undefined}
      />
    );
  }

  // Show chat interface when documents are uploaded
  return (
    <ChatInterface
      messages={messages}
      isLoading={isLoading}
      isUploading={isUploading}
      documents={documents}
      selectedDocument={selectedDocument}
      onDocumentSelect={handleDocumentSelect}
      onFileUpload={handleFileUpload}
      onSendMessage={handleSendMessage}
      onBackToHome={handleBackToHome}
      uploadProgress={uploadProgress || undefined}
    />
  );
}

export default App;