#!/usr/bin/env bash
# Build script for Render
set -o errexit

echo "🚀 Starting backend build..."

# Upgrade pip for better dependency resolution
pip install --upgrade pip

# Install dependencies with optimizations for Render
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt --no-cache-dir

# Verify critical imports work
echo "✅ Verifying installations..."
python -c "import fastapi; print('FastAPI OK')"
python -c "import langchain; print('LangChain OK')"
python -c "import sentence_transformers; print('SentenceTransformers OK')"
python -c "from langchain_groq import ChatGroq; print('Groq OK')"

echo "🎉 Backend build completed successfully!"