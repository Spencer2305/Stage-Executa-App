#!/bin/bash

echo "🔧 Testing production OAuth configuration..."

# Test production OAuth URLs
echo "📋 Production OAuth URLs that should be in Google Cloud Console:"
echo "  - https://app.executa.co.uk/api/auth/oauth/google/callback"
echo "  - https://app.executa.co.uk/api/integrations/gmail/callback"
echo "  - https://app.executa.co.uk/api/integrations/drive/callback"
echo ""

# Test localhost OAuth URLs
echo "📋 Localhost OAuth URLs that should be in Google Cloud Console:"
echo "  - http://localhost:3000/api/auth/oauth/google/callback"
echo "  - http://localhost:3000/api/integrations/gmail/callback"
echo "  - http://localhost:3000/api/integrations/drive/callback"
echo ""

echo "🔍 To test production OAuth:"
echo "1. Go to https://app.executa.co.uk"
echo "2. Try signing in with Google"
echo "3. If you get redirect_uri_mismatch, check that https://app.executa.co.uk/api/auth/oauth/google/callback is in Google Cloud Console"
echo ""

echo "🔍 To test localhost OAuth:"
echo "1. Go to http://localhost:3000"
echo "2. Try signing in with Google"
echo "3. If you get redirect_uri_mismatch, check that http://localhost:3000/api/auth/oauth/google/callback is in Google Cloud Console"
echo ""

echo "🔗 Google Cloud Console: https://console.cloud.google.com/apis/credentials" 