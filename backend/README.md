# RAG API Backend

A FastAPI-based RAG (Retrieval Augmented Generation) system using LangChain 1.x, FAISS vector storage, and Groq LLM.

## Quick Start (Windows)

### 1. Environment Setup
```powershell
# Create and activate virtual environment
python -m venv venv
& venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment Variables
Create a `.env` file in this directory:
```env
GROQ_API_KEY=your_groq_api_key_here
```
Get your GROQ API key from: https://console.groq.com/

### 3. Prepare Data
- Place your FAISS index in the `faiss_index/` directory
- OR use the `/upload` endpoint to upload PDFs and build the index dynamically

### 4. Run the Server
```powershell
python main.py
```

The API will be available at: http://127.0.0.1:8000

## API Endpoints

### GET `/`
Health check endpoint
```json
{"message": "RAG API is running!"}
```

### POST `/upload`
Upload a PDF document to create/update the vector store
- **Content-Type**: `multipart/form-data`
- **Body**: PDF file as form data

### POST `/chat`
Ask questions about uploaded documents
```json
{
  "question": "What is this document about?"
}
```

**Response:**
```json
{
  "answer": "Based on the retrieved context..."
}
```

## Architecture

- **LangChain 1.x**: Modern LCEL (LangChain Expression Language) for chain composition
- **FAISS**: Local vector storage for document embeddings
- **HuggingFace Embeddings**: `all-MiniLM-L6-v2` model for text embedding
- **Groq**: `llama3-8b-8192` model for text generation
- **FastAPI**: Async web framework with automatic API docs

## Troubleshooting

### Import Errors
If you see `ModuleNotFoundError: No module named 'langchain.chains'`:
1. Ensure your virtual environment is activated
2. Reinstall with: `pip install -r requirements.txt`
3. The old `langchain.chains` module doesn't exist in LangChain 1.x

### Missing FAISS Index
If the server fails to load models:
1. Upload a PDF via `/upload` to create the index
2. OR copy an existing `faiss_index/` directory into the project

### GROQ API Issues
- Verify your `.env` file has the correct `GROQ_API_KEY`
- Check your API quota at https://console.groq.com/

## Development

### Project Structure
```
backend/
├── main.py              # FastAPI app with RAG endpoints
├── ingest.py            # Document processing utilities  
├── requirements.txt     # Python dependencies
├── .env                 # Environment variables (create this)
├── venv/                # Virtual environment
└── faiss_index/         # Vector store (created after upload)
```

### Key Dependencies
- `langchain==1.0.5` - Core LangChain framework
- `langchain-groq==1.0.0` - Groq LLM integration
- `langchain-huggingface==1.0.1` - HuggingFace embeddings
- `faiss-cpu==1.12.0` - Vector similarity search
- `fastapi==0.121.1` - Web framework

Built with LangChain 1.x and modern LCEL patterns. Compatible with Python 3.13+.