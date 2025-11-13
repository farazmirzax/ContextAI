// Type definitions for the application
export interface Message {
  id: number;
  sender: 'user' | 'ai';
  text: string;
}

export interface Document {
  document_id: string;
  filename: string;
}