# KaladiMind AI - Enterprise RAG Architecture 🧠

An advanced, full-stack Retrieval-Augmented Generation (RAG) system designed to extract insights from complex documents securely and efficiently.

## 🚀 Architecture
* **Frontend:** Next.js 15, Tailwind CSS v4, Glassmorphism UI
* **Backend:** Python, FastAPI, LangChain
* **AI Engine:** Llama 3.1 (via Groq)
* **Vector Database:** ChromaDB with HuggingFace local embeddings (`all-MiniLM-L6-v2`)

## ✨ Key Features
* **Proactive Intelligence:** Automatically analyzes and summarizes documents upon upload.
* **Defensive Engineering:** Built-in guardrails to handle blank PDFs and enforce strict context-only answering to prevent AI hallucinations.
* **State Management:** Secure database initialization and memory-wiping capabilities.