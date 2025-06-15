#!/bin/bash

# Setup New AWS Account for Executa
# Run this after creating your new AWS account

set -e

echo "🏗️ Setting up new AWS account for Executa..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Installing..."
    curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
    sudo installer -pkg AWSCLIV2.pkg -target /
    rm AWSCLIV2.pkg
fi

echo "📋 AWS CLI Configuration for Executa Account"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Before running this script, make sure you have:"
echo "1. ✅ Created your new AWS account"
echo "2. ✅ Set up MFA on root account"
echo "3. ✅ Created an IAM admin user with programmatic access"
echo "4. ✅ Downloaded the access keys for the IAM user"
echo ""

read -p "Have you completed the above steps? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please complete the AWS account setup first."
    echo ""
    echo "📖 Quick setup guide:"
    echo "1. Go to AWS Console → IAM → Users"
    echo "2. Create user: 'executa-admin'"
    echo "3. Attach policy: 'AdministratorAccess'"
    echo "4. Create access key → Download credentials"
    echo ""
    exit 1
fi

echo ""
echo "🔑 Configuring AWS CLI profile for Executa..."

# Create a named profile for Executa
aws configure --profile executa

echo ""
echo "🧪 Testing AWS configuration..."

# Test the configuration
if aws sts get-caller-identity --profile executa > /dev/null 2>&1; then
    echo "✅ AWS configuration successful!"
    
    # Get account info
    ACCOUNT_ID=$(aws sts get-caller-identity --profile executa --query Account --output text)
    USER_ARN=$(aws sts get-caller-identity --profile executa --query Arn --output text)
    
    echo ""
    echo "📋 Account Information:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Account ID: $ACCOUNT_ID"
    echo "User: $USER_ARN"
    echo ""
else
    echo "❌ AWS configuration failed!"
    echo "Please check your access keys and try again."
    exit 1
fi

# Set up environment variable for the profile
echo "🔧 Setting up environment variables..."

# Add to shell profile
SHELL_RC=""
if [ -f ~/.zshrc ]; then
    SHELL_RC="~/.zshrc"
elif [ -f ~/.bashrc ]; then
    SHELL_RC="~/.bashrc"
elif [ -f ~/.bash_profile ]; then
    SHELL_RC="~/.bash_profile"
fi

if [ ! -z "$SHELL_RC" ]; then
    echo "" >> $SHELL_RC
    echo "# Executa AWS Profile" >> $SHELL_RC
    echo "export AWS_PROFILE=executa" >> $SHELL_RC
    echo "export AWS_REGION=us-east-1" >> $SHELL_RC
    
    echo "✅ Added AWS_PROFILE=executa to $SHELL_RC"
    echo "💡 Run 'source $SHELL_RC' or restart terminal to apply"
fi

# Set for current session
export AWS_PROFILE=executa
export AWS_REGION=us-east-1

echo ""
echo "🚀 Setting up initial AWS resources..."

# Enable CloudTrail for auditing
echo "📊 Setting up CloudTrail for auditing..."
aws cloudtrail create-trail \
    --name executa-audit-trail \
    --s3-bucket-name executa-cloudtrail-logs-$ACCOUNT_ID \
    --include-global-service-events \
    --is-multi-region-trail \
    --enable-log-file-validation \
    --profile executa 2>/dev/null || echo "ℹ️ CloudTrail setup skipped (bucket may not exist yet)"

# Set up billing alerts
echo "💰 Setting up billing alerts..."
aws budgets create-budget \
    --account-id $ACCOUNT_ID \
    --budget '{
        "BudgetName": "Executa-Monthly-Budget",
        "BudgetLimit": {
            "Amount": "50",
            "Unit": "USD"
        },
        "TimeUnit": "MONTHLY",
        "BudgetType": "COST",
        "CostFilters": {}
    }' \
    --profile executa 2>/dev/null || echo "ℹ️ Budget creation skipped (may require additional permissions)"

echo ""
echo "✅ New AWS account setup complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Run: ./scripts/setup-aws-database.sh (will use new account)"
echo "2. All AWS resources will be created in your new account"
echo "3. Billing will be separate from other projects"
echo ""
echo "🔒 Security Recommendations:"
echo "- Enable GuardDuty for threat detection"
echo "- Set up AWS Config for compliance monitoring"
echo "- Use IAM roles for applications (not access keys)"
echo ""
echo "🎉 Ready to build Executa on your dedicated AWS account!" 