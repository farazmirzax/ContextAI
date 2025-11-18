// API configuration and utilities
const isDevelopment = import.meta.env.DEV;

export const API_URL = isDevelopment 
  ? 'http://127.0.0.1:8000'  // Local development
  : import.meta.env.VITE_API_URL || 'https://rag-chat-backend.onrender.com';  // Production on Render

console.log('🚀 API URL:', API_URL);