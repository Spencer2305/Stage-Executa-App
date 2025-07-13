#!/bin/bash

echo "🔧 Testing OAuth URLs for app.executa.co.uk..."

# Test Google OAuth URLs
echo "📋 Google OAuth URLs:"
echo "  - http://localhost:3000/api/auth/oauth/google/callback"
echo "  - https://app.executa.co.uk/api/auth/oauth/google/callback"
echo ""

# Test Gmail Integration URLs
echo "📧 Gmail Integration URLs:"
echo "  - http://localhost:3000/api/integrations/gmail/callback"
echo "  - https://app.executa.co.uk/api/integrations/gmail/callback"
echo ""

# Test Google Drive Integration URLs
echo "📁 Google Drive Integration URLs:"
echo "  - http://localhost:3000/api/integrations/drive/callback"
echo "  - https://app.executa.co.uk/api/integrations/drive/callback"
echo ""

# Test Facebook OAuth URLs
echo "📘 Facebook OAuth URLs:"
echo "  - http://localhost:3000/api/auth/oauth/facebook/callback"
echo "  - https://app.executa.co.uk/api/auth/oauth/facebook/callback"
echo ""

echo "✅ Add these URLs to your respective OAuth providers:"
echo "  1. Google Cloud Console (for Google OAuth)"
echo "  2. Facebook Developers (for Facebook OAuth)"
echo "  3. Discord Developer Portal (for Discord integration)"
echo "  4. Dropbox App Console (for Dropbox integration)"
echo ""
echo "🔗 Google Cloud Console: https://console.cloud.google.com/apis/credentials"
echo "🔗 Facebook Developers: https://developers.facebook.com/"
echo "🔗 Discord Developer Portal: https://discord.com/developers/applications"
echo "🔗 Dropbox App Console: https://www.dropbox.com/developers/apps" 