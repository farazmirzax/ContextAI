import os
import uuid
import tempfile
from datetime import datetime
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse, Response
from pydantic import BaseModel
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from typing import List, AsyncGenerator
import json
import asyncio

# LangChain imports (modern 1.x style)
from langchain_huggingface import HuggingFaceEmbeddings, HuggingFacePipeline
from langchain_groq import ChatGroq
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, pipeline

# --- CONVERSATIONAL MEMORY IMPORTS ---
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.prompts import MessagesPlaceholder

# Utility to turn list[Document] into a string for the prompt
def _format_docs(docs):
    return "\n\n".join(d.page_content for d in docs)
# -----------------------------------------------

# --- Load Environment Variables ---
load_dotenv()
groq_api_key = os.getenv("GROQ_API_KEY")

# Determine which model to use based on environment
USE_GROQ = groq_api_key is not None
print(f"🔧 Environment: {'PRODUCTION (Groq)' if USE_GROQ else 'LOCAL (HuggingFace)'}")

# --- Global Variables & In-Memory Storage ---
embeddings_model = None
llm = None
vector_stores = {}  # Stores the FAISS "brains" { "doc_id": faiss_index }
documents_db = {}   # Stores the metadata { "doc_id": "filename.pdf" }
processing_status = {}  # Track processing status { "doc_id": {"status": "processing", "filename": "x.pdf"} }

# --- Pydantic Models (Defines API Request structure) ---
class HistoryMessage(BaseModel):
    sender: str  # 'user' or 'ai'
    text: str

class ChatRequest(BaseModel):
    question: str
    document_id: str
    chat_history: List[HistoryMessage] = [] # <-- UPDATED to accept history

# --- Server Startup Event ---
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # This code runs ONCE when the server starts
    global embeddings_model, llm
    print("--- Loading models at startup... ---")
    try:
        # Load embeddings model
        embeddings_model = HuggingFaceEmbeddings(
            model_name="all-MiniLM-L6-v2",
            model_kwargs={'device': 'cpu'}  # Force CPU for free tier
        )
        print(f"✅ Embeddings model loaded: all-MiniLM-L6-v2")
        
        # Smart model selection based on environment
        if USE_GROQ:
            # PRODUCTION: Use Groq API (fast, free tier, no local resources)
            print("🚀 Loading Groq LLM for production...")
            llm = ChatGroq(
                model="llama-3.1-8b-instant",
                temperature=0,
                max_retries=3,  # Auto-retry on rate limits
            )
            print(f"✅ LLM loaded: Groq (llama-3.1-8b-instant) - 14,400 requests/day FREE!")
        else:
            # LOCAL: Use HuggingFace model (no API, runs on your machine)
            print("🔄 Loading HuggingFace LLM for local development...")
            model_name = "google/flan-t5-small"  # Small, fast, FREE! (only ~300MB)
            tokenizer = AutoTokenizer.from_pretrained(model_name)
            model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
            
            pipe = pipeline(
                "text2text-generation",
                model=model,
                tokenizer=tokenizer,
                max_length=256,  # Reduced for faster inference
                do_sample=False,  # Greedy decoding = faster
            )
            
            llm = HuggingFacePipeline(pipeline=pipe)
            print(f"✅ LLM loaded: {model_name} (100% FREE, no rate limits!)")
        
        print("--- 🚀 Models loaded successfully. Server is ready! ---")
    except Exception as e:
        print(f"❌ Error loading models: {e}")
        raise
    yield
    # This code runs ONCE when the server shuts down (if needed)
    print("--- Server shutting down. ---")

# --- FastAPI App Setup ---
app = FastAPI(lifespan=lifespan)

# --- CORS Configuration (MUST be after FastAPI creation) ---
# Production-ready CORS - restrict in production
allowed_origins = [
    "http://localhost:3000",  # React dev server
    "http://localhost:5173",  # Vite dev server
    "http://localhost:5174",  # Vite dev server (alt port)
    "https://rag-chat-frontend-p5fx.onrender.com",  # Old Render frontend (backup)
    "https://context-ai-seven.vercel.app",  # Primary Vercel frontend
    "https://contextai-*.vercel.app",  # Vercel preview deployments
    "https://*.vercel.app",  # Allow any Vercel deployment for this project
    "https://farazmirzax.github.io",  # GitHub Pages deployment
]

