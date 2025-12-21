import axios from 'axios';
import { API_URL } from './config';
import type { Document } from '../types';

// API service functions
export const apiService = {
  // Fetch all documents
  async getDocuments(): Promise<Document[]> {
    try {
      const response = await axios.get(`${API_URL}/documents`);
      return response.data.documents || [];
    } catch (error) {
      console.error("Error fetching documents:", error);
      throw error;
    }
  },

  // Upload a new document
  async uploadDocument(file: File): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minutes timeout for large PDFs
      });
      return response.data;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  },

  // Send a chat message
  async sendMessage(question: string, documentId: string): Promise<string> {
    try {
      const response = await axios.post(`${API_URL}/chat`, {
        question,
        document_id: documentId
      }, {
        timeout: 60000, // 60 seconds timeout for chat responses
      });
      return response.data.answer || response.data.error;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }
};