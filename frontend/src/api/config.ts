// API configuration - Clean and simple for Netlify
const isLocalDev = typeof window !== 'undefined' && 
  window.location.hostname === 'localhost';

export const API_URL = isLocalDev
  ? 'http://127.0.0.1:8000'  // Local development
  : 'https://rag-chat-backend-730g.onrender.com';  // Production (Render backend)

console.log('🚀 ContextAI API URL:', API_URL);
console.log('🌐 Environment:', isLocalDev ? 'Local Dev' : 'Production (Netlify)');