# Force CORS to allow all origins - GitHub Pages deployment fix
cors_origins = ["*"]  # Allow all origins for GitHub Pages

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["*"],
)

# --- API Endpoints ---
@app.get("/")
def read_root():
    return {"message": "RAG API is running!", "status": "healthy", "timestamp": str(datetime.now())}

@app.get("/health")
def health_check():
    """Keep the service alive"""
    return {"status": "alive", "timestamp": str(datetime.now())}

@app.options("/{path:path}")
async def options_handler(path: str):
    """Handle preflight OPTIONS requests for CORS"""
    return Response(
        content="",
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, HEAD",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Max-Age": "3600",
        }
    )

@app.get("/debug/model")
async def debug_model():
    """Debug model status - shows which LLM is active"""
    try:
        # Test a simple model call
        test_response = llm.invoke("What is 2+2?")
        response_text = test_response.content if hasattr(test_response, 'content') else str(test_response)
        
        return {
            "status": "success",
            "environment": "PRODUCTION" if USE_GROQ else "LOCAL",
            "model_type": "Groq API (llama-3.1-8b-instant)" if USE_GROQ else "HuggingFace (google/flan-t5-small)",
            "test_response": response_text,
            "cost": "FREE" if USE_GROQ else "FREE - No API limits!",
            "rate_limit": "14,400/day" if USE_GROQ else "Unlimited",
            "timestamp": str(datetime.now())
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "error_type": type(e).__name__,
            "timestamp": str(datetime.now())
        }

@app.get("/debug/cors")
def debug_cors():
    return {"cors": "enabled", "origins": ["*"], "methods": ["*"], "headers": ["*"]}

