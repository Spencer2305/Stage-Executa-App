#!/bin/bash

# Continue RDS Setup Script
# Use this if the main setup script got stuck

set -e

echo "🔄 Continuing AWS RDS PostgreSQL setup..."

# Configuration (same as original script)
DB_INSTANCE_IDENTIFIER="executa-postgres"
DB_NAME="executa_production"
DB_USERNAME="executa_admin"
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
DB_ENGINE="postgres"
DB_ENGINE_VERSION="15.4"
DB_INSTANCE_CLASS="db.t3.micro"
ALLOCATED_STORAGE=20
STORAGE_TYPE="gp2"
PORT=5432

# Security group ID from previous run
SECURITY_GROUP_ID="sg-0a512c73330378ca0"

echo "📋 Using existing security group: $SECURITY_GROUP_ID"

# Check if security group rule was added successfully
echo "🔍 Checking security group rules..."
RULE_EXISTS=$(aws ec2 describe-security-groups --group-ids $SECURITY_GROUP_ID --query 'SecurityGroups[0].IpPermissions[?FromPort==`5432`]' --output text)

if [ -z "$RULE_EXISTS" ]; then
    echo "🌐 Adding PostgreSQL inbound rule..."
    aws ec2 authorize-security-group-ingress \
        --group-id $SECURITY_GROUP_ID \
        --protocol tcp \
        --port 5432 \
        --cidr 0.0.0.0/0
else
    echo "✅ PostgreSQL rule already exists"
fi

# Get VPC ID
DEFAULT_VPC_ID=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --query 'Vpcs[0].VpcId' --output text)

# Create DB subnet group
echo "🏗️ Creating DB subnet group..."
SUBNET_IDS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$DEFAULT_VPC_ID" --query 'Subnets[*].SubnetId' --output text)
SUBNET_ARRAY=($SUBNET_IDS)

aws rds create-db-subnet-group \
    --db-subnet-group-name executa-subnet-group \
    --db-subnet-group-description "Subnet group for Executa RDS" \
    --subnet-ids ${SUBNET_ARRAY[@]} 2>/dev/null || echo "ℹ️ Subnet group already exists or created"

# Check if RDS instance already exists
echo "🔍 Checking if RDS instance exists..."
INSTANCE_EXISTS=$(aws rds describe-db-instances --db-instance-identifier $DB_INSTANCE_IDENTIFIER --query 'DBInstances[0].DBInstanceStatus' --output text 2>/dev/null || echo "NotFound")

if [ "$INSTANCE_EXISTS" = "NotFound" ]; then
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
else
    echo "ℹ️ RDS instance already exists with status: $INSTANCE_EXISTS"
    
    # If instance exists, get the existing password from AWS Secrets Manager or use a new one
    echo "⚠️ Using new password for existing instance setup"
fi

echo "💡 Waiting for instance to be available..."
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

echo "💾 Database credentials saved to .env.aws-rds"
echo ""
echo "📝 Next Steps:"
echo "1. Run: ./scripts/setup-env.sh"
echo "2. Run: ./scripts/test-auth.sh"
echo "3. Run: npm run dev" 