import { useState, useEffect } from 'react';
import { api } from '../api/client';
import type { Message, Document } from '../types';

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ step: string; percentage: number } | null>(null);

  // Fetch documents on mount
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const response = await api.getDocuments();
        setDocuments(response.data.documents || []);
      } catch (error) {
        console.error('Failed to load documents:', error);
      }
    };
    loadDocuments();
  }, []);

  const selectedDocument = documents.find(doc => doc.document_id === selectedDocumentId) || null;

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setMessages([]); // Clear chat for new upload
    setUploadProgress(null);

    try {
      setUploadProgress({ step: '📄 Reading PDF file...', percentage: 10 });
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setUploadProgress({ step: '☁️ Uploading to server...', percentage: 30 });
      const response = await api.uploadDocument(file);
      const newDoc = response.data;
      
      setUploadProgress({ step: '📊 Analyzing document structure...', percentage: 60 });
      await new Promise(resolve => setTimeout(resolve, 400));
      
      setUploadProgress({ step: '🧠 Creating vector embeddings...', percentage: 85 });
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUploadProgress({ step: '✨ Finalizing...', percentage: 95 });
      await new Promise(resolve => setTimeout(resolve, 200));
      
      setUploadProgress({ step: '✅ Complete!', percentage: 100 });
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Add new doc to state and select it
      setDocuments(prev => [...prev, newDoc]);
      setSelectedDocumentId(newDoc.document_id);
      
      setMessages([{
        id: Date.now(),
        sender: 'ai',
        text: `✅ Successfully uploaded and processed "${newDoc.filename}". You can now ask questions about it.`
      }]);

    } catch (error) {
      console.error("Error uploading file:", error);
      setMessages([{
        id: Date.now(),
        sender: 'ai',
        text: "❌ Sorry, I ran into an error uploading that file. Please check the server."
      }]);
    } finally {
      setIsLoading(false);
      setUploadProgress(null);
    }
  };

  const handleDocumentSelect = (docId: string) => {
    // Only clear messages if switching to a different document
    if (docId !== selectedDocumentId) {
      setMessages([]); // Clear messages only when switching to different document
    }
    setSelectedDocumentId(docId);
  };

  const handleSendMessage = async (messageText: string) => {
    if (!selectedDocumentId) return;

    setIsLoading(true);

    // Add user message
    const userMessage: Message = {
      id: Date.now(),
      sender: 'user',
      text: messageText,
    };
    
    // Create the new message list *before* setting state
    const newMessages = [...messages, userMessage];
    setMessages(newMessages); // Update UI immediately

    // Add empty AI message for streaming
    const aiMessageId = Date.now() + 1;
    const aiMessage: Message = {
      id: aiMessageId,
      sender: 'ai',
      text: '',
    };
    setMessages(prev => [...prev, aiMessage]);

    try {
      // Use streaming API
      const streamGenerator = api.sendStreamingMessage(messageText, selectedDocumentId, newMessages);
      let fullResponse = '';

      for await (const chunk of streamGenerator) {
        fullResponse += chunk;
        
        // Update the AI message with accumulated text
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, text: fullResponse }
            : msg
        ));
      }

    } catch (error) {
      console.error("Error fetching response:", error);
      
      // Update the AI message with error
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { ...msg, text: "Sorry, I ran into an error. Please check the server terminal." }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    isLoading,
    documents,
    selectedDocument,
    handleFileUpload,
    handleDocumentSelect,
    handleSendMessage,
    uploadProgress,
  };
};