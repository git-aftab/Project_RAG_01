# RAG Learning Guide - Project 1

## What You're Building

A complete RAG (Retrieval-Augmented Generation) system that:
1. Takes your documents
2. Breaks them into chunks
3. Converts chunks to embeddings (vectors)
4. Stores them in a vector database
5. Retrieves relevant chunks when you ask questions
6. Uses those chunks to generate accurate answers

## Core RAG Concepts Explained

### 1. Text Chunking
**Why?** LLMs have token limits, and documents are often too long. We split documents into smaller pieces.

**How it works in this project:**
- `chunking.service.js` splits text into 500-character chunks
- 50 characters overlap between chunks (to preserve context)
- Smart splitting at sentence/word boundaries (not mid-word)

**Example:**
```
Original: "JavaScript is great. Python is also great. Both are used for web development."

Chunks:
1. "JavaScript is great. Python is also great."
2. "Python is also great. Both are used for web development."
   (Notice "Python is also great" appears in both - that's overlap)
```

### 2. Embeddings (Vectors)
**Why?** Computers can't understand text semantically. Embeddings convert text to numbers (vectors) that capture meaning.

**How it works:**
- Each chunk → OpenAI API → 1536-dimensional vector
- Similar meanings = similar vectors
- Example: "car" and "automobile" would have vectors close to each other

**In code:**
```javascript
// embedding.service.js
const embedding = await openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: 'Your text here'
});
// Returns: [0.012, -0.43, 0.89, ... 1536 numbers]
```

### 3. Vector Database (pgvector in Supabase)
**Why?** We need to store embeddings and search them efficiently.

**What makes it special:**
- Stores vectors (arrays of numbers)
- Can find "similar" vectors super fast using math (cosine similarity)
- Traditional databases search exact matches; vector DBs search "meaning matches"

**The SQL setup:**
```sql
-- Vector column stores 1536-dimensional embeddings
CREATE TABLE document_chunks (
    id BIGSERIAL PRIMARY KEY,
    content TEXT,
    embedding vector(1536),  -- This is the magic!
    ...
);

-- Index for fast similarity search
CREATE INDEX ON document_chunks 
USING ivfflat (embedding vector_cosine_ops);
```

### 4. Similarity Search
**Why?** When you ask a question, we need to find the most relevant chunks.

**How it works:**
1. Your question → embedding (vector)
2. Compare question vector to all chunk vectors
3. Find chunks with highest similarity scores
4. Return top K chunks (default: 5)

**The math:** Cosine similarity
- Measures angle between two vectors
- Score: 0 (completely different) to 1 (identical)
- We set threshold (e.g., 0.5) to filter irrelevant results

**In code:**
```javascript
// rag.service.js
const { data: matches } = await supabase.rpc('match_chunks', {
  query_embedding: questionEmbedding,
  match_threshold: 0.5,  // Minimum similarity
  match_count: 5         // Top 5 results
});
```

### 5. Context Building & Prompting
**Why?** LLMs need context to answer questions accurately.

**How it works:**
1. Take retrieved chunks
2. Format them nicely
3. Add them to the prompt as "context"
4. Ask the LLM to answer based ONLY on that context

**Example prompt:**
```
Context from documents:
[1] JavaScript was created in 1995 by Brendan Eich.
[2] JavaScript runs in browsers and on servers with Node.js.

Question: Who created JavaScript?

Instructions: Answer based solely on the context above.
```

**Without RAG:** LLM uses training data (might be outdated/wrong)
**With RAG:** LLM uses YOUR documents (accurate, up-to-date)

## The Complete RAG Pipeline

```
User uploads document
        ↓
1. CHUNKING (chunking.service.js)
   "Long document" → ["chunk1", "chunk2", "chunk3"]
        ↓
2. EMBEDDING (embedding.service.js)
   ["chunk1", "chunk2"] → [[0.1, 0.5, ...], [0.3, 0.2, ...]]
        ↓
3. STORAGE (Supabase pgvector)
   Store chunks + embeddings in database
        ↓
User asks question
        ↓
4. QUERY EMBEDDING (embedding.service.js)
   "Who created JavaScript?" → [0.15, 0.48, ...]
        ↓
5. SIMILARITY SEARCH (Supabase)
   Find chunks with similar embeddings
   Returns top 5 most relevant chunks
        ↓
6. CONTEXT BUILDING (rag.service.js)
   Format chunks into prompt context
        ↓
7. LLM GENERATION (embedding.service.js)
   GPT-4 answers based on context
        ↓
Return answer + sources to user
```