# Manual OPTIONS handler for stubborn CORS issues
@app.options("/{full_path:path}")
async def options_handler(full_path: str):
    return {"message": "OK"}

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Handles PDF file uploads with INSTANT response.
    Processing happens in background - use /documents endpoint to check status.
    """
    if not file.filename:
        return {"error": "No file name provided."}

    print(f"--- Received upload: {file.filename} ---")
    
    try:
        # Generate ID immediately
        document_id = str(uuid.uuid4())
        
        # Read file content
        content = await file.read()
        print(f"📄 File size: {len(content)} bytes")
        
        # Save to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        # Mark as processing
        processing_status[document_id] = {
            "status": "processing",
            "filename": file.filename
        }
        documents_db[document_id] = file.filename
        
        # Start background processing
        asyncio.create_task(process_pdf_background(document_id, temp_file_path, file.filename))
        
        # Return IMMEDIATELY
        print(f"✅ Upload accepted. Processing in background: {document_id}")
        return {
            "success": True,
            "document_id": document_id,
            "filename": file.filename,
            "message": f"Upload successful! Processing {file.filename} in background...",
            "status": "processing"
        }
        
    except Exception as e:
        print(f"Error receiving file: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to receive file: {str(e)}")

# Background processing function
async def process_pdf_background(document_id: str, temp_file_path: str, filename: str):
    """
    Process PDF in background without blocking upload response.
    """
    try:
        print(f"🔄 Background processing started: {filename}")
        
        # Load PDF
        loader = PyPDFLoader(temp_file_path)
        docs = loader.load()
        print(f"✅ Loaded {len(docs)} pages")

        # Split into chunks
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        chunks = text_splitter.split_documents(docs)
        print(f"✅ Created {len(chunks)} chunks")
        
        # Limit chunks for speed
        if len(chunks) > 100:
            print(f"⚠️ Large document. Using first 100 chunks...")
            chunks = chunks[:100]

        # Create embeddings
        print(f"🧠 Creating embeddings...")
        vector_store = FAISS.from_documents(chunks, embedding=embeddings_model)
        
        # Store results
        vector_stores[document_id] = vector_store
        processing_status[document_id] = {
            "status": "ready",
            "filename": filename
        }
        
        print(f"✅ Processing complete: {filename} ({document_id})")
        
    except Exception as e:
        print(f"❌ Background processing error: {e}")
        processing_status[document_id] = {
            "status": "error",
            "filename": filename,
            "error": str(e)
        }
    finally:
        # Clean up temp file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@app.get("/documents")
async def get_documents():
    """
    Returns a list of all uploaded documents with their processing status.
    """
    doc_list = []
    for doc_id, filename in documents_db.items():
        status_info = processing_status.get(doc_id, {"status": "ready"})
        doc_list.append({
            "document_id": doc_id,
            "filename": filename,
            "status": status_info.get("status", "ready"),
            "error": status_info.get("error") if status_info.get("status") == "error" else None
        })
    return {"documents": doc_list}

@app.post("/chat")
async def chat_with_doc(request: ChatRequest):
    """
    UPDATED ENDPOINT: Now handles conversational history with manual history-aware retrieval.
    """
    print(f"Received question for doc {request.document_id}: {request.question}")
    print(f"Chat history length: {len(request.chat_history)}")
    
    # 1. Get the specific vector store
    vector_store = vector_stores.get(request.document_id)
    if not vector_store:
        return {"error": "Document not found. Please upload it first."}
    
    # Reduce retrieved docs from 6 to 3 for faster processing
    retriever = vector_store.as_retriever(search_kwargs={"k": 3})

    # 2. Convert simple history to LangChain messages
    chat_history = []
    for msg in request.chat_history:
        if msg.sender == 'user':
            chat_history.append(HumanMessage(content=msg.text))
        else:
            chat_history.append(AIMessage(content=msg.text))

    # 3. Manual History-Aware Question Reformulation
    reformulated_question = request.question
    
    # SKIP reformulation for speed - use question directly
    # This makes responses 2x faster with minimal accuracy loss
    if chat_history and len(chat_history) > 0:
        print("Chat history detected - using enhanced context in answer...")
    
    # 4. Retrieve documents using original question (faster!)
    docs = retriever.invoke(reformulated_question)
    context = _format_docs(docs)
    
    print(f"Retrieved {len(docs)} documents for context")

    # 5. Create the answer generation prompt with chat history
    if chat_history:
        system_prompt = (
            "You are an assistant for question-answering tasks. "
            "Use the following pieces of retrieved context to answer the question. "
            "Consider the chat history for context, but base your answer primarily on the retrieved documents. "
            "If you don't know the answer, say that you don't know. "
            "Use three sentences maximum and keep the answer concise.\n\n"
            "Context: {context}"
        )
        
        qa_prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
        ])
        
        # Generate answer with history context
        qa_chain = qa_prompt | llm | StrOutputParser()
        
        try:
            answer = await qa_chain.ainvoke({
                "input": request.question,
                "context": context,
                "chat_history": chat_history
            })
        except Exception as e:
            print(f"❌ Groq API Error in QA chain: {e}")
            if "500" in str(e) or "Internal server error" in str(e):
                raise HTTPException(status_code=503, detail="AI service temporarily unavailable. Groq API is experiencing issues. Please try again in a few minutes.")
            else:
                raise HTTPException(status_code=500, detail=f"Error processing question: {str(e)}")
    
    else:  # No chat history - simple RAG
        system_prompt = (
            "You are an assistant for question-answering tasks. "
            "Use the following pieces of retrieved context to answer the question. "
            "If you don't know the answer, say that you don't know. "
            "Use three sentences maximum and keep the answer concise.\n\n"
            "Context: {context}\n\n"
            "Question: {question}\n\n"
            "Answer:"
        )
        
        prompt = ChatPromptTemplate.from_template(system_prompt)
        qa_chain = prompt | llm | StrOutputParser()
        
        try:
            answer = await qa_chain.ainvoke({
                "context": context,
                "question": request.question
            })
        except Exception as e:
            print(f"Error in simple QA chain: {e}")
            raise HTTPException(status_code=500, detail=f"Error processing question: {str(e)}")
    
    # Log for debugging
    print(f"Generated answer: {answer[:100]}...")
    
    return {"answer": answer}

@app.post("/chat/stream")
async def chat_with_doc_stream(request: ChatRequest):
    """
    STREAMING ENDPOINT: Returns streaming responses with typewriter effect.
    """
    print(f"Received STREAMING question for doc {request.document_id}: {request.question}")
    print(f"Chat history length: {len(request.chat_history)}")
    
    async def generate_stream() -> AsyncGenerator[str, None]:
        try:
            # 1. Get the specific vector store
            vector_store = vector_stores.get(request.document_id)
            if not vector_store:
                yield f"data: {json.dumps({'error': 'Document not found. Please upload it first.'})}\n\n"
                return
            
            retriever = vector_store.as_retriever(search_kwargs={"k": 6})

            # 2. Convert simple history to LangChain messages
            chat_history = []
            for msg in request.chat_history:
                if msg.sender == 'user':
                    chat_history.append(HumanMessage(content=msg.text))
                else:
                    chat_history.append(AIMessage(content=msg.text))

            # 3. Manual History-Aware Question Reformulation
            reformulated_question = request.question
            
            if chat_history:
                print("Reformulating question based on chat history...")
                
                contextualize_prompt = ChatPromptTemplate.from_messages([
                    ("system", 
                     "You must reformulate the user's question to be standalone. Look at the chat history to understand context.\n\n"
                     "Rules:\n"
                     "1. If the question refers to 'the first one', 'it', 'that', etc., replace with the specific thing from history\n"
                     "2. If history mentions 'projects' and user asks 'what is the first one about?', change to 'what is the first project about?'\n"
                     "3. If no context is needed, return the question unchanged\n"
                     "4. Do NOT answer the question, only reformulate it\n\n"
                     "Return ONLY the reformulated question, nothing else."),
                    MessagesPlaceholder("chat_history"),
                    ("human", "{input}"),
                ])
                
                reformulate_chain = contextualize_prompt | llm | StrOutputParser()
                
                try:
                    reformulated_question = await reformulate_chain.ainvoke({
                        "input": request.question,
                        "chat_history": chat_history
                    })
                    print(f"Original question: {request.question}")
                    print(f"Reformulated question: {reformulated_question}")
                except Exception as e:
                    print(f"Error reformulating question, using original: {e}")
                    reformulated_question = request.question

            # 4. Retrieve documents using reformulated question
            docs = retriever.invoke(reformulated_question)
            context = _format_docs(docs)
            
            print(f"Retrieved {len(docs)} documents for context")

            # 5. Create the answer generation prompt with chat history
            if chat_history:
                system_prompt = (
                    "You are an assistant for question-answering tasks. "
                    "Use the following pieces of retrieved context to answer the question. "
                    "Consider the chat history for context, but base your answer primarily on the retrieved documents. "
                    "If you don't know the answer, say that you don't know. "
                    "Use three sentences maximum and keep the answer concise.\n\n"
                    "Context: {context}"
                )
                
                qa_prompt = ChatPromptTemplate.from_messages([
                    ("system", system_prompt),
                    MessagesPlaceholder("chat_history"),
                    ("human", "{input}"),
                ])
                
                # Generate streaming answer with history context
                qa_chain = qa_prompt | llm
                
                # Stream the response
                async for chunk in qa_chain.astream({
                    "input": request.question,
                    "context": context,
                    "chat_history": chat_history
                }):
                    if chunk.content:
                        # Send each chunk as Server-Sent Event
                        yield f"data: {json.dumps({'chunk': chunk.content})}\n\n"
                        await asyncio.sleep(0.01)  # Small delay for smoother streaming
            
            else:  # No chat history - simple RAG streaming
                system_prompt = (
                    "You are an assistant for question-answering tasks. "
                    "Use the following pieces of retrieved context to answer the question. "
                    "If you don't know the answer, say that you don't know. "
                    "Use three sentences maximum and keep the answer concise.\n\n"
                    "Context: {context}\n\n"
                    "Question: {question}\n\n"
                    "Answer:"
                )
                
                prompt = ChatPromptTemplate.from_template(system_prompt)
                qa_chain = prompt | llm
                
                # Stream the response
                async for chunk in qa_chain.astream({
                    "context": context,
                    "question": request.question
                }):
                    if chunk.content:
                        # Send each chunk as Server-Sent Event
                        yield f"data: {json.dumps({'chunk': chunk.content})}\n\n"
                        await asyncio.sleep(0.01)  # Small delay for smoother streaming
            
            # Send completion signal
            yield f"data: {json.dumps({'done': True})}\n\n"
            
        except Exception as e:
            print(f"Error in streaming chain: {e}")
            yield f"data: {json.dumps({'error': f'Error processing question: {str(e)}'})}\n\n"
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )

# --- Run the Server ---
if __name__ == "__main__":
    import os
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")  # Allow external connections in production
    print(f"Starting FastAPI server on {host}:{port}")
    uvicorn.run(app, host=host, port=port)