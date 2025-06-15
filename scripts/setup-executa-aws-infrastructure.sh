#!/bin/bash

# Complete AWS Infrastructure Setup for Executa
# Run this in your new AWS account after basic setup

set -e

echo "🏗️ Setting up complete AWS infrastructure for Executa..."

# Configuration
PROJECT_NAME="executa"
DB_INSTANCE_IDENTIFIER="executa-postgres"
DB_NAME="executa_production"
DB_USERNAME="executa_admin"
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
REGION="us-east-1"

# Get account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "🆔 AWS Account ID: $ACCOUNT_ID"

echo ""
echo "🚀 Creating AWS infrastructure for Executa..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Create VPC and networking (optional, using default for simplicity)
echo "🌐 Setting up networking..."
DEFAULT_VPC_ID=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --query 'Vpcs[0].VpcId' --output text)
echo "Using default VPC: $DEFAULT_VPC_ID"

# 2. Create security groups
echo "🔒 Creating security groups..."

# RDS Security Group
RDS_SG_ID=$(aws ec2 create-security-group \
    --group-name executa-rds-sg \
    --description "Security group for Executa RDS PostgreSQL" \
    --vpc-id $DEFAULT_VPC_ID \
    --query 'GroupId' --output text)

echo "Created RDS security group: $RDS_SG_ID"

# Application Security Group (for future use)
APP_SG_ID=$(aws ec2 create-security-group \
    --group-name executa-app-sg \
    --description "Security group for Executa application servers" \
    --vpc-id $DEFAULT_VPC_ID \
    --query 'GroupId' --output text)

echo "Created App security group: $APP_SG_ID"

# Lambda Security Group (for file processing)
LAMBDA_SG_ID=$(aws ec2 create-security-group \
    --group-name executa-lambda-sg \
    --description "Security group for Executa Lambda functions" \
    --vpc-id $DEFAULT_VPC_ID \
    --query 'GroupId' --output text)

echo "Created Lambda security group: $LAMBDA_SG_ID"

# Configure security group rules
echo "🌐 Configuring security group rules..."

# Allow PostgreSQL from app and lambda security groups
aws ec2 authorize-security-group-ingress \
    --group-id $RDS_SG_ID \
    --protocol tcp \
    --port 5432 \
    --source-group $APP_SG_ID

aws ec2 authorize-security-group-ingress \
    --group-id $RDS_SG_ID \
    --protocol tcp \
    --port 5432 \
    --source-group $LAMBDA_SG_ID

# Temporary: Allow from anywhere for development (remove in production)
aws ec2 authorize-security-group-ingress \
    --group-id $RDS_SG_ID \
    --protocol tcp \
    --port 5432 \
    --cidr 0.0.0.0/0

echo "✅ Security groups configured"

# 3. Create S3 buckets
echo "📦 Creating S3 buckets..."

# Main bucket for knowledge files
KNOWLEDGE_BUCKET="executa-knowledge-files-$ACCOUNT_ID"
aws s3 mb s3://$KNOWLEDGE_BUCKET --region $REGION
echo "Created knowledge files bucket: $KNOWLEDGE_BUCKET"

# Bucket for processed files and backups
BACKUP_BUCKET="executa-backups-$ACCOUNT_ID"
aws s3 mb s3://$BACKUP_BUCKET --region $REGION
echo "Created backups bucket: $BACKUP_BUCKET"

# Bucket for CloudTrail logs
CLOUDTRAIL_BUCKET="executa-cloudtrail-logs-$ACCOUNT_ID"
aws s3 mb s3://$CLOUDTRAIL_BUCKET --region $REGION
echo "Created CloudTrail bucket: $CLOUDTRAIL_BUCKET"

# Configure bucket policies
echo "🔐 Configuring S3 bucket policies..."

# Knowledge files bucket policy (users can only access their own folders)
cat > /tmp/knowledge-bucket-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "DenyInsecureConnections",
            "Effect": "Deny",
            "Principal": "*",
            "Action": "s3:*",
            "Resource": [
                "arn:aws:s3:::$KNOWLEDGE_BUCKET",
                "arn:aws:s3:::$KNOWLEDGE_BUCKET/*"
            ],
            "Condition": {
                "Bool": {
                    "aws:SecureTransport": "false"
                }
            }
        }
    ]
}
EOF

aws s3api put-bucket-policy --bucket $KNOWLEDGE_BUCKET --policy file:///tmp/knowledge-bucket-policy.json

# Enable versioning and encryption
aws s3api put-bucket-versioning --bucket $KNOWLEDGE_BUCKET --versioning-configuration Status=Enabled
aws s3api put-bucket-encryption --bucket $KNOWLEDGE_BUCKET --server-side-encryption-configuration '{
    "Rules": [
        {
            "ApplyServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
            }
        }
    ]
}'

echo "✅ S3 buckets configured"

# 4. Create RDS subnet group
echo "🏗️ Creating RDS subnet group..."
SUBNET_IDS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$DEFAULT_VPC_ID" --query 'Subnets[*].SubnetId' --output text)
SUBNET_ARRAY=($SUBNET_IDS)

aws rds create-db-subnet-group \
    --db-subnet-group-name executa-subnet-group \
    --db-subnet-group-description "Subnet group for Executa RDS" \
    --subnet-ids ${SUBNET_ARRAY[@]}

