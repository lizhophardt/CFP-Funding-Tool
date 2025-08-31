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

# Test 3: Generate test secret code
echo "3. Generating test secret code..."
CODE_RESPONSE=$(curl -s -X POST "$BASE_URL/generate-test-code" \
  -H "Content-Type: application/json" \
  -d "{\"prefix\": \"TestCode\"}")

echo $CODE_RESPONSE | jq .
echo ""

# Test 4: Attempt airdrop claim with a configured secret code
echo "4. Testing airdrop claim with configured secret code..."
RECIPIENT_ADDRESS="0x742d35Cc6634C0532925a3b8D8B9B3a8d8b8B3a8"
SECRET_CODE="DontTellUncleSam"  # Use one of the default configured codes

curl -s -X POST "$BASE_URL/claim" \
  -H "Content-Type: application/json" \
  -d "{
    \"secretCode\": \"$SECRET_CODE\",
    \"recipientAddress\": \"$RECIPIENT_ADDRESS\"
  }" | jq .
echo ""

# Test 5: Attempt duplicate claim (should fail)
echo "5. Testing duplicate claim (should fail)..."
curl -s -X POST "$BASE_URL/claim" \
  -H "Content-Type: application/json" \
  -d "{
    \"secretCode\": \"$SECRET_CODE\",
    \"recipientAddress\": \"$RECIPIENT_ADDRESS\"
  }" | jq .
echo ""

echo "✅ Test completed!"
echo ""
echo "Note: The airdrop claim will only succeed if:"
echo "- The secret code matches one of your configured SECRET_CODES"
echo "- The secret code hasn't been used before"
echo "- You have sufficient wxHOPR token balance and xDai for gas fees in your wallet"
echo "- The recipient address is valid"
