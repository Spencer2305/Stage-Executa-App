#!/bin/bash

# Environment Setup Script for Executa
# Run this after AWS RDS setup completes

set -e

echo "🔧 Setting up environment variables for Executa..."

# Check if RDS setup completed
if [ ! -f .env.aws-rds ]; then
    echo "❌ Error: .env.aws-rds file not found!"
    echo "Please run ./scripts/setup-aws-database.sh first"
    exit 1
fi

# Create .env.local from template
echo "📝 Creating .env.local file..."
cp env.template .env.local

# Read the DATABASE_URL from .env.aws-rds
DATABASE_URL=$(grep "DATABASE_URL=" .env.aws-rds | cut -d'"' -f2)

# Generate a secure JWT secret

# Generate NextAuth secret

echo "🔑 Updating .env.local with real values..."

# Update .env.local with actual values
sed -i '' "s|DATABASE_URL=\".*\"|DATABASE_URL=\"$DATABASE_URL\"|" .env.local

echo ""
echo "✅ Environment setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Add your OpenAI API key to .env.local"
echo "2. Run: npx prisma generate"
echo "3. Run: npx prisma db push"
echo "4. Run: npm run dev"
echo ""
echo "🔒 Security reminders:"
echo "- Never commit .env.local to git"
echo "- Keep your JWT secrets secure"
echo "- Restrict RDS security group to your IP only"
echo ""

# Check if .env.local is in .gitignore
if ! grep -q "\.env\.local" .gitignore 2>/dev/null; then
    echo ".env.local" >> .gitignore
    echo "🛡️ Added .env.local to .gitignore"
fi

echo "🎉 Ready to test your authentication system!" 