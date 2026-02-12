# 🤖 Personal Documentation Assistant — RAG System

> A production-ready **Retrieval-Augmented Generation (RAG)** backend built with Node.js, Supabase pgvector, local embeddings (Xenova), and LLaMA 3.3 via OpenRouter. Query your personal documents using natural language — completely free to run.

![Node.js](https://img.shields.io/badge/Node.js-v18+-green)
![Supabase](https://img.shields.io/badge/Supabase-pgvector-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)
![Cost](https://img.shields.io/badge/Cost-Free-brightgreen)

---

## 📌 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [How RAG Works](#how-rag-works)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Environment Variables](#environment-variables)
- [What I Learned](#what-i-learned)

---

## Overview

This project is **Project 1 of a 5-part RAG learning series**. It demonstrates how to build a RAG pipeline from scratch — without relying on LangChain or any high-level AI framework.

Upload your notes, articles, or any text documents. Then ask natural language questions and get accurate, context-grounded answers.

**Zero AI API costs** — uses local embeddings (Xenova Transformers) and a free LLM (LLaMA 3.3 via OpenRouter).

---

## Features

- 📄 **Document Upload** — Upload any text document via REST API
- ✂️ **Smart Chunking** — Splits documents with sentence-aware overlap
- 🧠 **Local Embeddings** — Generates 384-dim vectors locally using `all-MiniLM-L6-v2`
- 🔍 **Vector Similarity Search** — Finds relevant chunks using cosine similarity via Supabase pgvector
- 💬 **LLM Answer Generation** — Generates grounded answers using LLaMA 3.3 70B (free)
- 🗂️ **Document Management** — List and delete documents via API
- 🔒 **No Data Leaves Your Machine** — Embeddings generated locally, fully private

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js + Express |
| Vector Database | Supabase (PostgreSQL + pgvector) |
| Embeddings | Xenova Transformers (`all-MiniLM-L6-v2`) — local, free |
| LLM | LLaMA 3.3 70B Instruct via OpenRouter — free tier |
| Text Chunking | Custom implementation (no LangChain) |

---

## How RAG Works

```
┌─────────────────────────────────────────────────────────┐
│                    INDEXING PIPELINE                    │
│                                                         │
│  Document → Chunking → Embeddings → Supabase pgvector   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    QUERY PIPELINE                       │
│                                                         │
│  Question → Embed → Vector Search → Top K Chunks        │
│                                  → Build Prompt         │
│                                  → LLM → Answer         │
└─────────────────────────────────────────────────────────┘
```

**Step by step:**

1. **Chunking** — Document split into 500-char chunks with 50-char overlap
2. **Embedding** — Each chunk converted to a 384-dimensional vector locally
3. **Storage** — Chunks + embeddings stored in Supabase pgvector
4. **Query** — User question embedded using the same model
5. **Retrieval** — Cosine similarity search finds top-K relevant chunks
6. **Generation** — LLM generates answer using retrieved context only

---

## Project Structure

```
src/
├── config/
│   └── supabase.js               # Supabase client
├── services/
│   ├── chunking.service.js       # Text splitting with overlap
│   ├── embedding.service.js      # Local embeddings + LLM via OpenRouter
│   └── rag.service.js            # RAG pipeline orchestration
├── routes/
│   └── api.routes.js             # Express REST endpoints
└── index.js                      # Server entry point
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- Supabase account (free tier)
- OpenRouter account (free tier)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/rag-project01.git
cd rag-project01
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

Go to your Supabase project → SQL Editor and run:

```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents table
CREATE TABLE documents (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chunks table with 384-dimensional vectors
CREATE TABLE document_chunks (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT REFERENCES documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(384),
    chunk_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- IVFFlat index for fast similarity search
CREATE INDEX ON document_chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Similarity search function
CREATE OR REPLACE FUNCTION match_chunks(
    query_embedding vector(384),
    match_threshold float,
    match_count int
)
RETURNS TABLE (
    id BIGINT,
    document_id BIGINT,
    content TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        document_chunks.id,
        document_chunks.document_id,
        document_chunks.content,
        1 - (document_chunks.embedding <=> query_embedding) AS similarity
    FROM document_chunks
    WHERE 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
    ORDER BY document_chunks.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
```

### 4. Configure Environment Variables

```bash
cp .env.example .env
```

Fill in your credentials:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key
OPENROUTER_API_KEY=sk-or-v1-your-key
PORT=3000
```

### 5. Start the Server

```bash
npm run dev
```

The server starts at `http://localhost:3000`. On first run, Xenova will download the embedding model (~25MB). This happens once and is cached locally.

---

## API Reference

### Health Check
```http
GET /api/health
```

### Upload Document
```http
POST /api/documents/upload
Content-Type: application/json

{
  "title": "JavaScript Guide",
  "content": "Your document content here..."
}
```

**Response:**
```json
{
  "success": true,
  "documentId": 1,
  "chunksCreated": 4
}
```

### Query Documents
```http
POST /api/query
Content-Type: application/json

{
  "question": "Who created JavaScript?",
  "topK": 5,
  "similarityThreshold": 0.3
}
```

**Response:**
```json
{
  "success": true,
  "answer": "JavaScript was created by Brendan Eich in 1995.",
  "sources": [
    {
      "documentId": 1,
      "content": "JavaScript was created by Brendan Eich...",
      "similarity": 0.747
    }
  ]
}
```

### List Documents
```http
GET /api/documents
```

### Get Document by ID
```http
GET /api/documents/:id
```

### Delete Document
```http
DELETE /api/documents/:id
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_KEY` | Supabase anonymous/public key |
| `OPENROUTER_API_KEY` | OpenRouter API key (free tier) |
| `PORT` | Server port (default: 3000) |

---

## What I Learned

Building this project from scratch (no LangChain) gave me a deep understanding of:

- **Chunking strategies** — Why overlap matters and how chunk size affects retrieval quality
- **Vector embeddings** — How text is converted to numbers that capture semantic meaning
- **pgvector and IVFFlat indexing** — Why vector databases exist and how similarity search works under the hood
- **RAG pipeline design** — How to connect chunking → embedding → retrieval → generation
- **Prompt engineering** — How context is injected into prompts to ground LLM responses
- **Free AI stack** — How to build a fully functional AI app with zero ongoing API costs

---

## Coming Next

This is Part 1 of a 5-part series:

- ✅ **Project 1** — Personal Documentation Assistant (Supabase)
- 🔜 **Project 2** — Code Snippet Search with Hybrid Search (Supabase)
- 🔜 **Project 3** — PDF Q&A Bot (MongoDB Atlas)
- 🔜 **Project 4** — Chat History RAG (MongoDB)
- 🔜 **Project 5** — Multi-Document Comparison Tool (MongoDB)

---

## License

MIT — free to use, modify, and distribute.
