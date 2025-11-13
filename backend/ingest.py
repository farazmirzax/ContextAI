import os
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings  # <-- NEW IMPORT
from langchain_community.vectorstores import FAISS

DB_FAISS_PATH = 'faiss_index' # Folder to save the vector store

def main():
    # Load .env file (for the GROQ key later, not needed now)
    load_dotenv()
    
    # 1. Load the PDF
    print("Loading PDF...")
    loader = PyPDFLoader("test.pdf")
    docs = loader.load()

    # 2. Chunk the PDF
    print("Splitting document into chunks...")
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = text_splitter.split_documents(docs)

    print(f"\nSuccessfully loaded 'test.pdf' and split it into {len(chunks)} chunks.")

    # 3. Create Embeddings (Locally!)
    print("Loading local embedding model (this may take a moment the first time)...")
    # We use a popular, fast, and small model
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    
    # 4. Create Vector Store and save it
    print("Creating FAISS vector store...")
    vectorstore = FAISS.from_documents(chunks, embedding=embeddings)
    
    # Save the vector store locally
    vectorstore.save_local(DB_FAISS_PATH)
    
    print(f"\n--- SUCCESS! ---")
    print(f"Vector store created from {len(chunks)} chunks and saved locally in '{DB_FAISS_PATH}' folder.")
    print("------------------")

if __name__ == "__main__":
    main()