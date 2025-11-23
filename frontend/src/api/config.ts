// API configuration and utilities
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// Force production URL for Vercel deployment
export const API_URL = (isDevelopment && !window.location.hostname.includes('vercel.app')) 
  ? 'http://127.0.0.1:8000'  // Local development only
  : 'https://rag-chat-backend-730g.onrender.com';  // Production backend URL

console.log('🚀 API URL:', API_URL);
console.log('🌍 Environment:', isDevelopment ? 'Development' : 'Production');
console.log('🌐 Hostname:', window.location.hostname);
console.log('🔧 Force Production:', window.location.hostname.includes('vercel.app'));