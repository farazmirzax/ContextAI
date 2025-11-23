// API configuration - Force production URL for Netlify deployment
export const API_URL = 'https://rag-chat-backend-730g.onrender.com';

console.log('🚀 ContextAI API URL (PRODUCTION):', API_URL);
console.log('🌐 Hostname:', typeof window !== 'undefined' ? window.location.hostname : 'SSR');
console.log('🔧 Environment check - VITE_API_URL:', import.meta.env.VITE_API_URL);