#!/bin/bash

# Test script for the Gnosis Chain wxHOPR Airdrop Service
# Make sure the service is running on localhost:3000

BASE_URL="http://localhost:3000/api/airdrop"

echo "🧪 Testing Gnosis Chain wxHOPR Airdrop Service"
echo "======================================"

# Test 1: Health check
echo "1. Testing health endpoint..."
curl -s "$BASE_URL/health" | jq .
echo ""

# Test 2: Service status
echo "2. Getting service status..."
curl -s "$BASE_URL/status" | jq .
echo ""

# Test 3: Generate test hash
echo "3. Generating test hash..."
TEST_PREIMAGE="test_secret_123"
HASH_RESPONSE=$(curl -s -X POST "$BASE_URL/generate-test-hash" \
  -H "Content-Type: application/json" \
  -d "{\"preimage\": \"$TEST_PREIMAGE\"}")

echo $HASH_RESPONSE | jq .
TEST_HASH=$(echo $HASH_RESPONSE | jq -r '.data.hash')
echo ""

# Test 4: Attempt airdrop claim (will fail if preimage doesn't match configured one)
echo "4. Testing airdrop claim..."
RECIPIENT_ADDRESS="0x742d35Cc6634C0532925a3b8D8B9B3a8d8b8B3a8"

curl -s -X POST "$BASE_URL/claim" \
  -H "Content-Type: application/json" \
  -d "{
    \"hash\": \"$TEST_HASH\",
    \"recipientAddress\": \"$RECIPIENT_ADDRESS\"
  }" | jq .
echo ""

echo "✅ Test completed!"
echo ""
echo "Note: The airdrop claim will only succeed if:"
echo "- The generated hash matches your configured SECRET_PREIMAGE"
echo "- You have sufficient wxHOPR token balance and xDai for gas fees in your wallet"
echo "- The recipient address is valid"
