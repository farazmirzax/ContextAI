#!/usr/bin/env bash
# Build script for Render
set -o errexit

# Install dependencies
pip install -r requirements.txt

# Download NLTK data (if needed for sentence transformers)
python -c "import nltk; nltk.download('punkt', quiet=True)"

echo "Backend build completed successfully!"