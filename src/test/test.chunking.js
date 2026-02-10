// Create a test file: tests/test-chunking.js
import chunkingService from "../services/chunking.service.js";

const sampleText = `JavaScript is a versatile programming language. It was created in 1995 by Brendan Eich. JavaScript runs in web browsers and on servers using Node.js. Variables can be declared using let, const, or var keywords.`;

console.log('Input text length:', sampleText.length);
console.log('Input text:', sampleText);
console.log('\n--- Starting chunking ---\n');

const chunks = chunkingService.chunkText(sampleText, 100, 20);

console.log("Number of chunks:", chunks.length);
console.log("\nChunks:");
chunks.forEach((chunk, i) => {
  console.log(`\n[${i}] ${chunk}`);
});
