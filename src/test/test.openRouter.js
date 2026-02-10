
import { OpenAI } from 'openai';
import "dotenv/config"


const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

async function test() {
  try {
    console.log('Testing OpenRouter connection...');
    console.log('API Key exists?', !!process.env.OPENROUTER_API_KEY);
    console.log('API Key prefix:', process.env.OPENROUTER_API_KEY?.substring(0, 15) + '...');

    const response = await client.chat.completions.create({
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      messages: [
        { role: 'user', content: 'Say hello in one word.' }
      ],
      max_tokens: 10,
    });

    console.log('✅ Success!');
    console.log('Response:', response.choices[0].message.content);
  } catch (error) {
    console.error('❌ Failed!');
    console.error('Status:', error?.status);
    console.error('Message:', error?.message);
    console.error('Error body:', JSON.stringify(error?.error, null, 2));
  }
}

test();