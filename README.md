# 🤖 RAG Chat Application

A production-ready Retrieval-Augmented Generation (RAG) application built with FastAPI, React, and LangChain. Features conversational memory and streaming responses for an enhanced chat experience.

## 🚀 Features

- **📄 PDF Document Upload & Processing**: Upload and process PDF documents for Q&A
- **🧠 Conversational Memory**: Maintains context across conversations using history-aware retrieval
- **⚡ Streaming Responses**: Real-time typewriter effect like ChatGPT
- **🎯 Intelligent Question Reformulation**: Automatically reformulates follow-up questions based on chat history
- **🔍 Vector Search**: Uses FAISS for efficient semantic search
- **🌐 Modern Tech Stack**: FastAPI backend, React frontend with TypeScript

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **LangChain** - LLM orchestration and RAG implementation
- **Groq** - Fast LLM inference
- **FAISS** - Vector database for document search
- **HuggingFace** - Embeddings model

### Frontend
- **React 19** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast development and build tool
- **Tailwind CSS** - Utility-first CSS framework

## 🏃‍♂️ Quick Start

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Add your GROQ_API_KEY
python main.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🔧 Key Implementation Highlights

### Conversational Memory
- Implements history-aware retrieval for context preservation
- Automatically reformulates vague questions ("what's the first one about?")
- Maintains conversation flow across multiple exchanges

### Streaming Architecture
- Server-Sent Events (SSE) for real-time response streaming
- Dual endpoints: `/chat` (instant) and `/chat/stream` (typewriter effect)
- Smooth user experience with progressive content loading

### Production Features
- Environment-based configuration
- CORS security settings
- Error handling and logging
- Scalable deployment setup

## 🌟 Demo

[🚀 Live Demo](https://rag-chat-frontend-p5fx.onrender.com) | [📚 API Docs](https://rag-chat-backend-730g.onrender.com/docs)

> **Note**: Free tier services may take 30 seconds to wake up from sleep. This is normal for portfolio projects.

## 📁 Project Structure
```
├── backend/
│   ├── main.py              # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   └── .env.example        # Environment template
└── frontend/
    ├── src/
    │   ├── components/     # React components
    │   ├── hooks/         # Custom hooks
    │   └── api/          # API client
    └── package.json      # Node dependencies
```

## 🚀 Deployment

Deployed on **Render** (Free Tier):
- **Backend**: Web Service with Python runtime
- **Frontend**: Static Site with automatic builds
- **Features**: Auto-deployments from GitHub, built-in SSL, environment variables

### Quick Deploy to Render:
1. Fork this repository
2. Connect to Render.com
3. Deploy backend as Web Service (`backend` directory)
4. Deploy frontend as Static Site (`frontend` directory)
5. Add environment variables (GROQ_API_KEY)

## 📝 License

MIT License - feel free to use for your projects!

---
*Built by [Your Name] - Showcasing modern RAG implementation with conversational AI*