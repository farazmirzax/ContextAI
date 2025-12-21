// API configuration - Smart environment detection
const isProduction = import.meta.env.PROD;
const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// Use localhost when running locally, production URL when deployed
export const API_URL = isLocalhost 
  ? 'http://localhost:8000' 
  : 'https://rag-chat-backend-730g.onrender.com';

console.log('🚀 ContextAI API URL:', API_URL);
console.log('🌐 Environment:', isLocalhost ? 'LOCAL' : 'PRODUCTION');
console.log('🔧 Hostname:', typeof window !== 'undefined' ? window.location.hostname : 'SSR');