import { useState, useEffect } from 'react';
import { api } from '../api/client';
import type { Message, Document } from '../types';

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);

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
    
    try {
      const response = await api.uploadDocument(file);
      const newDoc = response.data;
      
      // Add new doc to state and select it
      setDocuments(prev => [...prev, newDoc]);
      setSelectedDocumentId(newDoc.document_id);
      
      setMessages([{
        id: Date.now(),
        sender: 'ai',
        text: `Successfully uploaded and processed "${newDoc.filename}". You can now ask questions about it.`
      }]);

    } catch (error) {
      console.error("Error uploading file:", error);
      setMessages([{
        id: Date.now(),
        sender: 'ai',
        text: "Sorry, I ran into an error uploading that file. Please check the server."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentSelect = (docId: string) => {
    setSelectedDocumentId(docId);
    setMessages([]); // Clear messages when switching documents
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
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await api.sendMessage(messageText, selectedDocumentId);

      // Add AI response
      const aiMessage: Message = {
        id: Date.now() + 1,
        sender: 'ai',
        text: response.data.answer || response.data.error,
      };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error("Error fetching response:", error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        sender: 'ai',
        text: "Sorry, I ran into an error. Please check the server terminal."
      };
      setMessages(prev => [...prev, errorMessage]);
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
  };
};