import axios from 'axios';
import type { Message } from '../types'; // <-- NEW: Import Message type
import { API_URL } from './config'; // Import from centralized config

// API configuration - using centralized config

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
  
  // Send chat message (non-streaming)
  sendMessage: (question: string, documentId: string, chatHistory: Message[]) => 
    apiClient.post('/chat', {
      question,
      document_id: documentId,
      chat_history: chatHistory,
    }),

  // Send streaming chat message
  sendStreamingMessage: async function* (question: string, documentId: string, chatHistory: Message[]) {
    const response = await fetch(`${API_URL}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        document_id: documentId,
        chat_history: chatHistory,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('ReadableStream not supported');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.chunk) {
                yield data.chunk;
              } else if (data.done) {
                return;
              } else if (data.error) {
                throw new Error(data.error);
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', line);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },
};

export default api;