#!/bin/bash

echo "🚀 Running Complete Executa Test Suite"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to run a test and check result
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "${BLUE}🧪 Running $test_name...${NC}"
    echo "----------------------------------------"
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ $test_name PASSED${NC}"
    else
        echo -e "${RED}❌ $test_name FAILED${NC}"
        return 1
    fi
    
    echo ""
    echo "----------------------------------------"
    echo ""
}

# Check if server is running
check_server() {
    if curl -s http://localhost:3000 > /dev/null; then
        echo -e "${GREEN}✅ Development server is running${NC}"
        return 0
    else
        echo -e "${RED}❌ Development server is not running${NC}"
        echo "Please run: npm run dev"
        return 1
    fi
}

# Set AWS profile
export AWS_PROFILE=executa

echo -e "${YELLOW}📋 Pre-flight Checks${NC}"
echo "----------------------------------------"

# Check if server is running
if ! check_server; then
    exit 1
fi

# Check AWS credentials
if aws sts get-caller-identity > /dev/null 2>&1; then
    echo -e "${GREEN}✅ AWS credentials configured${NC}"
else
    echo -e "${RED}❌ AWS credentials not configured${NC}"
    echo "Please run: export AWS_PROFILE=executa"
fi

echo ""
echo "----------------------------------------"
echo ""

# Run tests
FAILED_TESTS=0

# Test 1: Database Tests
if ! run_test "Database Connection & Schema" "node scripts/test-database.js"; then
    ((FAILED_TESTS++))
fi

# Test 2: API Endpoint Tests
if ! run_test "API Endpoints" "node scripts/test-api-endpoints.js"; then
    ((FAILED_TESTS++))
fi

# Test 3: AWS Infrastructure Tests
if ! run_test "AWS Infrastructure" "node scripts/test-aws-infrastructure.js"; then
    ((FAILED_TESTS++))
fi

# Summary
echo "🏁 Test Suite Complete"
echo "======================================"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    echo ""
    echo -e "${GREEN}Your Executa SaaS is fully operational:${NC}"
    echo "✅ Database connected and working"
    echo "✅ Authentication system functional"
    echo "✅ AWS infrastructure accessible"
    echo "✅ Ready for production deployment"
    echo ""
    echo -e "${BLUE}💡 Next Steps:${NC}"
    echo "1. Add your OpenAI API key to .env"
    echo "2. Test the UI at http://localhost:3000"
    echo "3. Start building knowledge ingestion features"
    echo "4. Deploy to production when ready"
else
    echo -e "${RED}❌ $FAILED_TESTS test(s) failed${NC}"
    echo "Please check the output above and fix any issues."
    exit 1
fi 