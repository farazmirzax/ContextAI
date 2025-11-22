// API configuration and utilities
const isDevelopment = import.meta.env.DEV;

export const API_URL = isDevelopment 
  ? 'http://127.0.0.1:8000'  // Local development  
  : 'https://rag-chat-backend-730g.onrender.com';  // Render backend URL

console.log('🚀 API URL:', API_URL);
console.log('🌍 Environment:', isDevelopment ? 'Development' : 'Production');