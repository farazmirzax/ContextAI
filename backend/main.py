import os
import uuid
import tempfile
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
import uvicorn
from fastapi.middleware.cors import CORSMiddleware

# LangChain imports (modern 1.x style)
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Utility to turn list[Document] into a string for the prompt
def _format_docs(docs):
    return "\n\n".join(d.page_content for d in docs)

# --- Load Environment Variables ---
load_dotenv()
groq_api_key = os.getenv("GROQ_API_KEY")
if not groq_api_key:
    raise ValueError("GROQ_API_KEY not found in .env file.")

# --- Global Variables & In-Memory Storage ---
# We will load the models once at startup
embeddings_model = None
llm = None

# These dictionaries will hold our data in memory
# This is simple for a demo. A real app would use a persistent database.
vector_stores = {}  # Stores the FAISS "brains" { "doc_id": faiss_index }
documents_db = {}   # Stores the metadata { "doc_id": "filename.pdf" }

# --- Pydantic Models (Defines API Request structure) ---
class ChatRequest(BaseModel):
    question: str
    document_id: str  # <-- NEW: We now need to know WHICH document to chat with

# --- FastAPI App Setup ---
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (for development)
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# --- Server Startup Event (Lifespan) ---
@app.on_event("startup")
async def startup_event():
    """Load models when the server starts."""
    global embeddings_model, llm
    
    print("--- Loading models at startup... ---")
    
    # Load Embedding Model (Local)
    embeddings_model = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    
    # Load Chat Model (Groq)
    llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0)
    
    print("--- Models loaded successfully. Server is ready. ---")

# --- API Endpoints ---
@app.get("/")
def read_root():
    return {"message": "RAG API is running!"}

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    NEW ENDPOINT: Handles PDF file uploads.
    Ingests the PDF and stores its vector store in memory.
    """
    if not file.filename:
        return {"error": "No file name provided."}

    print(f"--- Processing new file: {file.filename} ---")
    
    try:
        # Save the uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            temp_file.write(await file.read())
            temp_file_path = temp_file.name

        # 1. Load the PDF
        loader = PyPDFLoader(temp_file_path)
        docs = loader.load()

        # 2. Chunk the PDF
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        chunks = text_splitter.split_documents(docs)

        # 3. Create Vector Store (using the global embeddings model)
        print(f"Creating vector store for {file.filename}...")
        vector_store = FAISS.from_documents(chunks, embedding=embeddings_model)
        
        # 4. Save to our in-memory "databases"
        document_id = str(uuid.uuid4()) # Create a unique ID
        vector_stores[document_id] = vector_store
        documents_db[document_id] = file.filename
        
        print(f"--- Successfully processed and stored: {file.filename} (ID: {document_id}) ---")

        return {"document_id": document_id, "filename": file.filename}

    except Exception as e:
        print(f"Error processing file: {e}")
        return {"error": f"Failed to process file: {str(e)}"}
    finally:
        # Clean up the temporary file
        if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@app.get("/documents")
async def get_documents():
    """
    NEW ENDPOINT: Returns a list of all uploaded documents.
    """
    # Convert our DB into a list of objects
    doc_list = [{"document_id": doc_id, "filename": filename} for doc_id, filename in documents_db.items()]
    return {"documents": doc_list}

@app.post("/chat")
async def chat_with_doc(request: ChatRequest):
    """
    UPDATED ENDPOINT: Now chats with a *specific* document.
    """
    print(f"Received question for doc {request.document_id}: {request.question}")
    
    # 1. Get the specific vector store for this document
    vector_store = vector_stores.get(request.document_id)
    
    if not vector_store:
        return {"error": "Document not found. Please upload it first."}
    
    # 2. Create a retriever from that specific store
    retriever = vector_store.as_retriever()
    
    # 3. Create the RAG chain using modern LCEL style
    prompt_template = (
        "You are an assistant for question-answering tasks.\n"
        "Use the following pieces of retrieved context to answer the question.\n"
        "If you don't know the answer, just say that you don't know.\n"
        "Use three sentences maximum and keep the answer concise.\n\n"
        "Context: {context}\n\n"
        "Question: {question}\n\n"
        "Answer:"
    )
    
    prompt = ChatPromptTemplate.from_template(prompt_template)
    
    # Build runnable RAG chain
    rag_chain = (
        {"context": retriever | RunnableLambda(_format_docs), "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )
    
    # 4. Get the answer
    answer = await rag_chain.ainvoke(request.question)
    
    return {"answer": answer}

# --- Run the Server ---
if __name__ == "__main__":
    print("Starting FastAPI server on http://127.0.0.1:8000")
    uvicorn.run(app, host="127.0.0.1", port=8000)