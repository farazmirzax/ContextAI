// API configuration and utilities
// Force production URL when deployed on Vercel or any domain that's not localhost
const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const API_URL = isLocalhost 
  ? 'http://127.0.0.1:8000'  // Local development only
  : 'https://rag-chat-backend-730g.onrender.com';  // Production backend URL

console.log('🚀 API URL:', API_URL);
console.log('🌐 Hostname:', typeof window !== 'undefined' ? window.location.hostname : 'SSR');
console.log('🏠 Is Localhost:', isLocalhost);