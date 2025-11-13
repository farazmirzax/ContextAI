import axios from 'axios';

// API configuration
const API_URL = 'http://127.0.0.1:8000';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API endpoints
export const api = {
  // Get all documents
  getDocuments: () => apiClient.get('/documents'),
  
  // Upload a document
  uploadDocument: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return apiClient.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Send chat message
  sendMessage: (question: string, documentId: string) => 
    apiClient.post('/chat', {
      question,
      document_id: documentId,
    }),
};

export default api;