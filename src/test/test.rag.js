// tests/test-rag.js
import ragService from "../services/rag.service.js"

// test.rag.js
async function test() {
  console.log('Testing document upload...');
  
  const result = await ragService.uploadDocument(
    'JavaScript Basics',
    'JavaScript is a programming language. It was created by Brendan Eich. Variables can be declared using let, const, or var.'
  );
  
  console.log('Document uploaded:', result);
  
  console.log('\nTesting query with direct match...');
  const answer1 = await ragService.query('What is JavaScript?', 5, 0.3);
  console.log('Answer:', answer1.answer);
  console.log('Sources:', answer1.sources.length);
  
  console.log('\nTesting query with semantic match...');
  const answer2 = await ragService.query('How do you make variables?', 5, 0.3);
  console.log('Answer:', answer2.answer);
  console.log('Sources:', answer2.sources.length);
}

test()