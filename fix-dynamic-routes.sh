#!/bin/bash

# List of API routes that need dynamic configuration
routes=(
  "src/app/api/analytics/route.ts"
  "src/app/api/assistants/route.ts"
  "src/app/api/auth/oauth/facebook/route.ts"
  "src/app/api/auth/oauth/google/route.ts"
  "src/app/api/debug/oauth-test/route.ts"
  "src/app/api/integrations/discord/auth/route.ts"
  "src/app/api/integrations/discord/callback/route.ts"
  "src/app/api/integrations/dropbox/auth/route.ts"
  "src/app/api/integrations/dropbox/status/route.ts"
  "src/app/api/integrations/gmail/callback/route.ts"
  "src/app/api/integrations/slack/auth/route.ts"
  "src/app/api/integrations/slack/callback/route.ts"
  "src/app/api/integrations/slack/status/route.ts"
  "src/app/api/integrations/status/route.ts"
  "src/app/api/models/route.ts"
  "src/app/api/test-db/route.ts"
  "src/app/api/test-sync/route.ts"
  "src/app/api/user/notifications/route.ts"
  "src/app/api/user/test-avatar/route.ts"
)

for route in "${routes[@]}"; do
  if [[ -f "$route" ]]; then
    # Check if the file already has dynamic export
    if ! grep -q "export const dynamic" "$route"; then
      echo "Adding dynamic export to $route"
      # Add dynamic export after imports
      sed -i '' '1i\
export const dynamic = '\''force-dynamic'\'';
' "$route"
    fi
  fi
done

echo "Dynamic route configuration added to all API routes" 