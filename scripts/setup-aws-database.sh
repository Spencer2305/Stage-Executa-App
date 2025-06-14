#!/bin/bash

# AWS RDS PostgreSQL Setup Script for Executa
# This script creates a production-ready PostgreSQL database on AWS RDS

set -e

echo "🚀 Setting up AWS RDS PostgreSQL for Executa..."

# Configuration
DB_INSTANCE_IDENTIFIER="executa-postgres"
DB_NAME="executa_production"
DB_USERNAME="executa_admin"
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
DB_ENGINE="postgres"
DB_ENGINE_VERSION="15.4"
DB_INSTANCE_CLASS="db.t3.micro"  # Free tier eligible
ALLOCATED_STORAGE=20
STORAGE_TYPE="gp2"
PORT=5432

# Get default VPC ID
echo "📡 Getting default VPC..."
DEFAULT_VPC_ID=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --query 'Vpcs[0].VpcId' --output text)
echo "Using VPC: $DEFAULT_VPC_ID"

# Create security group for RDS
echo "🔒 Creating security group..."
SECURITY_GROUP_ID=$(aws ec2 create-security-group \
    --group-name executa-rds-sg \
    --description "Security group for Executa RDS PostgreSQL" \
    --vpc-id $DEFAULT_VPC_ID \
    --query 'GroupId' --output text)

echo "Created security group: $SECURITY_GROUP_ID"

# Add inbound rule for PostgreSQL (port 5432) from anywhere (you should restrict this in production)
echo "🌐 Adding PostgreSQL inbound rule..."
aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 5432 \
    --cidr 0.0.0.0/0

# Create DB subnet group
echo "🏗️ Creating DB subnet group..."
SUBNET_IDS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$DEFAULT_VPC_ID" --query 'Subnets[*].SubnetId' --output text)
SUBNET_ARRAY=($SUBNET_IDS)

aws rds create-db-subnet-group \
    --db-subnet-group-name executa-subnet-group \
    --db-subnet-group-description "Subnet group for Executa RDS" \
    --subnet-ids ${SUBNET_ARRAY[@]} || echo "Subnet group might already exist"

# Create RDS instance
echo "💾 Creating RDS PostgreSQL instance..."
aws rds create-db-instance \
    --db-instance-identifier $DB_INSTANCE_IDENTIFIER \
    --db-instance-class $DB_INSTANCE_CLASS \
    --engine $DB_ENGINE \
    --engine-version $DB_ENGINE_VERSION \
    --allocated-storage $ALLOCATED_STORAGE \
    --storage-type $STORAGE_TYPE \
    --db-name $DB_NAME \
    --master-username $DB_USERNAME \
    --master-user-password $DB_PASSWORD \
    --vpc-security-group-ids $SECURITY_GROUP_ID \
    --db-subnet-group-name executa-subnet-group \
    --backup-retention-period 7 \
    --multi-az false \
    --publicly-accessible true \
    --storage-encrypted true \
    --copy-tags-to-snapshot true \
    --deletion-protection false \
    --enable-performance-insights false

echo "⏳ RDS instance is being created. This will take 5-10 minutes..."
echo "💡 Waiting for instance to be available..."

# Wait for RDS instance to be available
aws rds wait db-instance-available --db-instance-identifier $DB_INSTANCE_IDENTIFIER

# Get RDS endpoint
echo "🔍 Getting RDS endpoint..."
RDS_ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier $DB_INSTANCE_IDENTIFIER \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text)

echo ""
echo "✅ AWS RDS PostgreSQL setup complete!"
echo ""
echo "📋 Database Information:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Instance ID: $DB_INSTANCE_IDENTIFIER"
echo "Database Name: $DB_NAME"
echo "Username: $DB_USERNAME"  
echo "Password: $DB_PASSWORD"
echo "Endpoint: $RDS_ENDPOINT"
echo "Port: $PORT"
echo ""
echo "🔗 Connection String:"
echo "DATABASE_URL=\"postgresql://$DB_USERNAME:$DB_PASSWORD@$RDS_ENDPOINT:$PORT/$DB_NAME\""
echo ""
echo "📝 Next Steps:"
echo "1. Add the DATABASE_URL to your .env.local file"
echo "2. Run: npx prisma generate"
echo "3. Run: npx prisma db push"
echo "4. Test your application!"
echo ""
echo "💰 Cost: ~$13-15/month (db.t3.micro with 20GB storage)"
echo "🔒 Security: Update security group to restrict access to your IP only"

# Save credentials to file
cat > .env.aws-rds << EOF
# AWS RDS PostgreSQL Configuration
DATABASE_URL="postgresql://$DB_USERNAME:$DB_PASSWORD@$RDS_ENDPOINT:$PORT/$DB_NAME"
DB_HOST="$RDS_ENDPOINT"
DB_PORT="$PORT"
DB_NAME="$DB_NAME"
DB_USERNAME="$DB_USERNAME"
DB_PASSWORD="$DB_PASSWORD"
EOF

echo ""
echo "💾 Database credentials saved to .env.aws-rds"
echo "🚨 IMPORTANT: Keep these credentials secure!" 