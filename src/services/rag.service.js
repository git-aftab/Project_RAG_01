import { supabase } from "../config/supabase.js";
import chunkingService from "./chunking.service.js";
import embeddingService from "./embedding.service.js";

class RAGServices {
  async uploadDocument(title, content) {
    try {
      const { data: document, error: docError } = await supabase
        .from("documents")
        .insert({ title, content })
        .select()
        .single();

      if (docError) throw docError;

      // chunk the doucment
      const chunks = chunkingService.chunkText(content);
      console.log(`created ${chunks.length} chunks for doucment: ${title}`);

      // Generate embeddings for all chunks
      const embeddings =
        await embeddingService.generateEmbeddingsForMultiText(chunks);

      // console.log("Number of embeddings:", embeddings.length);
      // console.log("First embedding type:", typeof embeddings[0]);
      // console.log("First embedding is array?", Array.isArray(embeddings[0]));
      // console.log("First embedding length:", embeddings[0]?.length);
      // console.log("First 5 values:", embeddings[0]?.slice(0, 5));

      // const prepare chunk records for alll chunks
      const chunkRecords = chunks.map((chunk, index) => ({
        document_id: document.id,
        content: chunk,
        embedding: embeddings[index],
        chunk_index: index,
      }));

      // console.log("\n=== DEBUG CHUNK RECORDS ===");
      // console.log("Number of chunk records:", chunkRecords.length);
      // chunkRecords.forEach((record, i) => {
      //   console.log(`\nChunk ${i}:`);
      //   console.log("  document_id:", record.document_id);
      //   console.log("  content length:", record.content.length);
      //   console.log("  embedding is array?", Array.isArray(record.embedding));
      //   console.log("  embedding length:", record.embedding?.length);
      //   console.log("  embedding sample:", record.embedding?.slice(0, 3));
      // });
      // console.log("===========================\n");

      const { error: chunksError } = await supabase
        .from("document_chunks")
        .insert(chunkRecords);

      if (chunksError) throw chunksError;

      return {
        documentId: document.id,
        chunksCreated: chunks.length,
      };
    } catch (error) {
      console.error("Error uploading document:", error);
      throw new Error("Failed to upload document");
    }
  }

  async query(question, topK = 5, similarityThreshold = 0.3) {
    try {
      // generate embedding for the question
      const questionEmbedding =
        await embeddingService.generateEmbedding(question);

      console.log("Question embedding length:", questionEmbedding.length);
      console.log(
        "Question embedding is array?",
        Array.isArray(questionEmbedding),
      );

      // Check whats in database
      const { data: allChunks } = await supabase
        .from("document_chunks")
        .select("id,content")
        .limit(5);

      console.log("\nChunks in dB:", allChunks?.length);
      console.log("Sample Chunk:", allChunks?.[0]?.content?.substring(0, 50));

      // search for similar chunks chunks using the db func()
      const { data: matches, error: searchError } = await supabase.rpc(
        "match_chunks",
        {
          query_embedding: questionEmbedding,
          match_threshold: similarityThreshold,
          match_count: topK,
        },
      );

      console.log("\nSearch error:", searchError);
      console.log("Matches found:", matches?.length);
      console.log("Raw matches:", JSON.stringify(matches, null, 2));

      if (searchError) throw searchError;

      if (!matches || matches.length === 0) {
        return {
          answer:
            "I couldn't find any relevent information in your doucments to answer that question.",
          sources: [],
        };
      }

      // build context form retrieved chunks
      const context = matches
        .map((match, idx) => `[${idx + 1}] ${match.content}`)
        .join("\n\n");

      // create prompt
      const prompt = this.buildPrompt(context, question);

      const messages = [
        {
          role: "system",
          content:
            "You are a helpful assistant that answers questions based on the provided context.",
        },
        { role: "user", content: prompt },
      ];

      console.log("\n=== Messages Being Sent ===");
      console.log(JSON.stringify(messages, null, 2));
      console.log("===========================\n");


      const answer = await embeddingService.generateCompletion([
        {
          role: "user",
          content: `You are a helpful assistant. Answer based ONLY on this context:

${context}

Question: ${question}

Answer concisely:`,
        },
      ]);

      return {
        answer,
        sources: matches.map((match) => ({
          documentId: match.document_id,
          content: match.content,
          similarity: match.similarity,
        })),
      };
    } catch (error) {
      console.error("Error querying documents:", error);
      throw new Error("Failed to query documents");
    }
  }

  async buildPrompt(context, question) {
    return `context from documents: ${context} 
    Question: ${question}
    
    Instruction: Answer the question based solely on the context provide above. If the Context doesn't contain enough information to answer the question, say so. Be Concise and accurate.`;
  }

  async getAllDocs() {
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("id, title, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error("Error fetching documents:", error);
      throw new Error("Failed to fetch documents");
    }
  }
  async deleteDocument(documentId) {
    try {
      // chunk will be automatically deleted due to cascade
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentId);

      if (error) throw error;

      console.log("Deleted docs");

      return true;
    } catch (error) {
      console.error("Error deleting document:", error);
      throw new Error("Failed to delete document");
    }
  }
  async getDocs(documentId) {
    try {
      const {
        data: doucment,
        error,
        docError,
      } = await supabase
        .from("documents")
        .select("*")
        .eq("id", documentId)
        .single();

      if (docError) throw docError;

      const { data: chunks, error: chunksError } = await supabase
        .from("document_chunks")
        .select("id,content, chunk_index")
        .eq("document_id", documentId)
        .order("chunk_index", { ascending: true });

      if (chunksError) throw chunksError;

      return {
        ...document,
        chunks,
      };
    } catch (error) {
      console.error("Error fetching document:", error);
      throw new Error("Failed to fetch document");
    }
  }
}

export default new RAGServices();
