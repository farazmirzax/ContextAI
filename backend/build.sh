#!/usr/bin/env bash
# Build script for Render
set -o errexit

echo "🚀 Starting backend build..."

# Set environment variables to avoid CUDA installations
export TORCH_INSTALL_SKIP_CUDA=1
export FORCE_CPU_ONLY=1

# Upgrade pip for better dependency resolution
pip install --upgrade pip

# Install torch CPU-only first to avoid CUDA dependencies
echo "📦 Installing PyTorch CPU-only..."
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu --no-cache-dir

# Install remaining dependencies
echo "📦 Installing remaining dependencies..."
pip install -r requirements.txt --no-cache-dir

# Explicitly install python-multipart (sometimes gets missed)
echo "📦 Ensuring python-multipart is installed..."
pip install python-multipart==0.0.9 --no-cache-dir

# Verify critical imports work
echo "✅ Verifying installations..."
python -c "import fastapi; print('FastAPI OK')"
python -c "from langchain_groq import ChatGroq; print('Groq OK')"
python -c "import sentence_transformers; print('SentenceTransformers OK')"
python -c "import faiss; print('FAISS OK')"

# Explicitly check for python-multipart
echo "🔍 Checking python-multipart..."
python -c "import multipart; print('python-multipart OK')" || (echo "❌ python-multipart missing, installing..." && pip install python-multipart==0.0.9)

echo "🎉 Backend build completed successfully!"