import { pipeline } from "@xenova/transformers";


async function test() {
  console.log('Loading model...');
  const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  
  console.log('\n--- Testing single text ---');
  const output1 = await embedder('Hello world', {
    pooling: 'mean',
    normalize: true,
  });
  
  console.log('output1 type:', typeof output1);
  console.log('output1.data type:', typeof output1.data);
  console.log('output1.data is array?', Array.isArray(output1.data));
  console.log('output1.data length:', output1.data.length);
  console.log('First 5 values:', Array.from(output1.data).slice(0, 5));
  
  console.log('\n--- Testing batch (2 texts) ---');
  const output2 = await embedder(['Hello', 'World'], {
    pooling: 'mean',
    normalize: true,
  });
  
  console.log('output2.data shape:', output2.data.length);
  console.log('output2 structure:', typeof output2);
}

test();