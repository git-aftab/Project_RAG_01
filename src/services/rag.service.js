import { supabase } from "../config/supabase";
import chunkingService from "./chunking.service";

class RAGServices {
  async uploadDocument(title, content) {}
  async query(question, topK = 5, similarityThreshold = 0.5) {}

  async buildPrompt(context, question) {
    return `context from documents: ${context} 
    Question: ${question}
    
    Instruction: Answer the question based solely on the context provide above. If the Context doesn't contain enough information to answer the question, say so. Be Concise and accurate.`;
  }

  async getAllDocs(){}
  async deleteDocument(documentId){}
  async getDocs(documentId){}
  
}
