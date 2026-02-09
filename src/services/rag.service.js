import { supabase } from "../config/supabase";
import chunkingService from "./chunking.service";
import embeddingService from "./embedding.service";

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
      const embeddings = await embeddingService.generateEmbedding(chunks);

      // const prepare chunk records for alll chunks
      const chunkRecords = chunks.map((chunk, index) => ({
        document_id: document.id,
        content: chunk,
        embedding: embeddings[index],
        chunk_index: index,
      }));

      const { error: chunksError } = await supabase
        .from("doucument_chunks")
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

  async query(question, topK = 5, similarityThreshold = 0.5) {
    try {
      // generate embedding for the question
      const questionEmbedding =
        await embeddingService.generateEmbedding(question);

      // search for similar chunks chunks using the db func()
      const { data: matches, error: searchError } = await supabase.rpc(
        "match_chunks",
        {
          query_embedding: questionEmbedding,
          match_threshold: similarityThreshold,
          match_count: topK,
        },
      );

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

      // generate answer using llm
      const answer = await embeddingService.generateCompletion([
        {
          role: "system",
          content:
            "You are a helpful assistant that answers questions based on the provided context from the user's personal documents.",
        },
        { role: "user", content: prompt },
      ]);

      const sources = matches.map((match) => ({
        documentId: match.document_id,
        content: match.content,
        similarity: match.similarity,
      }));

      return {
        answer,
        sources,
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
