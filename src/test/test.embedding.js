// tests/test-embedding.js
const embeddingService = require('../src/services/embedding.service');

async function test() {
  console.log('Testing single embedding...');
  const embedding = await embeddingService.generateEmbedding('Hello world');
  console.log('Embedding dimension:', embedding.length);
  console.log('First 5 values:', embedding.slice(0, 5));
  
  console.log('\nTesting batch embeddings...');
  const embeddings = await embeddingService.generateEmbeddingsForMultiText([
    'JavaScript is great',
    'Python is awesome'
  ]);
  console.log('Number of embeddings:', embeddings.length);
  console.log('Each embedding dimension:', embeddings[0].length);
}

test();