// tests/test-rag.js
const ragService = require('../src/services/rag.service');

async function test() {
  console.log('Testing document upload...');
  
  const result = await ragService.uploadDocument(
    'JavaScript Basics',
    'JavaScript is a programming language. Variables can be declared with let, const, or var. Functions are first-class citizens.'
  );
  
  console.log('Document uploaded:', result);
  
  console.log('\nTesting query...');
  const answer = await ragService.query('How do you declare variables?');
  console.log('Answer:', answer.answer);
  console.log('Sources found:', answer.sources.length);
}

test();