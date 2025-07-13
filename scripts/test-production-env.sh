#!/bin/bash

echo "🔧 Testing production environment variables..."

# Test production environment
echo "📋 Testing https://app.executa.co.uk environment..."

# Test if the site is accessible
echo "✅ Testing site accessibility..."
curl -s -o /dev/null -w "%{http_code}" "https://app.executa.co.uk" | grep -q "200" && echo "✅ Site is accessible" || echo "❌ Site is not accessible"

# Test environment variables endpoint
echo "🔧 Testing environment variables..."
curl -s "https://app.executa.co.uk/api/debug/netlify-env" | jq . 2>/dev/null || echo "❌ Environment endpoint failed or not accessible"

echo ""
echo "🔍 Expected NEXTAUTH_URL: https://app.executa.co.uk"
echo "🔍 If it shows localhost, you need to update Netlify environment variables"
echo ""
echo "📋 To fix this:"
echo "1. Go to Netlify Dashboard → Site Settings → Environment Variables"
echo "2. Set NEXTAUTH_URL = https://app.executa.co.uk"
echo "3. Redeploy your site"
echo ""
echo "🔗 Netlify Dashboard: https://app.netlify.com/" 