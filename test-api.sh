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
    "title": "AgriSahy",
    "content": "AgriSahay is a farmer centric smart advisory application designed for small and medium farmers in Tamil Nadu who grow crops like rice, sugarcane, groundnut and cotton. The application provides simple and actionable guidance to farmers with limited technical knowledge. It offers seasonal crop advisory, pest and disease identification support, fertilizer recommendations, information about government schemes, weather based alerts and local market price updates. For example, during the Kuruvai season from June to September in Tamil Nadu, recommended rice varieties include ADT-43 and CO-51. The suggested seed rate is 30 to 35 kilograms per acre. Fertilizer recommendation per acre includes 110 kilograms of urea, 50 kilograms of DAP and 18 kilograms of potash. One of the major pests affecting rice is stem borer and it can be controlled using Chlorantraniliprole 0.4G at 4 kilograms per acre. In groundnut crops, the seed rate is 50 to 60 kilograms per acre and leaf spot disease can be treated using Mancozeb at 2 grams per liter of water. For rice crops affected by brown plant hopper, symptoms include yellowing leaves and hopper burn patches and it can be treated by spraying Imidacloprid at 0.5 milliliters per liter while avoiding excessive nitrogen fertilizer. Under the Pradhan Mantri Fasal Bima Yojana crop insurance scheme, the premium is 2 percent for Kharif crops and 1.5 percent for Rabi crops. In Chennai market, the price of paddy is 2200 rupees per quintal and groundnut is 6000 rupees per quintal."
  }')

echo "$UPLOAD_RESPONSE" | jq '.'
DOC_ID=$(echo "$UPLOAD_RESPONSE" | jq -r '.documentId')
echo -e "\n"

# Test 3: List Documents
echo -e "${YELLOW}3. Listing All Documents...${NC}"
curl -s "${API_URL}/documents" | jq '.'
echo -e "\n"

# Test 4: Query Document
echo -e "${YELLOW}4. Querying: 'What is the seed rate for rice in Kuruvai season?'${NC}"
curl -s -X POST "${API_URL}/query" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is the seed rate for rice in Kuruvai season??"
  }' | jq '.'
echo -e "\n"

# Test 5: Query Document (another question)
echo -e "${YELLOW}5. Querying: 'Which pesticide is recommended for stem borer?'${NC}"
curl -s -X POST "${API_URL}/query" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Which pesticide is recommended for stem borer?"
  }' | jq '.'
echo -e "\n"

# Q3
echo -e "${YELLOW}5. Querying: 'What is the price of paddy in Chennai market?'${NC}"
curl -s -X POST "${API_URL}/query" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is the price of paddy in Chennai market?"
  }' | jq '.'
echo -e "\n"

# Q4
echo -e "${YELLOW}5. Querying: 'What is the seed rate for groundnut?'${NC}"
curl -s -X POST "${API_URL}/query" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is the seed rate for groundnut?"
  }' | jq '.'
echo -e "\n"

# Q5
echo -e "${YELLOW}5. Querying: 'What is the premium for Rabi crops under PMFBY?'${NC}"
curl -s -X POST "${API_URL}/query" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is the premium for Rabi crops under PMFBY?"
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
