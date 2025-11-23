// API configuration - Uses environment variables properly
const isLocalDev = typeof window !== 'undefined' && 
  window.location.hostname === 'localhost';

export const API_URL = isLocalDev
  ? 'http://127.0.0.1:8000'  // Local development
  : import.meta.env.VITE_API_URL || 'https://rag-chat-backend-730g.onrender.com';

console.log('🚀 ContextAI API URL:', API_URL);
console.log('🌐 Environment:', isLocalDev ? 'Local Dev' : 'Production (Netlify)');
console.log('🔧 VITE_API_URL:', import.meta.env.VITE_API_URL);