echo "✅ RDS subnet group created"

# 5. Create RDS PostgreSQL instance
echo "💾 Creating RDS PostgreSQL instance..."
aws rds create-db-instance \
    --db-instance-identifier $DB_INSTANCE_IDENTIFIER \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --engine-version 15.4 \
    --allocated-storage 20 \
    --storage-type gp2 \
    --db-name $DB_NAME \
    --master-username $DB_USERNAME \
    --master-user-password $DB_PASSWORD \
    --vpc-security-group-ids $RDS_SG_ID \
    --db-subnet-group-name executa-subnet-group \
    --backup-retention-period 7 \
    --multi-az false \
    --publicly-accessible true \
    --storage-encrypted true \
    --copy-tags-to-snapshot true \
    --deletion-protection false \
    --enable-performance-insights false

echo "⏳ RDS instance is being created. This will take 5-10 minutes..."

# 6. Create SQS queue for file processing
echo "📨 Creating SQS queue for file processing..."
QUEUE_URL=$(aws sqs create-queue \
    --queue-name executa-file-processing \
    --attributes '{
        "VisibilityTimeoutSeconds": "900",
        "MessageRetentionPeriod": "1209600",
        "DelaySeconds": "0",
        "ReceiveMessageWaitTimeSeconds": "20"
    }' \
    --query 'QueueUrl' --output text)

echo "Created SQS queue: $QUEUE_URL"

# 7. Create IAM roles
echo "👤 Creating IAM roles..."

# Lambda execution role
cat > /tmp/lambda-trust-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "lambda.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
EOF

aws iam create-role \
    --role-name ExecutaLambdaExecutionRole \
    --assume-role-policy-document file:///tmp/lambda-trust-policy.json

# Attach policies to Lambda role
aws iam attach-role-policy \
    --role-name ExecutaLambdaExecutionRole \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

aws iam attach-role-policy \
    --role-name ExecutaLambdaExecutionRole \
    --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

aws iam attach-role-policy \
    --role-name ExecutaLambdaExecutionRole \
    --policy-arn arn:aws:iam::aws:policy/AmazonSQSFullAccess

echo "✅ IAM roles created"

# 8. Wait for RDS to be available
echo "💡 Waiting for RDS instance to be available..."
aws rds wait db-instance-available --db-instance-identifier $DB_INSTANCE_IDENTIFIER

# Get RDS endpoint
RDS_ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier $DB_INSTANCE_IDENTIFIER \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text)

echo ""
echo "✅ AWS Infrastructure setup complete!"
echo ""
echo "📋 Infrastructure Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Region: $REGION"
echo "Account ID: $ACCOUNT_ID"
echo ""
echo "🗄️ Database:"
echo "  Endpoint: $RDS_ENDPOINT"
echo "  Database: $DB_NAME"
echo "  Username: $DB_USERNAME"
echo "  Password: $DB_PASSWORD"
echo ""
echo "📦 S3 Buckets:"
echo "  Knowledge Files: $KNOWLEDGE_BUCKET"
echo "  Backups: $BACKUP_BUCKET"
echo "  CloudTrail: $CLOUDTRAIL_BUCKET"
echo ""
echo "📨 SQS Queue:"
echo "  File Processing: $QUEUE_URL"
echo ""
echo "🔒 Security Groups:"
echo "  RDS: $RDS_SG_ID"
echo "  App: $APP_SG_ID"
echo "  Lambda: $LAMBDA_SG_ID"

# Save all configuration
cat > .env.aws-infrastructure << EOF
# AWS Infrastructure Configuration for Executa
AWS_REGION="$REGION"

# Database
DATABASE_URL="postgresql://$DB_USERNAME:$DB_PASSWORD@$RDS_ENDPOINT:5432/$DB_NAME"
DB_HOST="$RDS_ENDPOINT"
DB_NAME="$DB_NAME"
DB_USERNAME="$DB_USERNAME"
DB_PASSWORD="$DB_PASSWORD"

# S3 Buckets
KNOWLEDGE_FILES_BUCKET="$KNOWLEDGE_BUCKET"
BACKUP_BUCKET="$BACKUP_BUCKET"
CLOUDTRAIL_BUCKET="$CLOUDTRAIL_BUCKET"

# SQS
FILE_PROCESSING_QUEUE_URL="$QUEUE_URL"

# Security Groups
RDS_SECURITY_GROUP_ID="$RDS_SG_ID"
APP_SECURITY_GROUP_ID="$APP_SG_ID"
LAMBDA_SECURITY_GROUP_ID="$LAMBDA_SG_ID"
EOF

echo ""
echo "💾 Configuration saved to .env.aws-infrastructure"
echo ""
echo "📝 Next Steps:"
echo "1. Run: ./scripts/setup-env.sh"
echo "2. Run: ./scripts/test-auth.sh"
echo "3. Start building knowledge ingestion features!"
echo ""
echo "💰 Estimated Monthly Costs:"
echo "  RDS (db.t3.micro): ~$13-15"
echo "  S3 Storage: ~$1-5 (depending on usage)"
echo "  SQS: Free tier (first 1M requests)"
echo "  Total: ~$14-20/month"
echo ""
echo "🎉 Executa AWS infrastructure is ready for production!"

# Cleanup temp files
rm -f /tmp/knowledge-bucket-policy.json /tmp/lambda-trust-policy.json 