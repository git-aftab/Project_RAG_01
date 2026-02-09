import { OpenAI } from "openai";
import { pipeline } from "@xenova/transformers";
import "dotenv/config";

// Client for OpenRouter (chat completions - FREE)
const openrouterClient = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

class EmbeddingService {
  constructor() {
    this.embedder = null;
  }

  /**
   * Initialize the local embedding model (lazy loading)
   */
  async initEmbedder() {
    if (!this.embedder) {
      console.log("Loading local embedding model (first time only)...");
      this.embedder = await pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2",
      );
      console.log("✓ Embedding model loaded successfully!");
    }
    return this.embedder;
  }

  /**
   * Generate embedding for single text - FREE & LOCAL
   */
  async generateEmbedding(text) {
    try {
      const embedder = await this.initEmbedder();

      const output = await embedder(text, {
        pooling: "mean",
        normalize: true,
      });

      // Convert to array and return
      return Array.from(output.data);
    } catch (error) {
      console.error("Error generating embedding:", error);
      throw new Error("Failed to generate embedding");
    }
  }

  //Generate embeddings for multiple texts - FREE & LOCAL

  async generateEmbeddingsForMultiText(texts) {
    try {
      const embeddings = [];

      for (const text of texts) {
        const embedding = await this.generateEmbedding(text);
        embeddings.push(embedding);
      }

      return embeddings;
    } catch (error) {
      console.error("Error generating embeddings:", error);
      throw new Error("Failed to generate embeddings");
    }
  }

  /**
   * Generate chat completion - FREE via OpenRouter
   */
  async generateCompletion(messages) {
    try {
      const response = await openrouterClient.chat.completions.create({
        model: "openai/gpt-oss-120b:free",
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
      });

      console.log(response)
      return response.choices[0].message.content;
    } catch (error) {
      console.error("Error generating completion:", error);
      throw new Error("Failed to generate completion");
    }
  }
}

export default new EmbeddingService();
