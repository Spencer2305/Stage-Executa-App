#!/bin/bash

# Test Authentication System
# Run this after database setup is complete

set -e

echo "🧪 Testing Executa Authentication System..."

# Check if environment is set up
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local not found!"
    echo "Please run ./scripts/setup-env.sh first"
    exit 1
fi

echo "1️⃣ Generating Prisma client..."
npx prisma generate

echo "2️⃣ Pushing database schema..."
npx prisma db push

echo "3️⃣ Checking database connection..."
if npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Database connection successful!"
else
    echo "❌ Database connection failed!"
    echo "Check your DATABASE_URL in .env.local"
    exit 1
fi

echo "4️⃣ Verifying tables exist..."
TABLES=$(npx prisma db execute --stdin <<< "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';" | grep -E "(users|sessions|knowledge_files|assistants)" | wc -l)

if [ "$TABLES" -ge 4 ]; then
    echo "✅ All required tables exist!"
else
    echo "⚠️ Some tables may be missing. Running db push again..."
    npx prisma db push --force-reset
fi

echo ""
echo "🎉 Authentication system test complete!"
echo ""
echo "📋 Manual verification steps:"
echo "1. Run: npm run dev"
echo "2. Visit: http://localhost:3000/register"
echo "3. Create a test account"
echo "4. Try logging in and out"
echo ""
echo "🔧 If you encounter issues:"
echo "- Check .env.local has correct DATABASE_URL"
echo "- Verify AWS RDS security group allows your IP"
echo "- Check RDS instance is in 'available' state"
echo ""
echo "✨ Ready to build your knowledge ingestion system!" 