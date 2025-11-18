import os
import uuid
import tempfile
from datetime import datetime
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from typing import List, AsyncGenerator
import json
import asyncio

# LangChain imports (modern 1.x style)
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

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
if not groq_api_key:
    raise ValueError("GROQ_API_KEY not found in .env file.")

# --- Global Variables & In-Memory Storage ---
embeddings_model = None
llm = None
vector_stores = {}  # Stores the FAISS "brains" { "doc_id": faiss_index }
documents_db = {}   # Stores the metadata { "doc_id": "filename.pdf" }

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
    embeddings_model = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    # Using a capable model that's currently supported
    llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0)
    print(f"✅ Using model: llama-3.1-8b-instant")
    print(f"✅ Embeddings model: all-MiniLM-L6-v2")
    print("--- Models loaded successfully. Server is ready. ---")
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
    "https://rag-chat-frontend.onrender.com",  # Replace with your actual Render URL
    "https://your-custom-domain.com",  # If you add a custom domain later
]

# Allow all origins for development, restrict for production
cors_origins = ["*"] if os.getenv("ENVIRONMENT") == "development" else allowed_origins

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
    Handles PDF file uploads.
    Ingests the PDF and stores its vector store in memory.
    """
    if not file.filename:
        return {"error": "No file name provided."}

    print(f"--- Processing new file: {file.filename} ---")
    
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            temp_file.write(await file.read())
            temp_file_path = temp_file.name

        loader = PyPDFLoader(temp_file_path)
        docs = loader.load()

        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        chunks = text_splitter.split_documents(docs)

        print(f"Creating vector store for {file.filename}...")
        vector_store = FAISS.from_documents(chunks, embedding=embeddings_model)
        
        document_id = str(uuid.uuid4())
        vector_stores[document_id] = vector_store
        documents_db[document_id] = file.filename
        
        print(f"--- Successfully processed and stored: {file.filename} (ID: {document_id}) ---")

        return {
            "success": True,
            "document_id": document_id, 
            "filename": file.filename,
            "message": f"Successfully uploaded and processed {file.filename}"
        }

    except Exception as e:
        print(f"Error processing file: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to process file: {str(e)}")
    finally:
        if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@app.get("/documents")
async def get_documents():
    """
    Returns a list of all uploaded documents.
    """
    doc_list = [{"document_id": doc_id, "filename": filename} for doc_id, filename in documents_db.items()]
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
    
    if chat_history:  # Only reformulate if there's chat history
        print("Reformulating question based on chat history...")
        
        # Create contextualize question prompt with more explicit instructions
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
        
        # Get reformulated question
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
        
        # Generate answer with history context
        qa_chain = qa_prompt | llm | StrOutputParser()
        
        try:
            answer = await qa_chain.ainvoke({
                "input": request.question,
                "context": context,
                "chat_history": chat_history
            })
        except Exception as e:
            print(f"Error in QA chain with history: {e}")
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