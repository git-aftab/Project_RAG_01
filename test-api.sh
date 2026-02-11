#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="http://localhost:3000/api"

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Testing RAG API${NC}"
echo -e "${BLUE}================================${NC}\n"

# Test 1: Health Check
echo -e "${YELLOW}1. Testing Health Check...${NC}"
curl -s "${API_URL}/health" | jq '.'
echo -e "\n"

# Test 2: Upload Document
echo -e "${YELLOW}2. Uploading Sample Document...${NC}"
UPLOAD_RESPONSE=$(curl -s -X POST "${API_URL}/documents/upload" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "JavaScript Guide",
    "content": "JavaScript is a versatile programming language. It was created in 1995 by Brendan Eich. JavaScript runs in web browsers and on servers using Node.js. Variables can be declared using let, const, or var keywords. The let keyword creates block-scoped variables. The const keyword creates constants that cannot be reassigned. Functions in JavaScript are first-class citizens, meaning they can be assigned to variables, passed as arguments, and returned from other functions. Arrow functions provide a concise syntax for writing function expressions. Promises are used for asynchronous programming in JavaScript. The async and await keywords make it easier to work with promises."
  }')

echo "$UPLOAD_RESPONSE" | jq '.'
DOC_ID=$(echo "$UPLOAD_RESPONSE" | jq -r '.documentId')
echo -e "\n"

# Test 3: List Documents
echo -e "${YELLOW}3. Listing All Documents...${NC}"
curl -s "${API_URL}/documents" | jq '.'
echo -e "\n"

# Test 4: Query Document
echo -e "${YELLOW}4. Querying: 'How do you declare variables in JavaScript?'${NC}"
curl -s -X POST "${API_URL}/query" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "How do you declare variables in JavaScript?"
  }' | jq '.'
echo -e "\n"

# Test 5: Query Document (another question)
echo -e "${YELLOW}5. Querying: 'What are arrow functions?'${NC}"
curl -s -X POST "${API_URL}/query" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What are arrow functions in JavaScript?"
  }' | jq '.'
echo -e "\n"

# Test 6: Get specific document
if [ ! -z "$DOC_ID" ] && [ "$DOC_ID" != "null" ]; then
  echo -e "${YELLOW}6. Getting Document Details (ID: $DOC_ID)...${NC}"
  curl -s "${API_URL}/documents/${DOC_ID}" | jq '.'
  echo -e "\n"
fi

# Test 7: Delete Document
if [ ! -z "$DOC_ID" ] && [ "$DOC_ID" != "null" ]; then
  echo -e "${YELLOW}7. Deleting Document (ID: $DOC_ID)...${NC}"
  curl -s -X DELETE "${API_URL}/documents/${DOC_ID}" | jq '.'
  echo -e "\n"
fi

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Testing Complete!${NC}"
echo -e "${GREEN}================================${NC}"
