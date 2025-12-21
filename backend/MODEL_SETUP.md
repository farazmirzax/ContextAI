# Smart Model Setup - Local vs Production

## 🎯 How It Works

Your backend now **automatically detects** which environment to use:

### 🏠 **LOCAL Development** (No GROQ_API_KEY)
- Uses HuggingFace `flan-t5-small` model
- Runs on your machine (CPU)
- **FREE** - No API, no rate limits
- Great for development/testing

### 🚀 **PRODUCTION** (With GROQ_API_KEY)
- Uses Groq `llama-3.1-8b-instant` API
- Fast inference, no local resources
- **FREE** - 14,400 requests/day
- Perfect for Render deployment

---

## 🔧 Setup Instructions

### For Local Development:
```bash
# DON'T set GROQ_API_KEY in .env (or comment it out)
# GROQ_API_KEY=your_key_here  # <- Commented out = LOCAL mode

python main.py
# ✅ Will use HuggingFace model locally
```

### For Production (Render):
```bash
# Set GROQ_API_KEY in Render environment variables
GROQ_API_KEY=gsk_your_actual_key_here

# Deploy to Render
# ✅ Will use Groq API (no torch/transformers needed)
```

---

## 📊 Check Active Model

Visit: `http://localhost:8000/debug/model`

Response shows:
- Which environment (LOCAL/PRODUCTION)
- Which model is active
- Rate limits
- Test inference

---

## 🎉 Benefits

✅ **No code changes** - auto-detects environment  
✅ **Fast local dev** - HuggingFace model  
✅ **Fast production** - Groq API  
✅ **All optimizations kept** - faster PDF processing  
✅ **No rate limit issues** - 14,400/day on Groq  

---

## 🚨 Important for Render

On Render, you DON'T need to install torch/transformers (saves build time):
- Set `GROQ_API_KEY` in environment variables
- Backend will use Groq API automatically
- Faster builds, less memory usage!
