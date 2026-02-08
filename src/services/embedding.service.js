import openai, { OpenAI } from "openai";
import { Pipeline } from "@xenova/transformers";
import "dotevn/config";

const openrouterClient = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

class EmbeddingService {
  constructor() {
    this.embedder = null;
  }
  async generateEmbeddingForSingleText(text) {
    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
      });

      console.log(response);

      return response.data[0].embedding;
    } catch (error) {
      console.error("Error generating embedding", error);
      throw new Error("Failed To Generate Embedding");
    }
  }

  async generateEmbeddingsForMultiText(texts) {
    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: texts,
      });

      console.log(response);

      return response.data.map((item) => item.embedding);
    } catch (error) {
      console.error("Error generating embeddings:", error);
      throw new Error("Failed to generate embeddings");
    }
  }
  async generateCompletion(messages) {
    try {
      const response = await openai.chat.completions.create({
        model: "openai/gpt-oss-120b:free",
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
      });

      console.log(response);
      return response.choices[0].message.content;
    } catch (error) {
      console.error("Error generating completion:", error);
      throw new Error("Failed to generate completion");
    }
  }
}

export default EmbeddingService;
