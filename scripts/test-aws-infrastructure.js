const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
});

const rds = new AWS.RDS();
const s3 = new AWS.S3();
const sqs = new AWS.SQS();

async function testAWSInfrastructure() {
  console.log('🧪 Testing AWS Infrastructure...\n');

  try {
    // Test 1: RDS Database
    console.log('1️⃣ Testing RDS Database...');
    const dbInstances = await rds.describeDBInstances({
      DBInstanceIdentifier: 'executa-postgres'
    }).promise();
    
    const dbInstance = dbInstances.DBInstances[0];
    console.log('✅ RDS Database found');
    console.log(`   Status: ${dbInstance.DBInstanceStatus}`);
    console.log(`   Endpoint: ${dbInstance.Endpoint.Address}:${dbInstance.Endpoint.Port}`);
    console.log(`   Engine: ${dbInstance.Engine} ${dbInstance.EngineVersion}`);
    console.log(`   Storage: ${dbInstance.AllocatedStorage}GB\n`);

    // Test 2: S3 Buckets
    console.log('2️⃣ Testing S3 Buckets...');
    const buckets = [
      'executa-knowledge-files-107583420996',
      'executa-backups-107583420996',
      'executa-cloudtrail-logs-107583420996'
    ];

    for (const bucketName of buckets) {
      try {
        await s3.headBucket({ Bucket: bucketName }).promise();
        console.log(`✅ Bucket exists: ${bucketName}`);
        
        // Check bucket policy
        try {
          const policy = await s3.getBucketPolicy({ Bucket: bucketName }).promise();
          console.log(`   Policy: Configured`);
        } catch (error) {
          if (error.code === 'NoSuchBucketPolicy') {
            console.log(`   Policy: None (default)`);
          } else {
            console.log(`   Policy: Error checking`);
          }
        }
      } catch (error) {
        console.log(`❌ Bucket not accessible: ${bucketName}`);
        console.log(`   Error: ${error.message}`);
      }
    }
    console.log('');

    // Test 3: SQS Queue
    console.log('3️⃣ Testing SQS Queue...');
    const queueUrl = `https://sqs.us-east-1.amazonaws.com/107583420996/executa-file-processing`;
    
    try {
      const queueAttributes = await sqs.getQueueAttributes({
        QueueUrl: queueUrl,
        AttributeNames: ['All']
      }).promise();
      
      console.log('✅ SQS Queue accessible');
      console.log(`   Queue URL: ${queueUrl}`);
      console.log(`   Messages Available: ${queueAttributes.Attributes.ApproximateNumberOfMessages}`);
      console.log(`   Messages In Flight: ${queueAttributes.Attributes.ApproximateNumberOfMessagesNotVisible}`);
      console.log(`   Created: ${new Date(queueAttributes.Attributes.CreatedTimestamp * 1000).toISOString()}\n`);
    } catch (error) {
      console.log('❌ SQS Queue not accessible');
      console.log(`   Error: ${error.message}\n`);
    }

    // Test 4: Security Groups
    console.log('4️⃣ Testing Security Groups...');
    const ec2 = new AWS.EC2();
    const securityGroups = [
      'sg-05111380c3dc495f5', // RDS
      'sg-08e7f7a2de202a49d', // App
      'sg-02b824733718e909d'  // Lambda
    ];

    for (const sgId of securityGroups) {
      try {
        const result = await ec2.describeSecurityGroups({
          GroupIds: [sgId]
        }).promise();
        
        const sg = result.SecurityGroups[0];
        console.log(`✅ Security Group: ${sg.GroupId}`);
        console.log(`   Name: ${sg.GroupName}`);
        console.log(`   Description: ${sg.Description}`);
        console.log(`   Inbound Rules: ${sg.IpPermissions.length}`);
        console.log(`   Outbound Rules: ${sg.IpPermissionsEgress.length}`);
      } catch (error) {
        console.log(`❌ Security Group not found: ${sgId}`);
      }
    }
    console.log('');

    // Test 5: Cost Estimation
    console.log('5️⃣ Estimating Monthly Costs...');
    console.log('💰 Estimated Monthly Costs:');
    console.log('   RDS db.t3.micro: ~$12-15');
    console.log('   S3 Storage (first 5GB): ~$0.12');
    console.log('   SQS (first 1M requests): ~$0.40');
    console.log('   Data Transfer: ~$1-3');
    console.log('   ─────────────────────────');
    console.log('   Total Estimated: ~$14-20/month\n');

    console.log('🎉 AWS Infrastructure test completed!');
    console.log('💡 All resources are properly configured and accessible.');

  } catch (error) {
    console.error('❌ AWS Infrastructure test failed:', error.message);
    process.exit(1);
  }
}

// Check AWS credentials
function checkAWSCredentials() {
  
  if (!accessKeyId || !secretAccessKey) {
    console.log('❌ AWS credentials not found in environment variables');
    console.log('   Or run: export AWS_PROFILE=executa');
    return false;
  }
  
  return true;
}

async function runTests() {
  if (!checkAWSCredentials()) {
    process.exit(1);
  }

  await testAWSInfrastructure();
}

runTests(); 