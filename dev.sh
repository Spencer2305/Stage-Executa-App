#!/bin/bash

# Ensure we're using the correct Node.js version
if command -v nvm &> /dev/null; then
    # Load nvm if it exists
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    
    # Use Node.js 20
    nvm use 20
fi

# Run Next.js dev server
exec node node_modules/.bin/next dev --turbopack 