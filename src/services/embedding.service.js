// const OpenAI = require('openai');
import { OpenAI } from "openai";
// const { pipeline } = require('@xenova/transformers');
import { pipeline } from "@xenova/transformers";
// require('dotenv').config();
import "dotenv/config";

// ✅ OpenAI SDK pointing to OpenRouter
const openrouterClient = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

class EmbeddingService {
  constructor() {
    this.embedder = null;
  }

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

  async generateEmbedding(text) {
    try {
      const embedder = await this.initEmbedder();

      const output = await embedder(text, {
        pooling: "mean",
        normalize: true,
      });

      const embedding = Array.from(output.data);

      if (embedding.length !== 384) {
        throw new Error(`Expected 384 dimensions, got ${embedding.length}`);
      }

      return embedding;
    } catch (error) {
      console.error("Error generating embedding:", error);
      throw new Error("Failed to generate embedding");
    }
  }

  async generateEmbeddingsForMultiText(texts) {
    try {
      const embeddings = [];

      for (let i = 0; i < texts.length; i++) {
        console.log(`Generating embedding ${i + 1}/${texts.length}...`);
        const embedding = await this.generateEmbedding(texts[i]);
        embeddings.push(embedding);
      }

      console.log(`✓ Generated ${embeddings.length} embeddings`);
      return embeddings;
    } catch (error) {
      console.error("Error generating embeddings:", error);
      throw new Error("Failed to generate embeddings");
    }
  }

  async generateCompletion(messages) {
    try {
      // ✅ OpenAI SDK syntax - works with OpenRouter
      const response = await openrouterClient.chat.completions.create({
        model: "meta-llama/llama-3.3-70b-instruct:free",
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error("Error generating completion:", error.message);
      throw new Error("Failed to generate completion");
    }
  }
}

export default new EmbeddingService();