## File Structure Explained

```
src/
├── config/
│   └── supabase.js           # Supabase client setup
│
├── services/
│   ├── chunking.service.js   # Text splitting logic
│   │   - chunkText()         # Main chunking function
│   │   - findSentenceBoundary()
│   │   - findWordBoundary()
│   │
│   ├── embedding.service.js  # OpenAI API calls
│   │   - generateEmbedding()      # Single text
│   │   - generateEmbeddings()     # Batch texts
│   │   - generateCompletion()     # LLM response
│   │
│   └── rag.service.js        # Orchestrates everything
│       - uploadDocument()    # Steps 1-3
│       - query()            # Steps 4-7
│       - getAllDocuments()
│       - deleteDocument()
│
├── routes/
│   └── api.routes.js         # HTTP endpoints
│
└── server.js                 # Express app
```

## Key Parameters to Understand

### Chunk Size (default: 500 chars)
- **Too small:** Loses context, too many chunks
- **Too large:** Exceeds token limits, less precise retrieval
- **Sweet spot:** 300-800 characters

### Chunk Overlap (default: 50 chars)
- **Why needed:** Prevents cutting off important context
- **Example:** If a concept spans chunk boundary, overlap ensures both chunks capture it
- **Typical range:** 10-20% of chunk size

### Top K (default: 5)
- **What:** Number of chunks to retrieve
- **Too low:** Might miss important info
- **Too high:** Adds noise, wastes tokens
- **Typical range:** 3-10

### Similarity Threshold (default: 0.5)
- **What:** Minimum similarity score to include a chunk
- **0.0:** Include everything (lots of noise)
- **1.0:** Only exact matches (too restrictive)
- **Typical range:** 0.4-0.7

## Common Issues & Solutions

### Issue 1: "No relevant information found"
**Cause:** Similarity threshold too high or chunks don't match question
**Solution:** 
- Lower threshold (0.5 → 0.3)
- Increase top K (5 → 10)
- Rephrase question

### Issue 2: Wrong answers
**Cause:** Retrieved chunks aren't actually relevant
**Solution:**
- Check similarity scores (are they too low?)
- Improve chunking strategy
- Add metadata filtering (Project 2!)

### Issue 3: Slow responses
**Cause:** Embedding generation takes time
**Solution:**
- Batch embeddings when possible
- Consider caching common queries
- Use faster embedding models

## Testing Your Understanding

Try these experiments:

1. **Change chunk size** to 200 and 1000. See how it affects retrieval quality.

2. **Adjust similarity threshold** from 0.3 to 0.8. Notice how many chunks are retrieved.

3. **Upload documents on different topics** and ask cross-topic questions. See what happens.

4. **Modify the prompt** in `buildPrompt()` to make answers more concise or detailed.

5. **Add logging** to see similarity scores for each retrieved chunk.

## What's Next?

After mastering this project, you understand:
- ✅ Text chunking strategies
- ✅ Embeddings and vector similarity
- ✅ Vector database operations
- ✅ Basic RAG pipeline

**Project 2** will teach you:
- Hybrid search (semantic + keyword)
- Metadata filtering
- Code-specific RAG
- Better retrieval strategies

## Resources

- **OpenAI Embeddings:** https://platform.openai.com/docs/guides/embeddings
- **Supabase pgvector:** https://supabase.com/docs/guides/ai/vector-columns
- **Cosine Similarity:** https://en.wikipedia.org/wiki/Cosine_similarity
- **Chunking Strategies:** https://www.pinecone.io/learn/chunking-strategies/

## Quick Commands

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your keys

# Run server
npm start

# Run tests (requires jq installed)
chmod +x test-api.sh
./test-api.sh
```

Good luck! 🚀
